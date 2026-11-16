import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";
import { verifyCustomerToken } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const { codigo } = params;
    if (!codigo) {
      return NextResponse.json({ success: false, error: "Código de pedido requerido" }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no disponible" }, { status: 503 });
    }

    // 1. Verificar si es Administrador
    const adminCheck = verifyAdminAccess(req);
    const esAdmin = adminCheck.authorized;

    // 2. Verificar si es Cliente Autenticado
    const authHeader = req.headers.get("authorization") || req.headers.get("x-customer-token");
    const token = authHeader?.replace("Bearer ", "").trim();
    const customer = token ? verifyCustomerToken(token) : null;

    if (!esAdmin && !customer) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: debe identificarse como administrador o comprador autorizado." },
        { status: 401 }
      );
    }

    // 3. Buscar el pedido en la base de datos
    const rows = await query<any>(
      `SELECT p.id, p.codigo_pedido, p.cliente_id, p.estado, p.numero_guia_tsi, p.foto_guia_tsi
       FROM pedidos p
       WHERE p.codigo_pedido = $1;`,
      [codigo.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    const pedido = rows[0];

    // 4. Si es cliente, validar que el pedido le pertenece
    if (!esAdmin) {
      if (pedido.cliente_id !== customer?.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Acceso no autorizado: este comprobante pertenece a otro comprador.",
          },
          { status: 403 }
        );
      }
    }

    if (!pedido.foto_guia_tsi) {
      return NextResponse.json(
        { success: false, error: "Este pedido aún no cuenta con comprobante físico adjunto." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      codigoPedido: pedido.codigo_pedido,
      guia: pedido.numero_guia_tsi,
      fotoGuiaTsi: pedido.foto_guia_tsi,
    });
  } catch (err: any) {
    console.error("Error consultando comprobante:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
