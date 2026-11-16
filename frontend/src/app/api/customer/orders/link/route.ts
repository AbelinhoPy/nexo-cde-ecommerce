import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyCustomerToken, hashSHA256 } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-customer-token");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión para vincular una compra anterior." },
        { status: 401 }
      );
    }

    const customer = verifyCustomerToken(token);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Sesión expirada o inválida." },
        { status: 401 }
      );
    }

    const { codigoPedido, ci, telefono } = await req.json();

    if (!codigoPedido || (!ci && !telefono)) {
      return NextResponse.json(
        { success: false, error: "Ingresa el código de pedido y la Cédula o Teléfono con el que realizaste la compra." },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no disponible." }, { status: 503 });
    }

    const ciHash = ci ? hashSHA256(ci) : "";
    const telHash = telefono ? hashSHA256(telefono) : "";

    // Buscar pedido y validar titularidad mediante CI hash o Teléfono hash
    const rows = await query<any>(
      `SELECT p.id, p.codigo_pedido, p.cliente_id, c.ci_hash, c.telefono_hash
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       WHERE UPPER(p.codigo_pedido) = UPPER($1);`,
      [codigoPedido.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró ningún pedido con ese código." },
        { status: 404 }
      );
    }

    const row = rows[0];

    const coincideCi = ciHash && row.ci_hash === ciHash;
    const coincideTel = telHash && row.telefono_hash === telHash;

    if (!coincideCi && !coincideTel) {
      return NextResponse.json(
        { success: false, error: "Los datos de verificación (Cédula / Teléfono) no coinciden con el registro del pedido." },
        { status: 403 }
      );
    }

    // Vincular pedido a la cuenta actual del cliente autenticado
    await query(
      `UPDATE pedidos
       SET cliente_id = $1
       WHERE id = $2;`,
      [customer.id, row.id]
    );

    return NextResponse.json({
      success: true,
      mensaje: `✓ Pedido ${codigoPedido.toUpperCase()} vinculado exitosamente a tu cuenta. Ya podés ver su seguimiento y confirmar la entrega.`,
    });
  } catch (err: any) {
    console.error("Error vinculando pedido:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
