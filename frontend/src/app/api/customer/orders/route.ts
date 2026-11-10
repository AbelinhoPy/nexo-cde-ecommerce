import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, getPool } from "@/lib/db";
import { verifyCustomerToken } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-customer-token");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Sesión inválida" }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: true, pedidos: [] });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // 1. Obtener pedidos del cliente
      const pedidosRes = await client.query(
        `
        SELECT 
          p.id,
          p.codigo_pedido,
          p.monto_productos_pyg,
          p.monto_flete_pyg,
          p.cupon_codigo,
          p.descuento_cupon_pyg,
          p.total_pagar_pyg,
          p.estado,
          p.fecha_pago,
          p.numero_guia_tsi,
          p.created_at
        FROM pedidos p
        WHERE p.cliente_id = $1
        ORDER BY p.created_at DESC;
        `,
        [payload.id]
      );

      // 2. Obtener items de cada pedido
      const pedidosConItems = await Promise.all(
        pedidosRes.rows.map(async (ped: any) => {
          const itemsRes = await client.query(
            `
            SELECT 
              pi.id,
              pi.cantidad,
              pi.precio_unitario_pyg,
              pi.subtotal_pyg,
              COALESCE(pr.nombre, 'Producto Mayorista CDE') AS producto_nombre,
              COALESCE(pr.sku, '') AS sku,
              COALESCE(pr.imagen_url, '') AS imagen_url
            FROM pedido_items pi
            LEFT JOIN productos pr ON pi.producto_id = pr.id
            WHERE pi.pedido_id = $1;
            `,
            [ped.id]
          );

          return {
            id: ped.id,
            codigoPedido: ped.codigo_pedido,
            montoProductosPyg: Number(ped.monto_productos_pyg),
            montoFletePyg: Number(ped.monto_flete_pyg),
            cuponCodigo: ped.cupon_codigo,
            descuentoCuponPyg: Number(ped.descuento_cupon_pyg || 0),
            totalPagarPyg: Number(ped.total_pagar_pyg),
            estado: ped.estado,
            fechaPago: ped.fecha_pago,
            numeroGuiaTsi: ped.numero_guia_tsi,
            trackingUrl: ped.numero_guia_tsi ? `https://tsi.com.py/tracking?guia=${encodeURIComponent(ped.numero_guia_tsi)}` : null,
            createdAt: ped.created_at,
            items: itemsRes.rows.map((it: any) => ({
              nombre: it.producto_nombre,
              sku: it.sku,
              cantidad: Number(it.cantidad),
              precioPyg: Number(it.precio_unitario_pyg),
              subtotalPyg: Number(it.subtotal_pyg),
              imagen: it.imagen_url,
            })),
          };
        })
      );

      return NextResponse.json({
        success: true,
        pedidos: pedidosConItems,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error obteniendo compras anteriores:", err);
    return NextResponse.json(
      { success: false, error: "Error consultando compras anteriores." },
      { status: 500 }
    );
  }
}
