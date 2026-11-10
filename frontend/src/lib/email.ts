import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.EMAIL_FROM || 'NEXO CDE <notificaciones@resend.dev>';
const adminRecipient = process.env.CONTACT_RECIPIENT_EMAIL || 'abelnunez997@gmail.com';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Motor central de envío de emails adaptado de LavaYA! para NEXO CDE
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn(`[NEXO CDE Email] RESEND_API_KEY no configurada. Simulación de envío a ${to}: "${subject}"`);
    return { success: true, id: 'simulated-no-api-key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
    });

    if (error) {
      console.error('[NEXO Email Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[NEXO Email Exception]', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

// ============================================================================
// Plantilla Base HTML Institucional NEXO (Inspirada en LavaYA!)
// ============================================================================

function baseNexoTemplate({
  title,
  content,
  buttonText,
  buttonUrl,
  footerNote,
}: {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { background: #0f1217; padding: 32px 24px; text-align: center; border-bottom: 3px solid #00c853; }
    .brand-title { color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .brand-title span { color: #00e599; }
    .brand-subtitle { color: #94a3b8; font-size: 11px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
    .body { padding: 32px 28px; }
    h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; line-height: 1.3; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px; line-height: 1.6; }
    .highlight-pill { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 12px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #00c853; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,200,83,0.3); text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #0f1217; padding: 24px 28px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
    .footer a { color: #00e599; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">NE<span>X</span>O</h1>
      <p class="brand-subtitle">Concierge Comercial & Transporte • CDE</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${content}
      ${buttonText && buttonUrl ? `
      <div class="btn-container">
        <a href="${buttonUrl}" class="btn" target="_blank">${buttonText}</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0; font-weight: 600; color: #cbd5e1;">NEXO S.A. • RUC 4196328-8</p>
      <p style="margin: 4px 0 0;">Av. Amado Benítez Gamarra, Ciudad del Este, Paraguay</p>
      <p style="margin: 4px 0 0;">Despachos diarios a todo el país vía Transportadora TSI.</p>
      ${footerNote ? `<p style="margin: 12px 0 0; font-size: 10px; color: #64748b;">${footerNote}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// 1. Correo de Bienvenida y Creación de Perfil / Registro
// ============================================================================

export async function sendWelcomeEmail({ email, name }: { email: string; name: string }) {
  const content = `
    <p>¡Hola <strong>${name || 'Cliente'}</strong>!</p>
    <p>Tu perfil en <strong>NEXO Concierge Comercial & Transporte</strong> ha sido creado exitosamente.</p>
    <div class="info-box">
      <p style="margin: 0 0 6px;"><strong>Beneficios activos en tu cuenta:</strong></p>
      <ul style="margin: 0; padding-left: 20px; color: #475569;">
        <li>Acceso a precios mayoristas de Atacado Connect con 5% de descuento directo.</li>
        <li>Inspección física en tienda y precinto de seguridad holográfico garantizado.</li>
        <li>Despachos prioritarios vía Transportadora TSI a cualquier localidad de Paraguay.</li>
        <li>Seguimiento en tiempo real de tus pedidos y números de guía.</li>
      </ul>
    </div>
    <p>Podés ingresar a nuestro catálogo en cualquier momento para coordinar compras o consultar cotizaciones vigentes en Ciudad del Este.</p>
  `;

  return sendEmail({
    to: email,
    subject: '¡Bienvenido a NEXO Concierge CDE! Tu perfil está listo',
    html: baseNexoTemplate({
      title: '¡Tu cuenta ha sido activada!',
      content,
      buttonText: 'Explorar Catálogo Mayorista',
      buttonUrl: 'http://localhost:3000',
    }),
  });
}

// ============================================================================
// 2. Correo de Confirmación de Pedido / Al Hacer Compras
// ============================================================================

export async function sendOrderConfirmationEmail({
  email,
  nombre,
  codigoPedido,
  productoNombre,
  totalPyg,
  fletePyg,
  ciudadDestino,
}: {
  email: string;
  nombre: string;
  codigoPedido: string;
  productoNombre: string;
  totalPyg: number;
  fletePyg: number;
  ciudadDestino: string;
}) {
  const content = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Hemos registrado tu solicitud de compra para retiro presencial en <strong>Atacado Connect (CDE)</strong> y despacho a <strong>${ciudadDestino}</strong>.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 8px; font-size: 15px;"><strong>Resumen de tu Orden:</strong></p>
      <p style="margin: 0 0 4px;"><strong>Código de Pedido:</strong> <span class="highlight-pill">${codigoPedido}</span></p>
      <p style="margin: 0 0 4px;"><strong>Artículo:</strong> ${productoNombre}</p>
      <p style="margin: 0 0 4px;"><strong>Flete Nacional TSI:</strong> ₲ ${fletePyg.toLocaleString('es-PY')}</p>
      <p style="margin: 8px 0 0; font-size: 16px; color: #00c853; font-weight: 800;">
        Total a Transferir: ₲ ${totalPyg.toLocaleString('es-PY')}
      </p>
    </div>

    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin: 16px 0;">
      <p style="margin: 0 0 6px; font-weight: 700; color: #065f46;">Datos Oficiales para Transferencia SIPAP / QR:</p>
      <p style="margin: 0 0 3px; font-size: 13px;"><strong>Entidad:</strong> Banco Continental</p>
      <p style="margin: 0 0 3px; font-size: 13px;"><strong>Titular:</strong> NUÑEZ MARTINEZ, ABEL IRENEO</p>
      <p style="margin: 0 0 3px; font-size: 13px;"><strong>C.I. / RUC:</strong> 4196328 / 4196328-8</p>
      <p style="margin: 0 0 3px; font-size: 13px;"><strong>N° de Cuenta:</strong> 010015602601</p>
      <p style="margin: 0; font-size: 13px; color: #047857;"><strong>Concepto Obligatorio:</strong> ${codigoPedido}</p>
    </div>

    <p style="font-size: 13px; color: #b45309; background: #fffbeb; padding: 10px 14px; border-radius: 8px; border: 1px solid #fde68a;">
      ⏰ <strong>Regla de Corte (12:00 PM):</strong> Si tu transferencia se acredita antes del mediodía, tu unidad se retira y se despacha <strong>mañana a las 13:00 hs por TSI</strong>.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Confirmación de Orden ${codigoPedido} - NEXO CDE`,
    html: baseNexoTemplate({
      title: `Orden Registrada: #${codigoPedido}`,
      content,
      buttonText: 'Ver Estado de mi Pedido',
      buttonUrl: `http://localhost:3000/checkout`,
    }),
  });
}

// ============================================================================
// 3. Correo de Pago Conciliado y Programación de Despacho
// ============================================================================

export async function sendPaymentReceivedEmail({
  email,
  nombre,
  codigoPedido,
  comprobanteSipap,
  fechaDespacho,
}: {
  email: string;
  nombre: string;
  codigoPedido: string;
  comprobanteSipap: string;
  fechaDespacho: string;
}) {
  const content = `
    <p>¡Excelente noticia, <strong>${nombre}</strong>!</p>
    <p>Tu transferencia SIPAP ha sido <strong>conciliada y acreditada exitosamente</strong> en Banco Continental.</p>

    <div class="info-box">
      <p style="margin: 0 0 4px;"><strong>Código de Pedido:</strong> ${codigoPedido}</p>
      <p style="margin: 0 0 4px;"><strong>Comprobante SIPAP:</strong> ${comprobanteSipap}</p>
      <p style="margin: 0 0 4px;"><strong>Estado:</strong> <span class="highlight-pill">PAGADO & PROGRAMADO</span></p>
      <p style="margin: 8px 0 0; font-size: 15px; color: #0f172a;">
        📅 <strong>Fecha Programada de Despacho TSI:</strong> ${fechaDespacho} a las 13:00 hs
      </p>
    </div>

    <p>Nuestro equipo en Ciudad del Este realizará el retiro en Atacado Connect en la mañana del despacho, verificará el precinto de fábrica y registrará la guía oficial de Transportadora TSI.</p>
  `;

  return sendEmail({
    to: email,
    subject: `¡Pago Confirmado! Pedido ${codigoPedido} en preparación TSI`,
    html: baseNexoTemplate({
      title: 'Transferencia SIPAP Conciliada',
      content,
      buttonText: 'Ver Pedido en Línea',
      buttonUrl: 'http://localhost:3000',
    }),
  });
}

// ============================================================================
// 4. Correo de Despacho Efectivo con Número de Guía TSI
// ============================================================================

export async function sendShippingDispatchEmail({
  email,
  nombre,
  codigoPedido,
  numeroGuiaTsi,
  destino,
}: {
  email: string;
  nombre: string;
  codigoPedido: string;
  numeroGuiaTsi: string;
  destino: string;
}) {
  const content = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Tu paquete ha sido inspeccionado, precintado y <strong>entregado a Transportadora TSI en Ciudad del Este</strong>.</p>

    <div class="info-box">
      <p style="margin: 0 0 4px;"><strong>Pedido:</strong> ${codigoPedido}</p>
      <p style="margin: 0 0 4px;"><strong>Destino:</strong> ${destino}</p>
      <p style="margin: 0 0 4px;"><strong>Empresa de Envío:</strong> Transportadora San Ignacio (TSI)</p>
      <p style="margin: 8px 0 0; font-size: 16px; color: #00c853; font-weight: 800;">
        🏷️ Guía TSI: ${numeroGuiaTsi}
      </p>
    </div>

    <p style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 13px;">
      ⚠️ <strong>Recordatorio Obligatorio:</strong> Inspecciona el exterior del paquete y el precinto antes de firmar la guía con el chofer de TSI.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `🚚 ¡Tu pedido ${codigoPedido} ya fue despachado por TSI! Guía: ${numeroGuiaTsi}`,
    html: baseNexoTemplate({
      title: 'Tu paquete va en camino',
      content,
      buttonText: 'Rastrear Guía en TSI',
      buttonUrl: `https://tsi.com.py/tracking?guia=${encodeURIComponent(numeroGuiaTsi)}`,
    }),
  });
}

// ============================================================================
// 5. Correo de Contacto y Consultas (Copiado de LavaYA! directo a Abel)
// ============================================================================

export async function sendContactInquiryEmail({
  nombre,
  contacto,
  tipo,
  mensaje,
}: {
  nombre: string;
  contacto: string;
  tipo: string;
  mensaje: string;
}) {
  const content = `
    <p>Has recibido un nuevo mensaje enviado a través de la web de <strong>NEXO Concierge CDE</strong>:</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 14px;"><strong>Remitente:</strong> ${nombre || 'No indicado'}</p>
      <p style="margin: 0 0 10px; font-size: 14px;"><strong>Contacto (Email / Teléfono):</strong> <a href="${contacto.includes('@') ? 'mailto:' + contacto : 'tel:' + contacto}" style="color: #00c853; font-weight: 600;">${contacto || 'No indicado'}</a></p>
      <p style="margin: 0 0 10px; font-size: 14px;"><strong>Tipo de consulta:</strong> <span style="background: #ecfdf5; color: #065f46; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">${tipo.toUpperCase()}</span></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 14px 0;" />
      <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Mensaje recibido:</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #0f172a; white-space: pre-wrap; font-style: italic;">"${mensaje}"</p>
    </div>
    <p style="font-size: 13px; color: #64748b;">Podés responderle directamente contactándolo por el correo o teléfono registrado arriba.</p>
  `;

  const subjectType = tipo === 'sugerencia' ? 'Sugerencia' : tipo === 'cotizacion' ? 'Cotización Especial CDE' : 'Consulta Cliente';
  const senderIdentifier = nombre || contacto || 'Visitante web';

  return sendEmail({
    to: adminRecipient,
    subject: `NEXO CDE [${subjectType}] de ${senderIdentifier}`,
    html: baseNexoTemplate({
      title: `NEXO CDE · ${subjectType}`,
      content,
      buttonText: 'Ir al Panel Administrativo',
      buttonUrl: 'http://localhost:3000/admin',
    }),
  });
}
