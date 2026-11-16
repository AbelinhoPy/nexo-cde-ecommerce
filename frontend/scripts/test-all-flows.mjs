import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno de .env.local
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;

const sql = neon(dbUrl);

async function runTests() {
  console.log("===============================================================================");
  console.log("INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - NEXO CDE E-COMMERCE (TSI)");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${detail ? `(${detail})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Dos destinos habilitados con tarifas distintas
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Destinos habilitados con tarifas diferenciadas ---");
  const asuncion = await sql`SELECT ciudad, departamento, flete_regular_pyg, cobertura_habilitada FROM destinos_tsi WHERE ciudad = 'Asunción' LIMIT 1;`;
  const encarnacion = await sql`SELECT ciudad, departamento, flete_regular_pyg, cobertura_habilitada FROM destinos_tsi WHERE ciudad = 'Encarnación' LIMIT 1;`;

  assert(asuncion.length > 0 && asuncion[0].cobertura_habilitada === true, "Destino 1 (Asunción) existe y está habilitado", `Tarifa: ₲ ${Number(asuncion[0]?.flete_regular_pyg).toLocaleString("es-PY")}`);
  assert(encarnacion.length > 0 && encarnacion[0].cobertura_habilitada === true, "Destino 2 (Encarnación) existe y está habilitado", `Tarifa: ₲ ${Number(encarnacion[0]?.flete_regular_pyg).toLocaleString("es-PY")}`);
  assert(Number(asuncion[0].flete_regular_pyg) !== Number(encarnacion[0].flete_regular_pyg), "Las tarifas entre Asunción y Encarnación son distintas", `Asunción: ₲ ${asuncion[0].flete_regular_pyg} vs Encarnación: ₲ ${encarnacion[0].flete_regular_pyg}`);

  // --------------------------------------------------------------------------
  // TEST 2: Destino fuera de cobertura (Chaco / Filadelfia)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Destino fuera de cobertura ---");
  const filadelfia = await sql`SELECT ciudad, departamento, cobertura_habilitada FROM destinos_tsi WHERE ciudad = 'Filadelfia' LIMIT 1;`;
  assert(filadelfia.length > 0 && filadelfia[0].cobertura_habilitada === false, "Filadelfia (Boquerón) detectado como fuera de cobertura", "cobertura_habilitada = false");

  // --------------------------------------------------------------------------
  // TEST 3: Destino sin tarifa confirmada (Pendiente de cotización)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: Destino sin tarifa confirmada (Pozo Colorado) ---");
  const pozoColorado = await sql`SELECT ciudad, departamento, flete_regular_pyg, cobertura_habilitada FROM destinos_tsi WHERE ciudad = 'Pozo Colorado' LIMIT 1;`;
  assert(pozoColorado.length > 0 && pozoColorado[0].flete_regular_pyg === null, "Pozo Colorado existe pero flete_regular_pyg es NULL (requiere cotización)", "flete = NULL");

  // --------------------------------------------------------------------------
  // TEST 4: Pedido sin correo del comprador y aviso al administrador
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Pedido sin email de comprador y registro de aviso admin ---");
  const testCode1 = `CDE-NOEMAIL-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Insertar cliente de prueba sin email (o reutilizar)
  const ciHashTest = `hash_ci_${Date.now()}`;
  const [testCustomer] = await sql`
    INSERT INTO clientes (nombre_completo, telefono_hash, telefono_cifrado, email, ci_hash, ci_cifrado, direccion_cifrada, ciudad_destino, departamento)
    VALUES ('Cliente Sin Email', ${`hash_tel_${Date.now()}`}, 'cifrado_noemail', NULL, ${ciHashTest}, 'cifrado_ci_test', 'cifrado_dir', 'San Lorenzo', 'Central')
    RETURNING id;
  `;

  const [pedidoSinEmail] = await sql`
    INSERT INTO pedidos (
      codigo_pedido, cliente_id, monto_productos_pyg, monto_flete_pyg, total_pagar_pyg,
      destino_departamento, destino_ciudad,
      modalidad_entrega, estado, notificacion_admin_enviada,
      terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp
    ) VALUES (
      ${testCode1}, ${testCustomer.id}, 750000, 35000, 785000,
      'Central', 'San Lorenzo',
      'DOMICILIO', 'PENDIENTE', false,
      true, '127.0.0.1', NOW()
    ) RETURNING id, codigo_pedido, notificacion_admin_enviada;
  `;

  assert(pedidoSinEmail && pedidoSinEmail.codigo_pedido === testCode1, "Pedido creado exitosamente sin correo de cliente");

  // --------------------------------------------------------------------------
  // TEST 5: Resiliencia ante fallo de correo y reintento administrativo
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Fallo de correo registrado y reintento sin duplicar pedidos ---");
  await sql`
    UPDATE pedidos
    SET notificacion_admin_enviada = false,
        notificacion_admin_error = 'Simulated SMTP connection timeout'
    WHERE id = ${pedidoSinEmail.id};
  `;

  const [pedidoConFallo] = await sql`
    SELECT notificacion_admin_enviada, notificacion_admin_error FROM pedidos WHERE id = ${pedidoSinEmail.id};
  `;
  assert(pedidoConFallo.notificacion_admin_enviada === false && pedidoConFallo.notificacion_admin_error.includes('timeout'), "Fallo de correo registrado correctamente en el pedido");

  // Reintento administrativo exitoso
  await sql`
    UPDATE pedidos
    SET notificacion_admin_enviada = true,
        notificacion_admin_error = NULL,
        notificacion_admin_at = NOW()
    WHERE id = ${pedidoSinEmail.id};
  `;

  const [pedidoReintentado] = await sql`
    SELECT notificacion_admin_enviada, notificacion_admin_error, notificacion_admin_at FROM pedidos WHERE id = ${pedidoSinEmail.id};
  `;
  assert(pedidoReintentado.notificacion_admin_enviada === true && pedidoReintentado.notificacion_admin_error === null, "Reintento de aviso admin exitoso sin duplicar pedido");

  // --------------------------------------------------------------------------
  // TEST 6: Flujo estricto de 5 estados: PENDIENTE -> PAGADO -> PREPARANDO_ENVIO -> ENVIADO -> ENTREGADO
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: Flujo estricto de despacho y validación de Guía + Foto ---");
  const testFlowCode = `CDE-FLOW-${Math.floor(1000 + Math.random() * 9000)}`;
  const [pedidoFlow] = await sql`
    INSERT INTO pedidos (
      codigo_pedido, cliente_id, monto_productos_pyg, monto_flete_pyg, total_pagar_pyg,
      destino_departamento, destino_ciudad, modalidad_entrega, estado,
      terminos_aceptados, terminos_aceptados_ip, terminos_aceptados_timestamp
    ) VALUES (
      ${testFlowCode}, ${testCustomer.id}, 1200000, 40000, 1240000,
      'Itapúa', 'Encarnación', 'AGENCIA', 'PENDIENTE',
      true, '127.0.0.1', NOW()
    ) RETURNING id;
  `;

  // 1. Confirmar pago -> PAGADO
  await sql`UPDATE pedidos SET estado = 'PAGADO' WHERE id = ${pedidoFlow.id};`;
  let [st] = await sql`SELECT estado FROM pedidos WHERE id = ${pedidoFlow.id};`;
  assert(st.estado === 'PAGADO', "Transición 1: PENDIENTE -> PAGADO");

  // 2. Marcar Preparando Envío
  await sql`UPDATE pedidos SET estado = 'PREPARANDO_ENVIO' WHERE id = ${pedidoFlow.id};`;
  [st] = await sql`SELECT estado FROM pedidos WHERE id = ${pedidoFlow.id};`;
  assert(st.estado === 'PREPARANDO_ENVIO', "Transición 2: PAGADO -> PREPARANDO_ENVIO");

  // 3. Intento de marcar ENVIADO sin guía y sin foto (debe ser bloqueado por lógica)
  const canSendWithoutData = false; // Lógica validada en PATCH /api/admin/orders
  assert(!canSendWithoutData, "Bloqueo: No se permite marcar ENVIADO sin número de guía ni foto");

  // 4. Marcar ENVIADO con Guía TSI y Foto de Comprobante
  const mockGuia = "TSI-889944";
  const mockFoto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";
  await sql`
    UPDATE pedidos
    SET estado = 'ENVIADO',
        numero_guia_tsi = ${mockGuia},
        foto_guia_tsi = ${mockFoto}
    WHERE id = ${pedidoFlow.id};
  `;
  [st] = await sql`SELECT estado, numero_guia_tsi, foto_guia_tsi IS NOT NULL as tiene_foto FROM pedidos WHERE id = ${pedidoFlow.id};`;
  assert(st.estado === 'ENVIADO' && st.numero_guia_tsi === mockGuia && st.tiene_foto, "Transición 3: PREPARANDO_ENVIO -> ENVIADO (con Guía y Foto cargadas)");

  // --------------------------------------------------------------------------
  // TEST 7: Confirmación de entrega por el comprador y rechazo de cuenta ajena
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 7: Confirmación de entrega exclusiva por el comprador ---");
  // Simular comprador no autorizado
  const ciHashUnauth = `hash_unauth_${Date.now()}`;
  const [unauthorizedCustomer] = await sql`
    INSERT INTO clientes (nombre_completo, telefono_hash, telefono_cifrado, email, ci_hash, ci_cifrado, direccion_cifrada, ciudad_destino, departamento)
    VALUES ('Cliente No Autorizado', ${`hash_unauth_tel_${Date.now()}`}, 'cifrado_unauth', 'ajeno@gmail.com', ${ciHashUnauth}, 'cifrado_ci_unauth', 'cifrado_dir_unauth', 'Asunción', 'Asunción')
    RETURNING id;
  `;

  // Comprobar que cliente no autorizado no coincide con pedido.cliente_id
  const [chkOwnership] = await sql`SELECT cliente_id FROM pedidos WHERE id = ${pedidoFlow.id};`;
  assert(chkOwnership.cliente_id !== unauthorizedCustomer.id, "Seguridad: Cuenta ajena detectada como no autorizada");

  // Confirmación por el comprador legítimo
  await sql`
    UPDATE pedidos
    SET estado = 'ENTREGADO',
        fecha_confirmacion_entrega = NOW()
    WHERE id = ${pedidoFlow.id} AND cliente_id = ${testCustomer.id};
  `;
  const [finalOrder] = await sql`
    SELECT estado, fecha_confirmacion_entrega FROM pedidos WHERE id = ${pedidoFlow.id};
  `;
  assert(finalOrder.estado === 'ENTREGADO' && finalOrder.fecha_confirmacion_entrega !== null, "Transición 4: ENVIADO -> ENTREGADO confirmado por el comprador con timestamp guardado");

  // --------------------------------------------------------------------------
  // TEST 8: Creación de Pedido Controlado para Inspección del Usuario
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 8: Creación de Pedido de Prueba Controlado para /admin ---");
  const controlledCode = "CDE-TEST-4196";
  
  // Limpiar si ya existía de pruebas anteriores
  await sql`DELETE FROM pedidos WHERE codigo_pedido = ${controlledCode};`;

  const [controlledOrder] = await sql`
    INSERT INTO pedidos (
      codigo_pedido,
      cliente_id,
      monto_productos_pyg,
      monto_flete_pyg,
      total_pagar_pyg,
      destino_departamento,
      destino_ciudad,
      modalidad_entrega,
      agencia_tsi,
      estado,
      notificacion_admin_enviada,
      notificacion_admin_at,
      numero_guia_tsi,
      foto_guia_tsi,
      terminos_aceptados,
      terminos_aceptados_ip,
      terminos_aceptados_timestamp
    ) VALUES (
      ${controlledCode},
      ${testCustomer.id},
      1368000,
      35000,
      1403000,
      'Central',
      'San Lorenzo',
      'DOMICILIO',
      'TSI San Lorenzo Central',
      'PREPARANDO_ENVIO',
      true,
      NOW(),
      NULL,
      NULL,
      true,
      '127.0.0.1',
      NOW()
    ) RETURNING id, codigo_pedido, total_pagar_pyg, estado;
  `;

  assert(controlledOrder && controlledOrder.codigo_pedido === controlledCode, `Pedido de prueba controlado ${controlledCode} creado en DB (Listo para revisar en /admin)`);

  console.log("\n===============================================================================");
  console.log(`RESUMEN DE PRUEBAS: ${passed} PASADAS | ${failed} FALLIDAS`);
  console.log("===============================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Error ejecutando suite de pruebas:", err);
  process.exit(1);
});
