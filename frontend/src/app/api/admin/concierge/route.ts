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
      return NextResponse.json({ success: true, solicitudes: [] });
    }

    const solicitudes = await query(`
      SELECT 
        id,
        nombre,
        telefono,
        email,
        producto_solicitado,
        link_referencia,
        presupuesto_estimado,
        ciudad_destino,
        estado,
        notas,
        created_at
      FROM solicitudes_concierge
      ORDER BY created_at DESC
      LIMIT 100;
    `);

    return NextResponse.json({ success: true, solicitudes });
  } catch (err: any) {
    console.error("Error en admin/concierge:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
