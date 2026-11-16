import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no configurada." }, { status: 500 });
    }

    const rows = await query<any>(`
      SELECT 
        id, departamento, ciudad, agencia_nombre, modalidad,
        flete_regular_pyg, flete_pesado_pyg, cobertura_habilitada,
        tiempo_estimado, observaciones, fuente_informacion, fecha_actualizacion,
        created_at
      FROM destinos_tsi
      ORDER BY departamento ASC, ciudad ASC;
    `);

    return NextResponse.json({ success: true, destinos: rows });
  } catch (err: any) {
    console.error("Error en admin/destinos GET:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no configurada." }, { status: 500 });
    }

    const body = await req.json();
    const {
      id,
      departamento,
      ciudad,
      agenciaNombre,
      modalidad,
      fleteRegularPyg,
      fletePesadoPyg,
      coberturaHabilitada,
      tiempoEstimado,
      observaciones,
    } = body;

    if (!departamento || !ciudad) {
      return NextResponse.json(
        { success: false, error: "Departamento y Ciudad son obligatorios." },
        { status: 400 }
      );
    }

    const reg = fleteRegularPyg !== "" && fleteRegularPyg !== null ? Number(fleteRegularPyg) : null;
    const pes = fletePesadoPyg !== "" && fletePesadoPyg !== null ? Number(fletePesadoPyg) : null;
    const cob = Boolean(coberturaHabilitada);

    if (id) {
      // Actualizar registro existente
      await query(
        `UPDATE destinos_tsi
         SET departamento = $1,
             ciudad = $2,
             agencia_nombre = $3,
             modalidad = $4,
             flete_regular_pyg = $5,
             flete_pesado_pyg = $6,
             cobertura_habilitada = $7,
             tiempo_estimado = $8,
             observaciones = $9,
             fecha_actualizacion = CURRENT_DATE
         WHERE id = $10;`,
        [departamento.trim(), ciudad.trim(), agenciaNombre || null, modalidad || "DOMICILIO_Y_AGENCIA", reg, pes, cob, tiempoEstimado || "24 a 48 hs", observaciones || null, id]
      );
      return NextResponse.json({ success: true, mensaje: `✓ Destino ${ciudad} actualizado exitosamente.` });
    } else {
      // Crear o actualizar en conflicto
      await query(
        `INSERT INTO destinos_tsi (
           departamento, ciudad, agencia_nombre, modalidad,
           flete_regular_pyg, flete_pesado_pyg, cobertura_habilitada,
           tiempo_estimado, observaciones, fecha_actualizacion
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
         ON CONFLICT (departamento, ciudad) DO UPDATE SET
           agencia_nombre = EXCLUDED.agencia_nombre,
           modalidad = EXCLUDED.modalidad,
           flete_regular_pyg = EXCLUDED.flete_regular_pyg,
           flete_pesado_pyg = EXCLUDED.flete_pesado_pyg,
           cobertura_habilitada = EXCLUDED.cobertura_habilitada,
           tiempo_estimado = EXCLUDED.tiempo_estimado,
           observaciones = EXCLUDED.observaciones,
           fecha_actualizacion = CURRENT_DATE;`,
        [departamento.trim(), ciudad.trim(), agenciaNombre || null, modalidad || "DOMICILIO_Y_AGENCIA", reg, pes, cob, tiempoEstimado || "24 a 48 hs", observaciones || null]
      );
      return NextResponse.json({ success: true, mensaje: `✓ Destino ${ciudad} registrado exitosamente.` });
    }
  } catch (err: any) {
    console.error("Error en admin/destinos POST:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
