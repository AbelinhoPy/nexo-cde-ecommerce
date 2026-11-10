import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, getPool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre,
      telefono,
      email,
      productoSolicitado,
      linkReferencia,
      presupuestoEstimado,
      ciudadDestino,
      notas
    } = body;

    if (!nombre || !telefono || !productoSolicitado) {
      return NextResponse.json(
        { success: false, error: "Nombre, teléfono y producto solicitado son obligatorios." },
        { status: 400 }
      );
    }

    if (isDbConfigured()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query(
          `
          INSERT INTO solicitudes_concierge (
            nombre,
            telefono,
            email,
            producto_solicitado,
            link_referencia,
            presupuesto_estimado,
            ciudad_destino,
            notas
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
          [
            nombre.trim(),
            telefono.trim(),
            email ? email.trim().toLowerCase() : null,
            productoSolicitado.trim(),
            linkReferencia ? linkReferencia.trim() : null,
            presupuestoEstimado ? presupuestoEstimado.trim() : null,
            ciudadDestino ? ciudadDestino.trim() : null,
            notas ? notas.trim() : null
          ]
        );
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: "¡Solicitud recibida! Verificaremos en Atacado Connect y te enviaremos la cotización mayorista por WhatsApp.",
    });
  } catch (error: any) {
    console.error("Error en solicitud concierge:", error);
    return NextResponse.json(
      { success: false, error: "Error procesando solicitud de producto especial." },
      { status: 500 }
    );
  }
}
