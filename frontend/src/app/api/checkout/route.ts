import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { isDbConfigured, getPool, query } from "@/lib/db";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Clave maestra para AES-256 (32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
const IV_LENGTH = 16;

const CartItemSchema = z.object({
  productoId: z.string().min(1).max(100),
  cantidad: z.number().int().positive().default(1),
  precioPyg: z.number().int().positive(),
  tipoFlete: z.enum(["REGULAR", "PESADO"]).default("REGULAR"),
  nombre: z.string().optional(),
});

/**
 * Esquema de validación estricto con Zod
 */
const CheckoutSchema = z.object({
  cliente: z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(120),
    ci: z.string().min(5, "El documento / CI debe tener al menos 5 dígitos").max(20),
    telefono: z.string().min(6, "El teléfono de contacto debe tener al menos 6 dígitos").max(25),
    email: z.string().email("Formato de correo electrónico inválido").optional().or(z.literal("")).nullable(),
    departamento: z.string().min(2).max(60),
    ciudad: z.string().min(2).max(80),
    direccion: z.string().min(5, "La dirección debe ser descriptiva para el chofer de TSI").max(200),
    modalidad: z.string().optional().default("DOMICILIO"),
    agenciaTsi: z.string().max(150).optional().nullable(),
  }),
  items: z.array(CartItemSchema).optional(),
  productoId: z.string().min(1).max(100).optional(),
  tipoFlete: z.enum(["REGULAR", "PESADO"]).optional(),
  montoProductosPyg: z.number().int().positive("El monto de productos debe ser positivo"),
  fleteEsperadoPyg: z.number().int().min(0).optional().nullable(),
  cuponCodigo: z.string().max(30).optional().nullable(),
  descuentoCuponPyg: z.number().int().min(0).default(0),
  terminosAceptados: z.literal(true, {
    errorMap: () => ({ message: "Debe aceptar expresamente las condiciones de inspección y despacho TSI" }),
  }),
});

function encryptAES256Buffer(text: string): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

