import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";
import { decryptAES256Buffer } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: true, pedidos: [] });
    }

    const rows = await query<any>(`
      SELECT 
        p.id,
        p.codigo_pedido,
        p.total_pagar_pyg,
        p.monto_flete_pyg,
        p.estado,
        p.numero_guia_tsi,
        p.foto_guia_tsi,
        p.created_at,
        c.nombre_completo,
        c.ciudad_destino,
        c.departamento,
        c.telefono_cifrado,
        c.direccion_cifrada
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 100;
    `);

    const pedidos = rows.map((row: any) => {
      let tel = "";
      let dir = "";
      try {
        if (row.telefono_cifrado) tel = decryptAES256Buffer(row.telefono_cifrado);
        if (row.direccion_cifrada) dir = decryptAES256Buffer(row.direccion_cifrada);
      } catch (e) {
        tel = "Protegido";
      }

      return {
        id: row.id,
        codigo: row.codigo_pedido,
        cliente: row.nombre_completo,
        telefono: tel,
        ciudad: row.ciudad_destino,
        departamento: row.departamento,
        direccion: dir,
        fletePyg: Number(row.monto_flete_pyg),
        totalPyg: Number(row.total_pagar_pyg),
        estado: row.estado,
        guia: row.numero_guia_tsi || "",
        fotoGuiaTsi: row.foto_guia_tsi || null,
        createdAt: row.created_at
      };
    });

    return NextResponse.json({ success: true, pedidos });
  } catch (err: any) {
    console.error("Error en admin/orders:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
