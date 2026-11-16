import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyCustomerToken } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-customer-token");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión para confirmar la recepción de tu pedido." },
        { status: 401 }
      );
    }

    const customer = verifyCustomerToken(token);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Sesión expirada o inválida. Inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    const { pedidoId, codigoPedido } = await req.json();

    if (!pedidoId && !codigoPedido) {
      return NextResponse.json(
        { success: false, error: "Identificador de pedido requerido." },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no disponible." }, { status: 503 });
    }

    // 1. Obtener el pedido y verificar permisos
    const rows = await query<any>(
      `SELECT id, codigo_pedido, cliente_id, estado, fecha_confirmacion_entrega
       FROM pedidos
       WHERE (id::text = $1 OR codigo_pedido = $2)
       LIMIT 1;`,
      [pedidoId || "", codigoPedido || ""]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado." }, { status: 404 });
    }

    const pedido = rows[0];

    // 2. Validar que el comprador autenticado sea el dueño legítimo del pedido
    if (pedido.cliente_id !== customer.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: solo el comprador autenticado titular del pedido puede confirmar su entrega.",
        },
        { status: 403 }
      );
    }

    // 3. Validar estado: solo se puede confirmar si está ENVIADO o DESPACHADO_TSI
    const estadoActual = String(pedido.estado).toUpperCase();
    if (estadoActual === "ENTREGADO") {
      return NextResponse.json({
        success: true,
        mensaje: "Este pedido ya fue confirmado como entregado.",
        fechaConfirmacion: pedido.fecha_confirmacion_entrega,
        estado: "ENTREGADO",
      });
    }

    if (estadoActual !== "ENVIADO" && estadoActual !== "DESPACHADO_TSI") {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede confirmar la recepción: el pedido se encuentra en estado "${estadoActual}". Solo puede confirmarse cuando esté en estado Enviado.`,
        },
        { status: 400 }
      );
    }

    // 4. Actualizar a ENTREGADO con fecha y hora exacta
    const timestampConfirmacion = new Date();
    await query(
      `UPDATE pedidos
       SET estado = 'ENTREGADO',
           fecha_confirmacion_entrega = $1
       WHERE id = $2;`,
      [timestampConfirmacion, pedido.id]
    );

    return NextResponse.json({
      success: true,
      mensaje: "¡Recepción confirmada con éxito! Muchas gracias por confiar en NEXO CDE.",
      estado: "ENTREGADO",
      fechaConfirmacion: timestampConfirmacion.toISOString(),
    });
  } catch (err: any) {
    console.error("Error confirmando entrega:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