function hashSHA256(text: string): string {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // 0. Rate Limiting por IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`checkout_${clientIp}`, {
      windowMs: 10 * 60 * 1000,
      max: 20,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Demasiadas solicitudes de checkout desde esta conexión. Por favor espere unos minutos.",
        },
        { status: 429 }
      );
    }

    const rawBody = await req.json();

    // 1. Validación de esquema con Zod
    const parseResult = CheckoutSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de orden inválidos o incompletos.",
          detalles: parseResult.error.issues.map((i) => ({ campo: i.path.join("."), error: i.message })),
        },
        { status: 400 }
      );
    }

    const { 
      cliente, 
      items, 
      productoId, 
      tipoFlete, 
      montoProductosPyg, 
      fleteEsperadoPyg,
      cuponCodigo, 
      descuentoCuponPyg 
    } = parseResult.data;

    // Validación estricta: Exclusión geográfica de Ciudad del Este / Alto Paraná
    const depLower = (cliente.departamento || "").toLowerCase().trim();
    const ciudadLower = (cliente.ciudad || "").toLowerCase().trim();
    const esDestinoCde = 
      depLower.includes("alto paraná") || 
      depLower.includes("alto parana") || 
      ciudadLower.includes("ciudad del este") || 
      ciudadLower.includes("hernandarias") || 
      ciudadLower.includes("franco") || 
      ciudadLower.includes("minga");

    if (esDestinoCde) {
      return NextResponse.json(
        {
          success: false,
          error: "Servicio exclusivo para el Interior: NEXO CDE opera únicamente despachando por encomienda TSI a destinos de Asunción y el interior de Paraguay. No disponemos de entregas locales ni mostrador en Ciudad del Este.",
        },
        { status: 400 }
      );
    }

    // Normalizar items (soporta array de carrito o producto único)
    const normalizedItems =
      items && items.length > 0
        ? items
        : productoId
        ? [
            {
              productoId,
              cantidad: 1,
              precioPyg: montoProductosPyg,
              tipoFlete: tipoFlete || "REGULAR",
            },
          ]
        : [];

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "El carrito está vacío. Agregá al menos un producto para continuar.",
          codigoError: "CARRITO_VACIO",
        },
        { status: 400 }
      );
    }

    // 2. Validación Estricta de Cobertura y Tarifa TSI en el Servidor
    // ELIMINADO CUALQUIER FALLBACK PLANO DE 35.000 O 50.000
    if (!isDbConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "No pudimos verificar el envío. Volvé a intentar",
          codigoError: "DB_NO_CONFIGURADA",
        },
        { status: 503 }
      );
    }

    const tienePesado = normalizedItems.some((it) => it.tipoFlete === "PESADO");
    let destinoDb: any = null;

    try {
      const destinoRows = await query<any>(
        `SELECT id, departamento, ciudad, agencia_nombre, modalidad, flete_regular_pyg, flete_pesado_pyg, cobertura_habilitada
         FROM destinos_tsi
         WHERE LOWER(TRIM(departamento)) = LOWER(TRIM($1)) 
           AND LOWER(TRIM(ciudad)) = LOWER(TRIM($2))
         LIMIT 1;`,
        [cliente.departamento, cliente.ciudad]
      );

      // Destino sin cobertura confirmada o inexistente en la tabla
      if (destinoRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `El destino ${cliente.ciudad} (${cliente.departamento}) no está habilitado para envíos.`,
            codigoError: "DESTINO_SIN_COBERTURA",
          },
          { status: 400 }
        );
      }

      destinoDb = destinoRows[0];
    } catch (errGeo) {
      console.error("[Checkout] Error al consultar cobertura TSI en DB:", errGeo);
      return NextResponse.json(
        {
          success: false,
          error: "No pudimos verificar el envío. Volvé a intentar",
          codigoError: "ERROR_CONSULTA_COBERTURA",
        },
        { status: 503 }
      );
    }

    // Destino deshabilitado
    if (!destinoDb.cobertura_habilitada) {
      return NextResponse.json(
        {
          success: false,
          error: `El destino ${cliente.ciudad} (${cliente.departamento}) no está habilitado para envíos.`,
          codigoError: "DESTINO_DESHABILITADO",
        },
        { status: 400 }
      );
    }

    // Destino habilitado sin tarifa para el tipo de carrito
    const tarifaAplicable = tienePesado ? destinoDb.flete_pesado_pyg : destinoDb.flete_regular_pyg;
    if (tarifaAplicable === null || tarifaAplicable === undefined || Number(tarifaAplicable) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Envío pendiente de cotización para este destino",
          codigoError: "TARIFA_PENDIENTE",
        },
        { status: 400 }
      );
    }

    const costoFleteCalculado = Number(tarifaAplicable);

    // Si la tarifa cambió desde que se mostró el total en el checkout del cliente
    if (
      fleteEsperadoPyg !== undefined &&
      fleteEsperadoPyg !== null &&
      Number(fleteEsperadoPyg) !== costoFleteCalculado
    ) {
      const descuentoTemp = Math.min(descuentoCuponPyg, montoProductosPyg + costoFleteCalculado);
      const totalNuevo = montoProductosPyg + costoFleteCalculado - descuentoTemp;
      return NextResponse.json(
        {
          success: false,
          tarifaActualizada: true,
          fleteAnteriorPyg: Number(fleteEsperadoPyg),
          nuevoFletePyg: costoFleteCalculado,
          nuevoTotalPagarPyg: totalNuevo,
          error: `La tarifa de envío para este destino se actualizó a ₲ ${costoFleteCalculado.toLocaleString("es-PY")}. Por favor volvé a confirmar el pedido con el total actualizado.`,
          codigoError: "TARIFA_ACTUALIZADA",
        },
        { status: 409 }
      );
    }

    const descuentoAplicado = Math.min(descuentoCuponPyg, montoProductosPyg + costoFleteCalculado);
    const totalPagarCalculado = montoProductosPyg + costoFleteCalculado - descuentoAplicado;

    // 3. Validación Estricta de Productos: Validar TODOS los artículos del carrito
    // ELIMINADA CUALQUIER SUSTITUCIÓN AUTOMÁTICA POR EL PRIMER ARTÍCULO DE LA BASE
    const pool = getPool();
    const client = await pool.connect();

    const validatedItems: Array<{
      item: (typeof normalizedItems)[0];
      prodDb: {
        id: string;
        sku: string;
        nombre: string;
        costo_neto_usd: string | number;
        cotizacion_aplicada_pyg: number;
        costo_neto_pyg: string | number;
        precio_venta_pyg: string | number;
      };
    }> = [];

    try {
      for (const item of normalizedItems) {
        const prodQuery = await client.query(
          `SELECT id, sku, nombre, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg, activo
           FROM productos 
           WHERE (sku = $1 OR id::text = $1)
           LIMIT 1;`,
          [item.productoId]
        );

        const prodDb = prodQuery.rows[0];

        // Si el producto no se encuentra o está inactivo, rechazar el pedido completo
        if (!prodDb || prodDb.activo === false) {
          client.release();
          const nombreItem = item.nombre || item.productoId;
          return NextResponse.json(
            {
              success: false,
              error: `El producto "${nombreItem}" (Código: ${item.productoId}) no se encuentra disponible en nuestro catálogo. Por favor quitalo de tu carrito para continuar.`,
              productoInvalido: {
                productoId: item.productoId,
                nombre: nombreItem,
              },
              codigoError: "PRODUCTO_NO_DISPONIBLE",
            },
            { status: 400 }
          );
        }

        validatedItems.push({ item, prodDb });
      }

      // 4. Generación de Código Único de Pedido y Cifrado PII
      const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
      const codigoPedido = `CDE-${hoyStr}-${randomHex}`;

      const ciCifradoBuf = encryptAES256Buffer(cliente.ci);
      const telCifradoBuf = encryptAES256Buffer(cliente.telefono);
      const dirCifradoBuf = encryptAES256Buffer(cliente.direccion);

      const ciHash = hashSHA256(cliente.ci);
      const telefonoHash = hashSHA256(cliente.telefono);
      const timestampAceptacion = new Date();

      // 5. Transacción Atómica Única en Neon PostgreSQL
      await client.query("BEGIN;");

      // Insertar o actualizar cliente (usando blind index ci_hash)
      const clienteRes = await client.query(
        `
        INSERT INTO clientes (
          nombre_completo, ci_cifrado, telefono_cifrado, direccion_cifrada,
          ci_hash, telefono_hash, ciudad_destino, departamento, email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (ci_hash) DO UPDATE SET
          nombre_completo = EXCLUDED.nombre_completo,
          telefono_cifrado = EXCLUDED.telefono_cifrado,
          direccion_cifrada = EXCLUDED.direccion_cifrada,
          ciudad_destino = EXCLUDED.ciudad_destino,
          departamento = EXCLUDED.departamento,
          email = COALESCE(EXCLUDED.email, clientes.email)
        RETURNING id;
        `,
        [
          cliente.nombre,
          ciCifradoBuf,
          telCifradoBuf,
          dirCifradoBuf,
          ciHash,
          telefonoHash,
          cliente.ciudad,
          cliente.departamento,
          cliente.email || null,
        ]
      );
      const clienteId = clienteRes.rows[0].id;

      // Insertar Pedido
      const pedidoRes = await client.query(
        `
        INSERT INTO pedidos (
          codigo_pedido, cliente_id, monto_productos_pyg, monto_flete_pyg,
          cupon_codigo, descuento_cupon_pyg, total_pagar_pyg,
          estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp,
          destino_departamento, destino_ciudad, modalidad_entrega, agencia_tsi,
          notificacion_admin_enviada
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', TRUE, $8, $9, $10, $11, $12, $13, FALSE)
        RETURNING id;
        `,
        [
          codigoPedido,
          clienteId,
          montoProductosPyg,
          costoFleteCalculado,
          cuponCodigo || null,
          descuentoAplicado,
          totalPagarCalculado,
          clientIp,
          timestampAceptacion,
          cliente.departamento,
          cliente.ciudad,
          cliente.modalidad || "DOMICILIO",
          cliente.agenciaTsi || null,
        ]
      );
      const pedidoId = pedidoRes.rows[0].id;

      // Insertar EXACTAMENTE los productos validados que eligió el cliente
      for (const { item, prodDb } of validatedItems) {
        await client.query(
          `
          INSERT INTO pedido_items (
            pedido_id, producto_id, cantidad, costo_unitario_usd,
            cotizacion_usada_pyg, costo_unitario_pyg, precio_unitario_pyg, subtotal_pyg
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
          [
            pedidoId,
            prodDb.id,
            item.cantidad,
            prodDb.costo_neto_usd,
            prodDb.cotizacion_aplicada_pyg,
            prodDb.costo_neto_pyg,
            item.precioPyg,
            item.precioPyg * item.cantidad,
          ]
        );
      }

      // Confirmar transacción de forma atómica
      await client.query("COMMIT;");

      client.release();

      // 6. Aviso Inmediato por Correo al Administrador
      // Se envía ÚNICAMENTE después de haber guardado el pedido completo exitosamente.
      let adminNotifSuccess = false;
      let adminNotifError: string | null = null;
      try {
        const adminEmailResult = await sendAdminNewOrderEmail({
          codigoPedido,
          items: normalizedItems,
          clienteNombre: cliente.nombre,
          clienteCi: cliente.ci,
          clienteTelefono: cliente.telefono,
          clienteEmail: cliente.email || null,
          destinoDepartamento: cliente.departamento,
          destinoCiudad: cliente.ciudad,
          destinoDireccion: cliente.direccion,
          modalidadEntrega: cliente.modalidad || "DOMICILIO",
          agenciaTsi: cliente.agenciaTsi || null,
          montoProductosPyg,
          fletePyg: costoFleteCalculado,
          descuentoPyg: descuentoAplicado,
          totalPagarPyg: totalPagarCalculado,
        });

        if (adminEmailResult.success) {
          adminNotifSuccess = true;
        } else {
          adminNotifError = adminEmailResult.error || "Falla desconocida al enviar aviso al administrador";
          console.warn("[Checkout] Error despachando correo al admin:", adminNotifError);
        }
      } catch (errAdminEmail: any) {
        adminNotifError = errAdminEmail?.message || "Excepción al enviar aviso al administrador";
        console.error("[Checkout] Excepción al enviar correo al admin:", errAdminEmail);
      }

      // Actualizar trazabilidad de la notificación al admin en la base de datos
      if (pedidoId && isDbConfigured()) {
        try {
          if (adminNotifSuccess) {
            await query(
              `UPDATE pedidos 
               SET notificacion_admin_enviada = TRUE, notificacion_admin_at = NOW(), notificacion_admin_error = NULL 
               WHERE id = $1;`,
              [pedidoId]
            );
          } else if (adminNotifError) {
            await query(
              `UPDATE pedidos 
               SET notificacion_admin_enviada = FALSE, notificacion_admin_error = $1 
               WHERE id = $2;`,
              [adminNotifError, pedidoId]
            );
          }
        } catch (errUpdateNotif) {
          console.warn("No se pudo actualizar flag notificacion_admin_enviada:", errUpdateNotif);
        }
      }

      // 7. Envío de Correo de Confirmación de Compra al Cliente (Solo si ingresó su email)
      if (cliente.email && cliente.email.includes("@")) {
        try {
          const resumenProductos = normalizedItems
            .map((i) => `${i.cantidad}x ${i.nombre || i.productoId}`)
            .join(", ");

          await sendOrderConfirmationEmail({
            email: cliente.email.trim(),
            nombre: cliente.nombre,
            codigoPedido,
            productoNombre: resumenProductos || "Productos Mayoristas CDE",
            totalPyg: totalPagarCalculado,
            fletePyg: costoFleteCalculado,
            ciudadDestino: `${cliente.ciudad} (${cliente.departamento})`,
          });
        } catch (errEmail) {
          console.warn("Aviso: No se pudo despachar el correo de confirmación al cliente:", errEmail);
        }
      }

      return NextResponse.json(
        {
          success: true,
          codigoPedido,
          totalPagarPyg: totalPagarCalculado,
          fletePyg: costoFleteCalculado,
          descuentoPyg: descuentoAplicado,
          cuponCodigo: cuponCodigo || null,
          banco: "Banco Continental",
          cuenta: "010015602601",
          titular: "NUÑEZ MARTINEZ, ABEL IRENEO",
          ci: "4196328",
          ruc: "4196328-8",
          avisoAdminEnviado: adminNotifSuccess,
          mensaje: "Pedido registrado exitosamente. Transfiera el monto exacto vía SIPAP antes de las 12:00 PM.",
        },
        { status: 201 }
      );
    } catch (dbErr) {
      await client.query("ROLLBACK;");
      client.release();
      console.error("Error transaccional en Neon DB al crear pedido (ROLLBACK ejecutado):", dbErr);
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo registrar la orden en la base de datos. Por favor reintente en unos instantes.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en checkout API:", error);
    return NextResponse.json(
      { success: false, error: "Error interno procesando la orden." },
      { status: 500 }
    );
  }
}
