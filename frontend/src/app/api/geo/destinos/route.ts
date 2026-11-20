import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departamento = searchParams.get("departamento");

    if (!isDbConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "No pudimos consultar la cobertura TSI. Servicio temporalmente no disponible.",
          codigoError: "DB_NO_CONFIGURADA",
          destinos: [],
        },
        { status: 503 }
      );
    }

    try {
      let sql = `
        SELECT 
          id, departamento, ciudad, agencia_nombre, modalidad,
          flete_regular_pyg, flete_pesado_pyg, cobertura_habilitada,
          tiempo_estimado, observaciones, fuente_informacion, fecha_actualizacion
        FROM destinos_tsi
      `;
      const params: any[] = [];
      if (departamento) {
        sql += ` WHERE LOWER(TRIM(departamento)) = LOWER(TRIM($1))`;
        params.push(departamento);
      }
      sql += ` ORDER BY departamento ASC, ciudad ASC;`;

      const rows = await query<any>(sql, params);

      // Si la base responde (incluso 0 filas si el departamento no tiene cobertura),
      // se devuelve el resultado real de la base de datos sin inyectar destinos ficticios.
      const items = (rows || []).map((r) => ({
        id: r.id,
        departamento: r.departamento,
        ciudad: r.ciudad,
        agenciaNombre: r.agencia_nombre,
        modalidad: r.modalidad,
        fleteRegularPyg: r.flete_regular_pyg !== null ? Number(r.flete_regular_pyg) : null,
        fletePesadoPyg: r.flete_pesado_pyg !== null ? Number(r.flete_pesado_pyg) : null,
        coberturaHabilitada: Boolean(r.cobertura_habilitada),
        tiempoEstimado: r.tiempo_estimado,
        observaciones: r.observaciones,
        fuenteInformacion: r.fuente_informacion || "Tarifario Oficial TSI Paraguay - Noviembre 2026",
        fechaActualizacion: r.fecha_actualizacion,
        requiereCotizacion: r.flete_regular_pyg === null || r.flete_pesado_pyg === null,
      }));

      return NextResponse.json({
        success: true,
        destinos: items,
        fuente: "Tarifario Oficial TSI Paraguay - Noviembre 2026",
      });
    } catch (dbErr: any) {
      console.error("[Destinos TSI API] Error consultando destinos_tsi en Neon:", dbErr);
      return NextResponse.json(
        {
          success: false,
          error: "No pudimos consultar los destinos de envío. Volvé a intentar.",
          codigoError: "ERROR_CONSULTA_COBERTURA",
          destinos: [],
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("Error inesperado en /api/geo/destinos:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno procesando destinos TSI.",
        codigoError: "INTERNAL_ERROR",
        destinos: [],
      },
      { status: 500 }
    );
  }
}
