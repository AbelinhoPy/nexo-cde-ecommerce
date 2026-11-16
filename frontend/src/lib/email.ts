import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.EMAIL_FROM || 'NEXO CDE <notificaciones@resend.dev>';
export const adminRecipient = process.env.ORDER_NOTIFICATION_EMAIL || process.env.CONTACT_RECIPIENT_EMAIL || 'abelnunez997@gmail.com';

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
        <li>Acceso a precios mayoristas de Connect Partner con 5% de descuento directo.</li>
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
    <p>Hemos registrado tu solicitud de compra para preparación en <strong>Connect Partner (CDE)</strong> y despacho a <strong>${ciudadDestino}</strong>.</p>
    
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

    <p>Nuestro equipo en Ciudad del Este preparará tu pedido con Connect Partner en la mañana del despacho, verificará el precinto de fábrica y registrará la guía oficial de Transportadora TSI.</p>
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexocde.vercel.app';
  const content = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Tu paquete ha sido inspeccionado en Ciudad del Este, precintado y <strong>entregado formalmente a Transportadora TSI</strong> para viaje a tu localidad.</p>

    <div class="info-box">
      <p style="margin: 0 0 4px;"><strong>Código de Pedido:</strong> ${codigoPedido}</p>
      <p style="margin: 0 0 4px;"><strong>Destino:</strong> ${destino}</p>
      <p style="margin: 0 0 4px;"><strong>Empresa de Encomienda:</strong> Transportadora San Ignacio (TSI)</p>
      <p style="margin: 8px 0 0; font-size: 16px; color: #00c853; font-weight: 800;">
        🏷️ Guía TSI: ${numeroGuiaTsi}
      </p>
    </div>

    <p style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 12px; border-radius: 8px; font-size: 13px;">
      📱 <strong>Comprobante Oficial:</strong> Ya podés ingresar a tu perfil en NEXO CDE para ver la foto de la guía firmada y sellada en ventanilla TSI. Al recibir tu paquete, podrás pulsar <strong>«Confirmar recepción»</strong> directamente desde tu cuenta.
    </p>

    <p style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 10px;">
      ⚠️ <strong>Inspección previa:</strong> Verifica el precinto holográfico antes de firmar la planilla con el chofer de TSI.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `🚚 ¡Tu pedido ${codigoPedido} ya fue despachado por TSI! Guía: ${numeroGuiaTsi}`,
    html: baseNexoTemplate({
      title: '¡Tu pedido va en camino!',
      content,
      buttonText: 'Ver Mi Pedido y Guía en NEXO',
      buttonUrl: `${siteUrl}/checkout`,
    }),
  });
}

// ============================================================================
// 6. Aviso al Administrador: Nuevo Pedido Pendiente de Pago
// ============================================================================

export async function sendAdminNewOrderEmail({
  codigoPedido,
  items,
  clienteNombre,
  clienteCi,
  clienteTelefono,
  clienteEmail,
  destinoDepartamento,
  destinoCiudad,
  destinoDireccion,
  modalidadEntrega,
  agenciaTsi,
  montoProductosPyg,
  fletePyg,
  descuentoPyg,
  totalPagarPyg,
}: {
  codigoPedido: string;
  items: Array<{ nombre?: string; productoId?: string; cantidad: number; precioPyg: number }>;
  clienteNombre: string;
  clienteCi: string;
  clienteTelefono: string;
  clienteEmail?: string | null;
  destinoDepartamento: string;
  destinoCiudad: string;
  destinoDireccion: string;
  modalidadEntrega?: string;
  agenciaTsi?: string | null;
  montoProductosPyg: number;
  fletePyg: number;
  descuentoPyg?: number;
  totalPagarPyg: number;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexocde.vercel.app';
  const adminUrl = `${siteUrl}/admin`;

  const itemsHtml = items
    .map(
      (it) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <strong>${it.cantidad}x</strong> ${it.nombre || it.productoId || 'Producto CDE'}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-size: 13px; font-weight: bold;">
          ₲ ${(it.precioPyg * it.cantidad).toLocaleString('es-PY')}
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">
      🔔 <strong>¡Nuevo pedido entrante!</strong> Se ha registrado una nueva orden en la tienda esperando acreditación SIPAP en Banco Continental.
    </p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 16px 0;">
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>Código de Pedido:</strong> <span class="highlight-pill">#${codigoPedido}</span></p>
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>Destinatario:</strong> ${clienteNombre}</p>
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>CI / RUC:</strong> ${clienteCi || 'No indicado'}</p>
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>Teléfono:</strong> <a href="tel:${clienteTelefono}" style="color: #00c853; font-weight: bold;">${clienteTelefono}</a></p>
      <p style="margin: 0; font-size: 14px;"><strong>Correo Comprador:</strong> ${clienteEmail && clienteEmail.trim() ? clienteEmail : '<em style="color: #94a3b8;">Sin correo ingresado</em>'}</p>
    </div>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0;">
      <div style="background: #0f172a; color: #ffffff; padding: 10px 16px; font-weight: bold; font-size: 13px; text-transform: uppercase;">
        Detalle de Artículos Solicitados
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
      <p style="margin: 0 0 6px;"><strong>Destino:</strong> ${destinoCiudad}, ${destinoDepartamento}</p>
      <p style="margin: 0 0 6px;"><strong>Modalidad TSI:</strong> ${modalidadEntrega === 'AGENCIA' ? 'Retiro en Agencia TSI' : 'Entrega a Domicilio'}${agenciaTsi ? ` (${agenciaTsi})` : ''}</p>
      <p style="margin: 0 0 8px;"><strong>Dirección de Entrega:</strong> ${destinoDireccion}</p>
      <hr style="border: 0; border-top: 1px dashed #86efac; margin: 8px 0;" />
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Subtotal Productos:</span>
        <span style="font-family: monospace; font-weight: 600;">₲ ${montoProductosPyg.toLocaleString('es-PY')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Costo de Envío TSI:</span>
        <span style="font-family: monospace; font-weight: 600;">₲ ${fletePyg.toLocaleString('es-PY')}</span>
      </div>
      ${descuentoPyg ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #15803d;">
        <span>Descuento Cupón:</span>
        <span style="font-family: monospace; font-weight: 600;">- ₲ ${descuentoPyg.toLocaleString('es-PY')}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 16px; font-weight: 900; color: #047857; border-top: 2px solid #86efac; padding-top: 8px;">
        <span>TOTAL A COBRAR (SIPAP):</span>
        <span style="font-family: monospace;">₲ ${totalPagarPyg.toLocaleString('es-PY')}</span>
      </div>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 14px;">
      Al verificar la acreditación en Banco Continental (cuenta 010015602601), ingresá al panel para marcar como «Pagado» y preparar el despacho por TSI.
    </p>
  `;

  return sendEmail({
    to: adminRecipient,
    subject: `NEXO CDE | Nuevo pedido pendiente de pago #${codigoPedido}`,
    html: baseNexoTemplate({
      title: `Nuevo Pedido #${codigoPedido}`,
      content,
      buttonText: 'Abrir Panel de Administración',
      buttonUrl: adminUrl,
    }),
  });
}


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
