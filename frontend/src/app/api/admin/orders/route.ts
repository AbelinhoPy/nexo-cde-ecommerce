import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query, getPool } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";
import { decryptAES256Buffer } from "@/lib/customerAuth";
import { sendAdminNewOrderEmail, sendShippingDispatchEmail } from "@/lib/email";

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
        p.monto_productos_pyg,
        p.descuento_cupon_pyg,
        p.cupon_codigo,
        p.estado,
        p.fecha_pago,
        p.numero_guia_tsi,
        p.foto_guia_tsi,
        p.destino_departamento,
        p.destino_ciudad,
        p.modalidad_entrega,
        p.agencia_tsi,
        p.notificacion_admin_enviada,
        p.notificacion_admin_error,
        p.notificacion_admin_at,
        p.notificacion_despacho_enviada,
        p.fecha_confirmacion_entrega,
        p.created_at,
        c.nombre_completo,
        c.ciudad_destino,
        c.departamento,
        c.email,
        c.ci_cifrado,
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
      let ci = "";
      try {
        if (row.telefono_cifrado) tel = decryptAES256Buffer(row.telefono_cifrado);
        if (row.direccion_cifrada) dir = decryptAES256Buffer(row.direccion_cifrada);
        if (row.ci_cifrado) ci = decryptAES256Buffer(row.ci_cifrado);
      } catch (e) {
        tel = "Protegido";
      }

      return {
        id: row.id,
        codigo: row.codigo_pedido,
        cliente: row.nombre_completo,
        ci: ci || "",
        telefono: tel,
        email: row.email || "",
        ciudad: row.destino_ciudad || row.ciudad_destino,
        departamento: row.destino_departamento || row.departamento,
        direccion: dir,
        modalidad: row.modalidad_entrega || "DOMICILIO",
        agenciaTsi: row.agencia_tsi || null,
        montoProductosPyg: Number(row.monto_productos_pyg),
        fletePyg: Number(row.monto_flete_pyg),
        descuentoPyg: Number(row.descuento_cupon_pyg || 0),
        totalPyg: Number(row.total_pagar_pyg),
        estado: row.estado,
        guia: row.numero_guia_tsi || "",
        fotoGuiaTsi: row.foto_guia_tsi || null,
        fechaPago: row.fecha_pago,
        fechaConfirmacionEntrega: row.fecha_confirmacion_entrega,
        notificacionAdminEnviada: Boolean(row.notificacion_admin_enviada),
        notificacionAdminError: row.notificacion_admin_error || null,
        notificacionAdminAt: row.notificacion_admin_at || null,
        createdAt: row.created_at
      };
    });

    return NextResponse.json({ success: true, pedidos });
  } catch (err: any) {
    console.error("Error en admin/orders GET:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH: Transición de estados del pedido por el Administrador
 * Flujo: PENDIENTE -> PAGADO -> PREPARANDO_ENVIO -> ENVIADO -> ENTREGADO
 */
export async function PATCH(req: NextRequest) {
  try {
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no disponible" }, { status: 503 });
    }

    const { codigoPedido, nuevoEstado, numeroGuiaTsi, fotoGuiaTsi } = await req.json();

    if (!codigoPedido || !nuevoEstado) {
      return NextResponse.json(
        { success: false, error: "Código de pedido y nuevo estado son obligatorios." },
        { status: 400 }
      );
    }

    const estadoUpper = nuevoEstado.trim().toUpperCase();

    // Validar estados admitidos
    const estadosValidos = ["PENDIENTE", "PAGADO", "PREPARANDO_ENVIO", "ENVIADO", "ENTREGADO", "DESPACHADO_TSI"];
    if (!estadosValidos.includes(estadoUpper)) {
      return NextResponse.json(
        { success: false, error: `Estado "${nuevoEstado}" no válido.` },
        { status: 400 }
      );
    }

    // Obtener pedido actual
    const rows = await query<any>(
      `SELECT p.id, p.codigo_pedido, p.estado, p.numero_guia_tsi, p.foto_guia_tsi,
              p.destino_ciudad, p.destino_departamento, c.nombre_completo, c.email
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       WHERE p.codigo_pedido = $1;`,
      [codigoPedido.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    const pedido = rows[0];

    // Regla de negocio estricta: para marcar como "ENVIADO", ambos datos (guía y foto) son obligatorios
    if (estadoUpper === "ENVIADO" || estadoUpper === "DESPACHADO_TSI") {
      const guiaFinal = (numeroGuiaTsi || pedido.numero_guia_tsi || "").trim().toUpperCase();
      const fotoFinal = fotoGuiaTsi || pedido.foto_guia_tsi;

      if (!guiaFinal || !fotoFinal) {
        return NextResponse.json(
          {
            success: false,
            error: "Para marcar como «Enviado» es obligatorio cargar tanto el número de guía TSI como la foto del comprobante físico.",
          },
          { status: 400 }
        );
      }

      await query(
        `UPDATE pedidos
         SET estado = 'ENVIADO',
             numero_guia_tsi = $1,
             foto_guia_tsi = $2
         WHERE codigo_pedido = $3;`,
        [guiaFinal, fotoFinal, codigoPedido.trim()]
      );

      // Si el cliente dejó un correo, enviarle aviso de despacho
      if (pedido.email && pedido.email.includes("@")) {
        try {
          await sendShippingDispatchEmail({
            email: pedido.email,
            nombre: pedido.nombre_completo,
            codigoPedido: pedido.codigo_pedido,
            numeroGuiaTsi: guiaFinal,
            destino: `${pedido.destino_ciudad || "Interior"}, ${pedido.destino_departamento || "Paraguay"}`,
          });
          await query(
            `UPDATE pedidos SET notificacion_despacho_enviada = TRUE WHERE codigo_pedido = $1;`,
            [codigoPedido.trim()]
          );
        } catch (errEmail) {
          console.warn("Falla enviando correo de despacho al cliente:", errEmail);
        }
      }

      return NextResponse.json({
        success: true,
        mensaje: `✓ Pedido ${codigoPedido} marcado como «Enviado» con guía TSI ${guiaFinal}.`,
        estado: "ENVIADO",
        guia: guiaFinal,
      });
    }

    // Transición a PAGADO
    if (estadoUpper === "PAGADO") {
      await query(
        `UPDATE pedidos
         SET estado = 'PAGADO',
             fecha_pago = COALESCE(fecha_pago, NOW())
         WHERE codigo_pedido = $1;`,
        [codigoPedido.trim()]
      );

      return NextResponse.json({
        success: true,
        mensaje: `✓ Pago confirmado. Pedido ${codigoPedido} ahora está en estado «Pagado».`,
        estado: "PAGADO",
      });
    }

    // Transición a PREPARANDO_ENVIO
    if (estadoUpper === "PREPARANDO_ENVIO") {
      await query(
        `UPDATE pedidos
         SET estado = 'PREPARANDO_ENVIO'
         WHERE codigo_pedido = $1;`,
        [codigoPedido.trim()]
      );

      return NextResponse.json({
        success: true,
        mensaje: `✓ Pedido ${codigoPedido} marcado como «Preparando envío».`,
        estado: "PREPARANDO_ENVIO",
      });
    }

    // Transición a ENTREGADO
    if (estadoUpper === "ENTREGADO") {
      await query(
        `UPDATE pedidos
         SET estado = 'ENTREGADO',
             fecha_confirmacion_entrega = COALESCE(fecha_confirmacion_entrega, NOW())
         WHERE codigo_pedido = $1;`,
        [codigoPedido.trim()]
      );

      return NextResponse.json({
        success: true,
        mensaje: `✓ Pedido ${codigoPedido} marcado como «Entregado».`,
        estado: "ENTREGADO",
      });
    }

    // Otros estados
    await query(`UPDATE pedidos SET estado = $1 WHERE codigo_pedido = $2;`, [estadoUpper, codigoPedido.trim()]);

    return NextResponse.json({
      success: true,
      mensaje: `Estado de ${codigoPedido} actualizado a ${estadoUpper}.`,
      estado: estadoUpper,
    });
  } catch (err: any) {
    console.error("Error en admin/orders PATCH:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Acciones especiales administrativas (ej. reintento de correo sin duplicar pedido)
 */
export async function POST(req: NextRequest) {
  try {
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no disponible" }, { status: 503 });
    }

    const { action, codigoPedido } = await req.json();

    if (action === "retry-email") {
      if (!codigoPedido) {
        return NextResponse.json({ success: false, error: "Código de pedido requerido" }, { status: 400 });
      }

      // Cargar pedido completo con items
      const rows = await query<any>(
        `SELECT p.id, p.codigo_pedido, p.total_pagar_pyg, p.monto_flete_pyg, p.monto_productos_pyg,
                p.descuento_cupon_pyg, p.destino_departamento, p.destino_ciudad, p.modalidad_entrega,
                p.agencia_tsi, c.nombre_completo, c.email, c.ci_cifrado, c.telefono_cifrado, c.direccion_cifrada
         FROM pedidos p
         JOIN clientes c ON p.cliente_id = c.id
         WHERE p.codigo_pedido = $1;`,
        [codigoPedido.trim()]
      );

      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
      }

      const p = rows[0];
      const itemsRes = await query<any>(
        `SELECT pi.cantidad, pi.precio_unitario_pyg, COALESCE(pr.nombre, 'Producto CDE') AS producto_nombre
         FROM pedido_items pi
         LEFT JOIN productos pr ON pi.producto_id = pr.id
         WHERE pi.pedido_id = $1;`,
        [p.id]
      );

      let tel = "";
      let dir = "";
      let ci = "";
      try {
        if (p.telefono_cifrado) tel = decryptAES256Buffer(p.telefono_cifrado);
        if (p.direccion_cifrada) dir = decryptAES256Buffer(p.direccion_cifrada);
        if (p.ci_cifrado) ci = decryptAES256Buffer(p.ci_cifrado);
      } catch (e) {
        tel = "Protegido";
      }

      const result = await sendAdminNewOrderEmail({
        codigoPedido: p.codigo_pedido,
        items: itemsRes.map((it: any) => ({
          nombre: it.producto_nombre,
          cantidad: Number(it.cantidad),
          precioPyg: Number(it.precio_unitario_pyg),
        })),
        clienteNombre: p.nombre_completo,
        clienteCi: ci,
        clienteTelefono: tel,
        clienteEmail: p.email || null,
        destinoDepartamento: p.destino_departamento,
        destinoCiudad: p.destino_ciudad,
        destinoDireccion: dir,
        modalidadEntrega: p.modalidad_entrega || "DOMICILIO",
        agenciaTsi: p.agencia_tsi || null,
        montoProductosPyg: Number(p.monto_productos_pyg),
        fletePyg: Number(p.monto_flete_pyg),
        descuentoPyg: Number(p.descuento_cupon_pyg || 0),
        totalPagarPyg: Number(p.total_pagar_pyg),
      });

      if (result.success) {
        await query(
          `UPDATE pedidos SET notificacion_admin_enviada = TRUE, notificacion_admin_at = NOW(), notificacion_admin_error = NULL WHERE id = $1;`,
          [p.id]
        );
        return NextResponse.json({
          success: true,
          mensaje: `✓ Correo de aviso reenviado exitosamente para el pedido #${codigoPedido}.`,
        });
      } else {
        await query(
          `UPDATE pedidos SET notificacion_admin_enviada = FALSE, notificacion_admin_error = $1 WHERE id = $2;`,
          [result.error || "Falla reenviando correo", p.id]
        );
        return NextResponse.json(
          {
            success: false,
            error: `Error al reenviar correo: ${result.error}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida." }, { status: 400 });
  } catch (err: any) {
    console.error("Error en admin/orders POST:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
