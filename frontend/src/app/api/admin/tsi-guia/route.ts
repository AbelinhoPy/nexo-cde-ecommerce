import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";

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

    if (!codigoPedido || !numeroGuiaTsi) {
      return NextResponse.json(
        { success: false, error: "El código de pedido y el número de guía TSI son obligatorios." },
        { status: 400 }
      );
    }

    // 1. Limpieza y validación de número de guía
    const guiaSanitizada = numeroGuiaTsi.trim().toUpperCase();

    // 2. Persistencia en Neon DB
    if (isDbConfigured()) {
      try {
        await query(
          `
          UPDATE pedidos
          SET estado = 'DESPACHADO_TSI',
              numero_guia_tsi = $1,
              foto_guia_tsi = COALESCE($2, foto_guia_tsi)
          WHERE codigo_pedido = $3;
          `,
          [guiaSanitizada, fotoGuiaTsi || null, codigoPedido]
        );

        await query(
          `
          UPDATE agenda_despacho
          SET estado_despacho = 'DESPACHADO'
          WHERE pedido_id = (SELECT id FROM pedidos WHERE codigo_pedido = $1);
          `,
          [codigoPedido]
        );
      } catch (errDb) {
        console.error("Error actualizando guía en Neon:", errDb);
      }
    }

    // 3. Disparo de Notificación al WhatsApp del Cliente (Simulación / API Gateway)
    const mensajeCliente = (
      `📦 *¡TU PEDIDO HA SIDO DESPACHADO POR TSI!*\n\n` +
      `Hola *${nombreCliente || "Estimado/a"}*, tu compra en Ciudad del Este ya está en camino a tu localidad.\n\n` +
      `📋 *Código de Pedido:* ${codigoPedido}\n` +
      `🚚 *Transportadora:* TSI (Transportadora San Ignacio)\n` +
      `🏷️ *Número de Guía de Remisión:* *${guiaSanitizada}*\n` +
      `🔗 *Rastreo en línea:* https://tsi.com.py/tracking?guia=${encodeURIComponent(guiaSanitizada)}\n\n` +
      `⚠️ *RECORDATORIO DE SEGURIDAD IMPORTANTE:*\n` +
      `Antes de firmar la guía al chofer de TSI, *inspecciona el estado exterior de la caja*. Si presenta golpes o violaciones del precinto, asienta la observación en la planilla de TSI antes de recibir.`
    );

    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;

    if (whatsappApiUrl && telefonoCliente) {
      try {
        await fetch(whatsappApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: whatsappApiKey || "",
          },
          body: JSON.stringify({
            number: telefonoCliente.replace(/\D/g, ""),
            text: mensajeCliente,
          }),
        });
      } catch (err) {
        console.warn("Falla temporal enviando WhatsApp al cliente:", err);
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Guía TSI ${guiaSanitizada} vinculada con éxito. Cliente notificado.`,
      pedido: {
        codigo: codigoPedido,
        estado: "DESPACHADO_TSI",
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
