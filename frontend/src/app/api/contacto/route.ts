import { NextRequest, NextResponse } from "next/server";
import { sendContactInquiryEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting por IP: máximo 5 envíos cada 5 minutos
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`contacto_${clientIp}`, {
      windowMs: 5 * 60 * 1000,
      max: 5,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Has enviado varios mensajes recientemente. Por favor espera unos minutos antes de volver a consultar.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { nombre, contacto, tipo, mensaje, website } = body;

    // 1. Protección anti-spam vía honeypot silencioso
    if (website) {
      return NextResponse.json({ success: true, message: "Mensaje recibido correctamente." });
    }

    // 2. Validación de campos obligatorios
    if (!mensaje || typeof mensaje !== "string" || !mensaje.trim() || mensaje.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Por favor escribe un mensaje válido (máximo 2.000 caracteres)." },
        { status: 400 }
      );
    }

    if (!contacto || typeof contacto !== "string" || !contacto.trim() || contacto.length > 150) {
      return NextResponse.json(
        { success: false, error: "Por favor ingresa un correo o teléfono válido para poder responderte." },
        { status: 400 }
      );
    }

    const resultado = await sendContactInquiryEmail({
      nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim().slice(0, 100) : "Cliente CDE",
      contacto: contacto.trim(),
      tipo: tipo || "consulta",
      mensaje: mensaje.trim(),
    });

    if (!resultado.success) {
      console.warn("Advertencia enviando email de contacto:", resultado.error);
    }

    return NextResponse.json({
      success: true,
      message: "¡Tu consulta ha sido enviada con éxito! Nos pondremos en contacto contigo a la brevedad.",
    });
  } catch (error: any) {
    console.error("Error en /api/contacto:", error);
    return NextResponse.json(
      { success: false, error: "Error procesando tu mensaje. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
