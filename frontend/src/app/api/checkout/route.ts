import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { isDbConfigured, getPool } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Clave maestra para AES-256 (32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
const IV_LENGTH = 16;

/**
 * Esquema de validación estricto con Zod (Mitiga inyecciones y payloads maliciosos)
 */
const CheckoutSchema = z.object({
  cliente: z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(120),
    ci: z.string().min(5, "El documento / CI debe tener al menos 5 dígitos").max(20),
    telefono: z.string().min(6, "El teléfono de contacto debe tener al menos 6 dígitos").max(25),
    email: z.string().email("Formato de correo electrónico inválido").optional().or(z.literal("")),
    departamento: z.string().min(2).max(60),
    ciudad: z.string().min(2).max(80),
    direccion: z.string().min(5, "La dirección debe ser descriptiva para el chofer de TSI").max(200),
  }),
  productoId: z.string().min(1).max(100),
  tipoFlete: z.enum(["REGULAR", "PESADO"]),
  montoProductosPyg: z.number().int().positive("El monto del producto debe ser un entero positivo"),
  terminosAceptados: z.literal(true, {
    errorMap: () => ({ message: "Debe aceptar expresamente las condiciones de inspección y despacho TSI" }),
  }),
});

/**
 * Función de cifrado simétrico AES-256-CBC retornando Buffer binario para BYTEA de PostgreSQL
 */
function encryptAES256Buffer(text: string): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

/**
 * Función Hash SHA-256 para Blind Indexing
 */
function hashSHA256(text: string): string {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // 0. Control de tasa de peticiones (Rate Limiting anti DoS / Spam)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`checkout_${clientIp}`, {
      windowMs: 10 * 60 * 1000, // 10 minutos
      max: 15, // Máximo 15 pedidos cada 10 min por IP
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

    const { cliente, productoId, tipoFlete, montoProductosPyg } = parseResult.data;

    // 2. Regla inmutable de Flete TSI en Servidor
    const costoFleteCalculado = tipoFlete === "PESADO" ? 50000 : 35000;
    const totalPagarCalculado = montoProductosPyg + costoFleteCalculado;

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

    // 5. Auditoría legal de aceptación
    const timestampAceptacion = new Date();

    // 6. Persistencia real en Neon PostgreSQL
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
            ci_hash, telefono_hash, ciudad_destino, departamento
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (ci_hash) DO UPDATE SET
            nombre_completo = EXCLUDED.nombre_completo,
            telefono_cifrado = EXCLUDED.telefono_cifrado,
            direccion_cifrada = EXCLUDED.direccion_cifrada,
            ciudad_destino = EXCLUDED.ciudad_destino,
            departamento = EXCLUDED.departamento
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
          ]
        );
        const clienteId = clienteRes.rows[0].id;

        // Insertar Pedido
        const pedidoRes = await client.query(
          `
          INSERT INTO pedidos (
            codigo_pedido, cliente_id, monto_productos_pyg, monto_flete_pyg, total_pagar_pyg,
            estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp
          ) VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', TRUE, $6, $7)
          RETURNING id;
          `,
          [
            codigoPedido,
            clienteId,
            montoProductosPyg,
            costoFleteCalculado,
            totalPagarCalculado,
            clientIp,
            timestampAceptacion,
          ]
        );
        const pedidoId = pedidoRes.rows[0].id;

        // Buscar producto en catálogo para snapshot de costos
        const prodQuery = await client.query(
          "SELECT id, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg FROM productos WHERE sku = $1 OR id::text = $1 LIMIT 1;",
          [productoId]
        );

        let prodDb = prodQuery.rows[0];
        if (!prodDb) {
          // Fallback al primer producto si se pasó un ID genérico demo
          const fallbackQuery = await client.query("SELECT id, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg FROM productos LIMIT 1;");
          prodDb = fallbackQuery.rows[0];
        }

        if (prodDb) {
          await client.query(
            `
            INSERT INTO pedido_items (
              pedido_id, producto_id, cantidad, costo_unitario_usd,
              cotizacion_usada_pyg, costo_unitario_pyg, precio_unitario_pyg, subtotal_pyg
            ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7);
            `,
            [
              pedidoId,
              prodDb.id,
              prodDb.costo_neto_usd,
              prodDb.cotizacion_aplicada_pyg,
              prodDb.costo_neto_pyg,
              montoProductosPyg,
              montoProductosPyg,
            ]
          );
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

    // 7. Envío de Correo de Confirmación de Compra al Cliente
    if (cliente.email && cliente.email.includes("@")) {
      try {
        await sendOrderConfirmationEmail({
          email: cliente.email.trim(),
          nombre: cliente.nombre,
          codigoPedido,
          productoNombre: productoId || "Producto Mayorista CDE",
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
        banco: "Banco Continental",
        cuenta: "010015602601",
        titular: "NUÑEZ MARTINEZ, ABEL IRENEO",
        ci: "4196328",
        ruc: "4196328-8",
        mensaje: "Pedido registrado exitosamente. Transfiera el monto exacto vía SIPAP antes de las 12:00 PM.",
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error("Error en checkout API:", error);
    return NextResponse.json(
      { success: false, error: "Error interno procesando la orden." },
      { status: 500 }
    );
  }
}
