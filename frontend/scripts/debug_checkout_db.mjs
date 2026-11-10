import crypto from "crypto";
import { Pool, neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";
const ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
const IV_LENGTH = 16;

function encryptAES256Buffer(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

function hashSHA256(text) {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

async function testCheckoutDirect() {
  console.log("Iniciando prueba directa de queries de checkout...");
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  console.log("Conectado con client!");

  try {
    await client.query("BEGIN;");

    const ciCifradoBuf = encryptAES256Buffer("3892145");
    const telCifradoBuf = encryptAES256Buffer("0983 554 120");
    const dirCifradoBuf = encryptAES256Buffer("Avda. Mariscal López c/ 10 de Julio casa 452");
    const ciHash = hashSHA256("3892145");
    const telefonoHash = hashSHA256("0983 554 120");

    console.log("Insertando cliente...");
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
        "Carlos Benítez Silva",
        ciCifradoBuf,
        telCifradoBuf,
        dirCifradoBuf,
        ciHash,
        telefonoHash,
        "Fernando de la Mora",
        "Central",
      ]
    );
    console.log("Cliente ID:", clienteRes.rows[0].id);

    const codigoPedido = `CDE-20261110-9481`;
    console.log("Insertando pedido...");
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
        clienteRes.rows[0].id,
        3971000,
        50000,
        4021000,
        "127.0.0.1",
        new Date(),
      ]
    );
    console.log("Pedido ID:", pedidoRes.rows[0].id);

    console.log("Buscando producto...");
    const prodQuery = await client.query(
      "SELECT id, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg FROM productos WHERE sku = $1 LIMIT 1;",
      ["CON-PS5-SLIM-DIG"]
    );
    console.log("Producto encontrado:", prodQuery.rows[0]);

    if (prodQuery.rows[0]) {
      const prodDb = prodQuery.rows[0];
      await client.query(
        `
        INSERT INTO pedido_items (
          pedido_id, producto_id, cantidad, costo_unitario_usd,
          cotizacion_usada_pyg, costo_unitario_pyg, precio_unitario_pyg, subtotal_pyg
        ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7);
        `,
        [
          pedidoRes.rows[0].id,
          prodDb.id,
          prodDb.costo_neto_usd,
          prodDb.cotizacion_aplicada_pyg,
          prodDb.costo_neto_pyg,
          3971000,
          3971000,
        ]
      );
      console.log("Item insertado!");
    }

    await client.query("COMMIT;");
    console.log("COMMIT exitoso!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("ERROR en transaccion:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

testCheckoutDirect();
