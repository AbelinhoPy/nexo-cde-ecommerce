import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { isDbConfigured, getPool } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
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
    email: z.string().email("Formato de correo electrónico inválido").optional().or(z.literal("")),
    departamento: z.string().min(2).max(60),
    ciudad: z.string().min(2).max(80),
    direccion: z.string().min(5, "La dirección debe ser descriptiva para el chofer de TSI").max(200),
  }),
  items: z.array(CartItemSchema).optional(),
  productoId: z.string().min(1).max(100).optional(),
  tipoFlete: z.enum(["REGULAR", "PESADO"]).optional(),
  montoProductosPyg: z.number().int().positive("El monto de productos debe ser positivo"),
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
      max: 15,
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

    const { cliente, items, productoId, tipoFlete, montoProductosPyg, cuponCodigo, descuentoCuponPyg } = parseResult.data;

    // Normalizar items (soporta array de carrito o producto único)
    const normalizedItems: Array<{ productoId: string; cantidad: number; precioPyg: number; tipoFlete: "REGULAR" | "PESADO"; nombre?: string }> =
      items && items.length > 0
        ? items
        : [
            {
              productoId: productoId || "CON-PS5-SLIM-DIG",
              cantidad: 1,
              precioPyg: montoProductosPyg,
              tipoFlete: tipoFlete || "REGULAR",
            },
          ];

    // 2. Regla inmutable de Flete TSI en Servidor
    const tienePesado = normalizedItems.some((it) => it.tipoFlete === "PESADO");
    const costoFleteCalculado = tienePesado ? 50000 : 35000;
    const descuentoAplicado = Math.min(descuentoCuponPyg, montoProductosPyg + costoFleteCalculado);
    const totalPagarCalculado = montoProductosPyg + costoFleteCalculado - descuentoAplicado;

    // 3. Generación de Código Único de Pedido
    const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
    const codigoPedido = `CDE-${hoyStr}-${randomHex}`;

    // 4. Cifrado AES-256 para datos sensibles PII
    const ciCifradoBuf = encryptAES256Buffer(cliente.ci);
    const telCifradoBuf = encryptAES256Buffer(cliente.telefono);
    const dirCifradoBuf = encryptAES256Buffer(cliente.direccion);

    const ciHash = hashSHA256(cliente.ci);
    const telefonoHash = hashSHA256(cliente.telefono);
    const timestampAceptacion = new Date();

    // 5. Persistencia real en Neon PostgreSQL
    if (isDbConfigured()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
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

        // Insertar Pedido con cupón y flete
        const pedidoRes = await client.query(
          `
          INSERT INTO pedidos (
            codigo_pedido, cliente_id, monto_productos_pyg, monto_flete_pyg,
            cupon_codigo, descuento_cupon_pyg, total_pagar_pyg,
            estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', TRUE, $8, $9)
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
          ]
        );
        const pedidoId = pedidoRes.rows[0].id;

        // Insertar todos los items del carrito
        for (const item of normalizedItems) {
          const prodQuery = await client.query(
            "SELECT id, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg FROM productos WHERE sku = $1 OR id::text = $1 LIMIT 1;",
            [item.productoId]
          );

          let prodDb = prodQuery.rows[0];
          if (!prodDb) {
            const fallbackQuery = await client.query("SELECT id, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg FROM productos LIMIT 1;");
            prodDb = fallbackQuery.rows[0];
          }

          if (prodDb) {
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
        }

        await client.query("COMMIT;");
      } catch (dbErr) {
        await client.query("ROLLBACK;");
        console.error("Error transaccional en Neon DB al crear pedido:", dbErr);
        return NextResponse.json(
          {
            success: false,
            error: "No se pudo registrar la orden en la base de datos. Por favor reintente en unos instantes.",
          },
          { status: 500 }
        );
      } finally {
        client.release();
      }
    }

    // 6. Envío de Correo de Confirmación de Compra al Cliente
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
        console.warn("Aviso: No se pudo despachar el correo de confirmación:", errEmail);
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
        mensaje: "Pedido registrado exitosamente. Transfiera el monto exacto vía SIPAP antes de las 12:00 PM.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en checkout API:", error);
    return NextResponse.json(
      { success: false, error: "Error interno procesando la orden." },
      { status: 500 }
    );
  }
}
