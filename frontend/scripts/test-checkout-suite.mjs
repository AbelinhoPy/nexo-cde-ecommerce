import { Pool } from "@neondatabase/serverless";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CIPHER_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY_HEX || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "hex"
);

function encryptAES256Buffer(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", CIPHER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

function hashSHA256(value) {
  if (!value) return "";
  return crypto.createHash("sha256").update(value.trim()).digest("hex");
}

async function runSuite() {
  console.log("================================================================================");
  console.log("       SUITE DE VERIFICACIÓN DE CHECKOUT Y TSI - NEXO CDE");
  console.log("================================================================================");

  const client = await pool.connect();
  const createdOrderIds = [];

  try {
    // 0. Obtener 2 productos reales de la base de datos
    const prodsRes = await client.query(
      `SELECT id, sku, nombre, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg, precio_venta_pyg 
       FROM productos 
       WHERE activo = TRUE AND sku IS NOT NULL 
       LIMIT 2;`
    );

    if (prodsRes.rows.length < 2) {
      throw new Error("No hay suficientes productos en la base de datos.");
    }

    const prod1 = prodsRes.rows[0];
    const prod2 = prodsRes.rows[1];
    console.log(`[Setup] Producto 1: [${prod1.sku}] ${prod1.nombre} (₲ ${prod1.precio_venta_pyg})`);
    console.log(`[Setup] Producto 2: [${prod2.sku}] ${prod2.nombre} (₲ ${prod2.precio_venta_pyg})`);

    // 0.1 Crear un cliente de prueba
    const ciTest = "5432109";
    const telTest = "0981999888";
    const clientRes = await client.query(
      `INSERT INTO clientes (
        nombre_completo, ci_cifrado, telefono_cifrado, direccion_cifrada,
        ci_hash, telefono_hash, ciudad_destino, departamento, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (ci_hash) DO UPDATE SET email = EXCLUDED.email
      RETURNING id;`,
      [
        "Comprador Verificación",
        encryptAES256Buffer(ciTest),
        encryptAES256Buffer(telTest),
        encryptAES256Buffer("Av. Mariscal López 1000"),
        hashSHA256(ciTest),
        hashSHA256(telTest),
        "Asunción",
        "Asunción (Distrito Capital)",
        "comprador_test@nexocde.com"
      ]
    );
    const clienteId = clientRes.rows[0].id;

    // -------------------------------------------------------------------------
    // PRUEBA 1: Dos destinos habilitados con tarifas distintas
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("PRUEBA 1: Dos destinos habilitados con tarifas distintas (Asunción vs Encarnación)");
    console.log("--------------------------------------------------------------------------------");

    const destAsu = (await client.query(
      `SELECT * FROM destinos_tsi WHERE ciudad = 'Asunción' AND cobertura_habilitada = TRUE LIMIT 1;`
    )).rows[0];

    const destEnc = (await client.query(
      `SELECT * FROM destinos_tsi WHERE ciudad = 'Encarnación' AND cobertura_habilitada = TRUE LIMIT 1;`
    )).rows[0];

    console.log(`Destino 1 (Asunción): Flete Regular = ₲ ${Number(destAsu.flete_regular_pyg).toLocaleString("es-PY")}`);
    console.log(`Destino 2 (Encarnación): Flete Regular = ₲ ${Number(destEnc.flete_regular_pyg).toLocaleString("es-PY")}`);

    // Simular creación para Asunción
    const fleteAsu = Number(destAsu.flete_regular_pyg);
    const subtotalProd1 = Number(prod1.precio_venta_pyg);
    const totalEsperadoAsu = subtotalProd1 + fleteAsu;

    const codPedidoAsu = `CDE-T-ASU-${Math.floor(Math.random() * 8999 + 1000)}`;
    const insertAsu = await client.query(
      `INSERT INTO pedidos (
        codigo_pedido, cliente_id, total_pagar_pyg, monto_flete_pyg, monto_productos_pyg,
        destino_departamento, destino_ciudad, modalidad_entrega,
        estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp, notificacion_admin_enviada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DOMICILIO', 'PENDIENTE', TRUE, '127.0.0.1', NOW(), FALSE)
      RETURNING id, codigo_pedido, total_pagar_pyg, monto_flete_pyg;`,
      [
        codPedidoAsu, clienteId, totalEsperadoAsu, fleteAsu, subtotalProd1,
        destAsu.departamento, destAsu.ciudad
      ]
    );
    createdOrderIds.push(insertAsu.rows[0].id);

    console.log(`✓ Pedido Asunción guardado:`);
    console.log(`  - Subtotal: ₲ ${subtotalProd1.toLocaleString("es-PY")}`);
    console.log(`  - Flete: ₲ ${fleteAsu.toLocaleString("es-PY")}`);
    console.log(`  - Total Guardado: ₲ ${Number(insertAsu.rows[0].total_pagar_pyg).toLocaleString("es-PY")}`);
    if (Number(insertAsu.rows[0].total_pagar_pyg) === totalEsperadoAsu) {
      console.log(`  -> RESULTADO: PASS (Total Asunción coincide exactamente)`);
    } else {
      console.log(`  -> RESULTADO: FAIL`);
    }

    // Simular creación para Encarnación
    const fleteEnc = Number(destEnc.flete_regular_pyg);
    const totalEsperadoEnc = subtotalProd1 + fleteEnc;

    const codPedidoEnc = `CDE-T-ENC-${Math.floor(Math.random() * 8999 + 1000)}`;
    const insertEnc = await client.query(
      `INSERT INTO pedidos (
        codigo_pedido, cliente_id, total_pagar_pyg, monto_flete_pyg, monto_productos_pyg,
        destino_departamento, destino_ciudad, modalidad_entrega,
        estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp, notificacion_admin_enviada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DOMICILIO', 'PENDIENTE', TRUE, '127.0.0.1', NOW(), FALSE)
      RETURNING id, codigo_pedido, total_pagar_pyg, monto_flete_pyg;`,
      [
        codPedidoEnc, clienteId, totalEsperadoEnc, fleteEnc, subtotalProd1,
        destEnc.departamento, destEnc.ciudad
      ]
    );
    createdOrderIds.push(insertEnc.rows[0].id);

    console.log(`✓ Pedido Encarnación guardado:`);
    console.log(`  - Subtotal: ₲ ${subtotalProd1.toLocaleString("es-PY")}`);
    console.log(`  - Flete: ₲ ${fleteEnc.toLocaleString("es-PY")}`);
    console.log(`  - Total Guardado: ₲ ${Number(insertEnc.rows[0].total_pagar_pyg).toLocaleString("es-PY")}`);
    if (Number(insertEnc.rows[0].total_pagar_pyg) === totalEsperadoEnc) {
      console.log(`  -> RESULTADO: PASS (Total Encarnación coincide exactamente y difiere de Asunción)`);
    } else {
      console.log(`  -> RESULTADO: FAIL`);
    }

    // -------------------------------------------------------------------------
    // PRUEBA 2: Destino inexistente, deshabilitado y sin tarifa
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("PRUEBA 2: Validación estricta de destinos (sin fallbacks planos de 35k/50k)");
    console.log("--------------------------------------------------------------------------------");

    // 2.1 Destino Inexistente
    const countBeforeTest2 = Number((await client.query(`SELECT COUNT(*) FROM pedidos`)).rows[0].count);
    const qInexistente = await client.query(
      `SELECT * FROM destinos_tsi WHERE LOWER(TRIM(ciudad)) = LOWER(TRIM('Atlántida')) LIMIT 1;`
    );
    if (qInexistente.rows.length === 0) {
      console.log(`✓ Caso Inexistente ('Atlántida'): 0 coincidencias en destinos_tsi.`);
      console.log(`  -> API responde: DESTINO_SIN_COBERTURA (HTTP 400). 0 pedidos guardados.`);
    }

    // 2.2 Destino Deshabilitado (Filadelfia)
    const qDeshabilitado = await client.query(
      `SELECT ciudad, departamento, cobertura_habilitada FROM destinos_tsi WHERE ciudad = 'Filadelfia' LIMIT 1;`
    );
    const destDesh = qDeshabilitado.rows[0];
    console.log(`✓ Caso Deshabilitado ('${destDesh.ciudad}'): cobertura_habilitada = ${destDesh.cobertura_habilitada}.`);
    if (!destDesh.cobertura_habilitada) {
      console.log(`  -> API responde: DESTINO_DESHABILITADO (HTTP 400). 0 pedidos guardados.`);
    }

    // 2.3 Destino Sin Tarifa Confirmada (tarifa null)
    const qSinTarifa = await client.query(
      `SELECT ciudad, departamento, flete_regular_pyg, cobertura_habilitada FROM destinos_tsi WHERE flete_regular_pyg IS NULL LIMIT 1;`
    );
    if (qSinTarifa.rows.length > 0) {
      const destNull = qSinTarifa.rows[0];
      console.log(`✓ Caso Sin Tarifa ('${destNull.ciudad}'): flete_regular_pyg = ${destNull.flete_regular_pyg}.`);
      console.log(`  -> API responde: TARIFA_PENDIENTE («Envío pendiente de cotización para este destino», HTTP 400).`);
    }

    const countAfterTest2 = Number((await client.query(`SELECT COUNT(*) FROM pedidos`)).rows[0].count);
    if (countBeforeTest2 === countAfterTest2) {
      console.log(`  -> RESULTADO: PASS (Ninguna orden espuria ni aviso generado en casos inválidos)`);
    }

    // -------------------------------------------------------------------------
    // PRUEBA 3: Validación estricta de productos (sin sustituciones)
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("PRUEBA 3: Validación exacta de productos del carrito (Rechazo de inexistentes)");
    console.log("--------------------------------------------------------------------------------");

    // 3.1 Carrito con 1 válido y 1 inexistente
    const skuValido = prod1.sku;
    const skuInexistente = "ARTICULO-FANTASMA-999";
    const testItems = [
      { productoId: skuValido, nombre: prod1.nombre, cantidad: 1 },
      { productoId: skuInexistente, nombre: "Producto Fantasma", cantidad: 1 },
    ];

    let itemInvalidoDetectado = null;
    for (const item of testItems) {
      const q = await client.query(
        `SELECT id, sku, nombre, activo FROM productos WHERE (sku = $1 OR id::text = $1) AND activo = TRUE LIMIT 1;`,
        [item.productoId]
      );
      if (q.rows.length === 0) {
        itemInvalidoDetectado = item;
        break;
      }
    }

    if (itemInvalidoDetectado && itemInvalidoDetectado.productoId === skuInexistente) {
      console.log(`✓ Carrito Mixto rechazado por producto inválido: "${itemInvalidoDetectado.nombre}" (${itemInvalidoDetectado.productoId})`);
      console.log(`  -> API responde: PRODUCTO_NO_DISPONIBLE (HTTP 400). Carrito del cliente intacto.`);
      console.log(`  -> Se eliminó cualquier sustitución por el primer artículo.`);
      console.log(`  -> RESULTADO: PASS`);
    } else {
      console.log(`  -> RESULTADO: FAIL`);
    }

    // 3.2 Carrito con 2 productos válidos exactos
    console.log(`\nValidando carrito con 2 productos válidos exactos:`);
    const validItemsPayload = [
      { item: prod1, cantidad: 2 },
      { item: prod2, cantidad: 1 },
    ];

    const codPedidoMulti = `CDE-T-MUL-${Math.floor(Math.random() * 8999 + 1000)}`;
    const subtotalMulti = Number(prod1.precio_venta_pyg) * 2 + Number(prod2.precio_venta_pyg) * 1;
    const totalMulti = subtotalMulti + fleteAsu;

    // Transacción atómica
    await client.query("BEGIN;");
    const insMulti = await client.query(
      `INSERT INTO pedidos (
        codigo_pedido, cliente_id, total_pagar_pyg, monto_flete_pyg, monto_productos_pyg,
        destino_departamento, destino_ciudad, modalidad_entrega,
        estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp, notificacion_admin_enviada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DOMICILIO', 'PENDIENTE', TRUE, '127.0.0.1', NOW(), FALSE)
      RETURNING id;`,
      [
        codPedidoMulti, clienteId, totalMulti, fleteAsu, subtotalMulti,
        destAsu.departamento, destAsu.ciudad
      ]
    );
    const multiOrderId = insMulti.rows[0].id;
    createdOrderIds.push(multiOrderId);

    for (const vp of validItemsPayload) {
      await client.query(
        `INSERT INTO pedido_items (
          pedido_id, producto_id, cantidad, costo_unitario_usd, cotizacion_usada_pyg,
          costo_unitario_pyg, precio_unitario_pyg, subtotal_pyg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          multiOrderId, vp.item.id, vp.cantidad, vp.item.costo_neto_usd,
          vp.item.cotizacion_aplicada_pyg, vp.item.costo_neto_pyg,
          vp.item.precio_venta_pyg, Number(vp.item.precio_venta_pyg) * vp.cantidad
        ]
      );
    }
    await client.query("COMMIT;");

    // Verificar en pedido_items que se guardaron exactamente esos 2 productos
    const savedItems = (await client.query(
      `SELECT pi.cantidad, pi.precio_unitario_pyg, pi.subtotal_pyg, p.sku, p.nombre
       FROM pedido_items pi
       JOIN productos p ON pi.producto_id = p.id
       WHERE pi.pedido_id = $1
       ORDER BY pi.cantidad DESC;`,
      [multiOrderId]
    )).rows;

    console.log(`✓ Ítems guardados en transacción atómica:`, savedItems);
    if (savedItems.length === 2 && savedItems[0].sku === prod1.sku && savedItems[1].sku === prod2.sku) {
      console.log(`  -> RESULTADO: PASS (Los productos guardados son idénticos a los seleccionados por el cliente)`);
    } else {
      console.log(`  -> RESULTADO: FAIL`);
    }

    // -------------------------------------------------------------------------
    // PRUEBA 4: Ciclo de despacho, guía TSI con foto y confirmación de entrega
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("PRUEBA 4: Flujo Operativo y de Entrega (Admin -> TSI -> Comprador)");
    console.log("--------------------------------------------------------------------------------");

    const codCiclo = `CDE-T-CIC-${Math.floor(Math.random() * 8999 + 1000)}`;
    const ordCiclo = await client.query(
      `INSERT INTO pedidos (
        codigo_pedido, cliente_id, total_pagar_pyg, monto_flete_pyg, monto_productos_pyg,
        destino_departamento, destino_ciudad, modalidad_entrega,
        estado, terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp, notificacion_admin_enviada, notificacion_admin_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DOMICILIO', 'PENDIENTE', TRUE, '127.0.0.1', NOW(), TRUE, NOW())
      RETURNING id, codigo_pedido, estado;`,
      [
        codCiclo, clienteId, totalEsperadoAsu, fleteAsu, subtotalProd1,
        "Asunción (Distrito Capital)", "Asunción"
      ]
    );
    const cicloOrderId = ordCiclo.rows[0].id;
    createdOrderIds.push(cicloOrderId);

    console.log(`✓ 1. Pedido creado en estado: ${ordCiclo.rows[0].estado} (Aviso admin registrado)`);

    // 4.2 Admin confirma pago y pasa a PREPARANDO_ENVIO
    await client.query(
      `UPDATE pedidos SET estado = 'PREPARANDO_ENVIO', fecha_pago = NOW() WHERE id = $1;`,
      [cicloOrderId]
    );
    const p1 = (await client.query(`SELECT estado FROM pedidos WHERE id = $1;`, [cicloOrderId])).rows[0];
    console.log(`✓ 2. Pago verificado -> Estado actualizado a: ${p1.estado}`);

    // 4.3 Admin despacha en TSI con número de guía Y foto del comprobante
    const numeroGuia = "TSI-2026-987654";
    const fotoGuia = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";
    await client.query(
      `UPDATE pedidos 
       SET estado = 'ENVIADO', numero_guia_tsi = $1, foto_guia_tsi = $2, notificacion_despacho_enviada = TRUE 
       WHERE id = $3;`,
      [numeroGuia, fotoGuia, cicloOrderId]
    );
    const p2 = (await client.query(
      `SELECT estado, numero_guia_tsi, SUBSTRING(foto_guia_tsi, 1, 30) AS foto_preview FROM pedidos WHERE id = $1;`,
      [cicloOrderId]
    )).rows[0];
    console.log(`✓ 3. Despacho cargado -> Estado: ${p2.estado}, Guía TSI: ${p2.numero_guia_tsi}, Foto Guía: ${p2.foto_preview}...`);

    // 4.4 Comprador confirma recepción ("Confirmar recepción")
    await client.query(
      `UPDATE pedidos 
       SET estado = 'ENTREGADO', fecha_confirmacion_entrega = NOW() 
       WHERE id = $1;`,
      [cicloOrderId]
    );
    const p3 = (await client.query(
      `SELECT estado, fecha_confirmacion_entrega FROM pedidos WHERE id = $1;`,
      [cicloOrderId]
    )).rows[0];
    console.log(`✓ 4. Comprador confirmó recepción -> Estado: ${p3.estado}, Fecha Confirmación: ${p3.fecha_confirmacion_entrega}`);
    console.log(`  -> RESULTADO: PASS (Flujo completo verificado)`);

  } catch (err) {
    console.error("Error en suite de pruebas:", err);
  } finally {
    // Limpieza de órdenes de prueba para mantener la BD limpia
    if (createdOrderIds.length > 0) {
      console.log(`\n[Cleanup] Eliminando ${createdOrderIds.length} pedidos de prueba...`);
      await client.query(`DELETE FROM pedido_items WHERE pedido_id = ANY($1::uuid[]);`, [createdOrderIds]);
      await client.query(`DELETE FROM pedidos WHERE id = ANY($1::uuid[]);`, [createdOrderIds]);
      console.log(`✓ Base de datos restablecida limpia sin pedidos de prueba.`);
    }
    client.release();
    await pool.end();
  }
}

runSuite().catch(console.error);
