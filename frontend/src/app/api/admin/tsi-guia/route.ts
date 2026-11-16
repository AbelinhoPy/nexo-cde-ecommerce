import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";
import { sendShippingDispatchEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 0. Verificación de autorización administrativa
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.reason || "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const { codigoPedido, numeroGuiaTsi, telefonoCliente, nombreCliente, fotoGuiaTsi } = await req.json();

    if (!codigoPedido || !numeroGuiaTsi || !numeroGuiaTsi.trim()) {
      return NextResponse.json(
        { success: false, error: "El código de pedido y el número de guía TSI son obligatorios." },
        { status: 400 }
      );
    }

    // Regla de negocio estricta: para marcar como Enviado se requiere número de guía Y foto del comprobante
    if (!fotoGuiaTsi) {
      return NextResponse.json(
        { success: false, error: "Es obligatorio adjuntar la foto del comprobante físico emitido en ventanilla TSI para marcar como «Enviado»." },
        { status: 400 }
      );
    }

    // 1. Limpieza y validación de número de guía
    const guiaSanitizada = numeroGuiaTsi.trim().toUpperCase();

    // 2. Persistencia en Neon DB
    let clienteEmail: string | null = null;
    let destinoTexto: string = "Interior de Paraguay";

    if (isDbConfigured()) {
      try {
        const pedRows = await query<any>(
          `SELECT p.id, p.destino_ciudad, p.destino_departamento, c.email, c.nombre_completo
           FROM pedidos p
           JOIN clientes c ON p.cliente_id = c.id
           WHERE p.codigo_pedido = $1;`,
          [codigoPedido.trim()]
        );

        if (pedRows.length > 0) {
          clienteEmail = pedRows[0].email;
          const ciu = pedRows[0].destino_ciudad || "Interior";
          const dep = pedRows[0].destino_departamento || "Paraguay";
          destinoTexto = `${ciu} (${dep})`;
        }

        await query(
          `
          UPDATE pedidos
          SET estado = 'ENVIADO',
              numero_guia_tsi = $1,
              foto_guia_tsi = $2
          WHERE codigo_pedido = $3;
          `,
          [guiaSanitizada, fotoGuiaTsi, codigoPedido.trim()]
        );

        await query(
          `
          UPDATE agenda_despacho
          SET estado_despacho = 'DESPACHADO'
          WHERE pedido_id = (SELECT id FROM pedidos WHERE codigo_pedido = $1);
          `,
          [codigoPedido.trim()]
        );
      } catch (errDb) {
        console.error("Error actualizando guía en Neon:", errDb);
      }
    }

    // 3. Envío de Correo de Notificación de Despacho al Cliente (si tiene email)
    if (clienteEmail && clienteEmail.includes("@")) {
      try {
        await sendShippingDispatchEmail({
          email: clienteEmail.trim(),
          nombre: nombreCliente || "Estimado/a Cliente",
          codigoPedido: codigoPedido.trim(),
          numeroGuiaTsi: guiaSanitizada,
          destino: destinoTexto,
        });

        if (isDbConfigured()) {
          await query(
            `UPDATE pedidos SET notificacion_despacho_enviada = TRUE WHERE codigo_pedido = $1;`,
            [codigoPedido.trim()]
          );
        }
      } catch (errEmail) {
        console.warn("Aviso: No se pudo enviar el email de despacho al comprador:", errEmail);
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `✓ Guía TSI ${guiaSanitizada} y comprobante vinculados exitosamente a ${codigoPedido}. Pedido en estado «Enviado».`,
      pedido: {
        codigo: codigoPedido,
        estado: "ENVIADO",
        numero_guia: guiaSanitizada,
        fecha_despacho: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error registrando guía TSI:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al procesar guía TSI." },
      { status: 500 }
    );
  }
}
