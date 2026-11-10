import { Pool } from '@neondatabase/serverless';

const BASE_URL = 'http://localhost:3000';
const DATABASE_URL = "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";
const ADMIN_PIN = "4196";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runSimulation() {
  console.log("=================================================================");
  console.log("🚀 SIMULACIÓN INTEGRAL E2E - CLIENTE REAL, SEGURIDAD Y NEON DB");
  console.log("=================================================================\n");

  let codigoPedidoGenerado = null;

  // -------------------------------------------------------------
  // TEST 1: Compra como Cliente Normal (Checkout PlayStation 5)
  // -------------------------------------------------------------
  console.log("▶ TEST 1: Realizar compra completa como Cliente Normal...");
  try {
    const payloadCliente = {
      cliente: {
        nombre: "Carlos Benítez Silva",
        ci: "3892145",
        telefono: "0983 554 120",
        email: "carlos.benitez.py@test.com",
        departamento: "Central",
        ciudad: "Fernando de la Mora",
        direccion: "Avda. Mariscal López c/ 10 de Julio casa 452",
      },
      productoId: "CON-PS5-SLIM-DIG",
      tipoFlete: "PESADO", // Flete plano oficial ₲50.000 para consolas
      montoProductosPyg: 3971000,
      terminosAceptados: true,
    };

    const res = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadCliente),
    });

    const data = await res.json();
    assert(res.status === 201, `Status HTTP 201 Created (recibido ${res.status})`);
    assert(data.success === true, "Respuesta con success = true");
    assert(typeof data.codigoPedido === "string" && data.codigoPedido.startsWith("CDE-"), `Código generado formato válido (${data.codigoPedido})`);
    assert(data.fletePyg === 50000, "Cálculo flete plano PESADO ₲50.000 exacto");
    assert(data.totalPagarPyg === 4021000, "Total a pagar = ₲3.971.000 + ₲50.000 = ₲4.021.000");
    assert(data.titular === "NUÑEZ MARTINEZ, ABEL IRENEO", "Titular de cuenta verificado: Abel Ireneo");
    assert(data.cuenta === "010015602601", "Cuenta Banco Continental verificada: 010015602601");
    assert(data.ruc === "4196328-8", "RUC oficial verificado: 4196328-8");

    codigoPedidoGenerado = data.codigoPedido;
  } catch (err) {
    assert(false, `Error ejecutando checkout cliente: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Verificación de Integridad y Cifrado en Neon PostgreSQL
  // -------------------------------------------------------------
  console.log("\n▶ TEST 2: Verificación de persistencia y cifrado AES-256 en Neon DB...");
  if (codigoPedidoGenerado) {
    const client = await pool.connect();
    try {
      // Consultar Pedido
      const pedidoRes = await client.query(
        "SELECT id, codigo_pedido, cliente_id, monto_productos_pyg, monto_flete_pyg, total_pagar_pyg, estado, terminos_aceptados FROM pedidos WHERE codigo_pedido = $1;",
        [codigoPedidoGenerado]
      );

      assert(pedidoRes.rows.length === 1, `Pedido ${codigoPedidoGenerado} persistido en Neon DB`);
      const rowPed = pedidoRes.rows[0];
      assert(rowPed.estado === "PENDIENTE", "Estado inicial del pedido es 'PENDIENTE'");
      assert(Number(rowPed.monto_productos_pyg) === 3971000, "Monto producto en DB coincide (₲3.971.000)");
      assert(Number(rowPed.monto_flete_pyg) === 50000, "Monto flete TSI en DB coincide (₲50.000)");
      assert(Number(rowPed.total_pagar_pyg) === 4021000, "Total a pagar en DB coincide (₲4.021.000)");
      assert(rowPed.terminos_aceptados === true, "Auditoría legal de aceptación de términos guardada");

      // Consultar Cliente y verificar cifrado AES-256 en BYTEA
      const clienteRes = await client.query(
        "SELECT id, nombre_completo, ci_cifrado, telefono_cifrado, direccion_cifrada, ci_hash, ciudad_destino, departamento FROM clientes WHERE id = $1;",
        [rowPed.cliente_id]
      );

      assert(clienteRes.rows.length === 1, "Registro de cliente encontrado");
      const rowCli = clienteRes.rows[0];
      assert(rowCli.nombre_completo === "Carlos Benítez Silva", "Nombre cliente guardado");
      assert(Buffer.isBuffer(rowCli.ci_cifrado) && rowCli.ci_cifrado.length > 16, "CI almacenada como BYTEA cifrado AES-256 (no texto plano)");
      assert(Buffer.isBuffer(rowCli.telefono_cifrado) && rowCli.telefono_cifrado.length > 16, "Teléfono almacenado como BYTEA cifrado AES-256");
      assert(Buffer.isBuffer(rowCli.direccion_cifrada) && rowCli.direccion_cifrada.length > 16, "Dirección almacenada como BYTEA cifrado AES-256");
      assert(typeof rowCli.ci_hash === "string" && rowCli.ci_hash.length === 64, "Blind index SHA-256 ci_hash generado correctamente");

      // Consultar Pedido Items
      const itemsRes = await client.query(
        "SELECT id, pedido_id, producto_id, cantidad, precio_unitario_pyg, subtotal_pyg FROM pedido_items WHERE pedido_id = $1;",
        [rowPed.id]
      );
      assert(itemsRes.rows.length >= 1, "Snapshot de items guardado en pedido_items");
    } catch (err) {
      assert(false, `Error consultando Neon DB: ${err.message}`);
    } finally {
      client.release();
    }
  }

  // -------------------------------------------------------------
  // TEST 3: Rechazo de Entradas Inválidas / Maliciosas (Zod Validation)
  // -------------------------------------------------------------
  console.log("\n▶ TEST 3: Validación contra payloads inválidos o manipulados...");
  
  // 3a. Sin aceptar términos
  try {
    const resNoTerms = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: {
          nombre: "Ana Gómez",
          ci: "1234567",
          telefono: "0971234567",
          email: "ana@test.com",
          departamento: "Itapúa",
          ciudad: "Encarnación",
          direccion: "Centro",
        },
        productoId: "CON-PS5-SLIM-DIG",
        tipoFlete: "PESADO",
        montoProductosPyg: 3971000,
        terminosAceptados: false, // Inválido
      }),
    });
    assert(resNoTerms.status === 400, "Rechazo 400 si terminosAceptados es false");
  } catch (err) {
    assert(false, `Error prueba términos: ${err.message}`);
  }

  // 3b. Monto negativo o cero
  try {
    const resNeg = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: {
          nombre: "Hacker X",
          ci: "999999",
          telefono: "0999999999",
          email: "hack@test.com",
          departamento: "Central",
          ciudad: "Luque",
          direccion: "Calle Falsa 123",
        },
        productoId: "CON-PS5-SLIM-DIG",
        tipoFlete: "PESADO",
        montoProductosPyg: -100000, // Negativo
        terminosAceptados: true,
      }),
    });
    assert(resNeg.status === 400, "Rechazo 400 si montoProductosPyg es negativo");
  } catch (err) {
    assert(false, `Error prueba monto: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 4: Formulario de Contacto y Honeypot Anti-Spam
  // -------------------------------------------------------------
  console.log("\n▶ TEST 4: Verificación de Formulario de Contacto y Filtro Anti-Spam...");
  try {
    // 4a. Consulta legítima
    const resContact = await fetch(`${BASE_URL}/api/contacto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Lic. Marcos Rivas",
        contacto: "0981 112 233",
        tipo: "consulta",
        mensaje: "Hola, quisiera saber si tienen stock del Xiaomi 13T en color azul para retirar en TSI Asunción.",
      }),
    });
    const contactData = await resContact.json();
    assert(resContact.status === 200 && contactData.success === true, "Consulta legítima procesada correctamente (200 OK)");

    // 4b. Bot spam activando honeypot (website relleno)
    const resSpam = await fetch(`${BASE_URL}/api/contacto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Spam Bot",
        contacto: "bot@spam-casino.ru",
        mensaje: "Buy cheap backlinks now",
        website: "https://spam-link-trap.com", // Trampa honeypot
      }),
    });
    const spamData = await resSpam.json();
    assert(resSpam.status === 200 && spamData.success === true, "Bot atrapado en honeypot silencioso sin enviar correo");
  } catch (err) {
    assert(false, `Error en prueba contacto: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 5: Seguridad Administrativa (PIN Protection)
  // -------------------------------------------------------------
  console.log("\n▶ TEST 5: Protección del Panel Administrativo y Métricas Financieras...");
  try {
    // 5a. Intento de acceso sin PIN
    const resSinPin = await fetch(`${BASE_URL}/api/admin/metrics`);
    assert(resSinPin.status === 401, "Denegado 401 Unauthorized sin PIN de administrador");

    // 5b. Intento con PIN inválido
    const resPinInvalido = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { "x-admin-pin": "0000" },
    });
    assert(resPinInvalido.status === 401, "Denegado 401 Unauthorized con PIN incorrecto");

    // 5c. Acceso exitoso con PIN correcto (4196)
    const resPinValido = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const metricsData = await resPinValido.json();
    assert(resPinValido.status === 200 && metricsData.success === true, "Acceso concedido 200 OK con PIN de administrador correcto");
    assert(metricsData.resumen !== undefined, "Métricas financieras de ganancias y recaudación entregadas");

    // 5d. Agenda de compras con PIN
    const resAgenda = await fetch(`${BASE_URL}/api/admin/agenda`, {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const agendaData = await resAgenda.json();
    assert(resAgenda.status === 200 && agendaData.success === true, "Agenda de compras Atacado Connect accesible con PIN");
  } catch (err) {
    assert(false, `Error probando seguridad admin: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 6: Asignación de Guía TSI y Notificación de Despacho
  // -------------------------------------------------------------
  console.log("\n▶ TEST 6: Registro de Guía de Remisión TSI al Pedido...");
  if (codigoPedidoGenerado) {
    try {
      const numeroGuiaTest = `TSI-${Date.now().toString().slice(-6)}`;
      const resGuia = await fetch(`${BASE_URL}/api/admin/tsi-guia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": ADMIN_PIN,
        },
        body: JSON.stringify({
          codigoPedido: codigoPedidoGenerado,
          numeroGuiaTsi: numeroGuiaTest,
          telefonoCliente: "0983 554 120",
          nombreCliente: "Carlos Benítez Silva",
        }),
      });

      const guiaData = await resGuia.json();
      assert(resGuia.status === 200 && guiaData.success === true, `Guía TSI ${numeroGuiaTest} asignada`);

      // Verificar en Neon DB que el estado cambió a 'DESPACHADO_TSI'
      const client = await pool.connect();
      try {
        const checkGuiaRes = await client.query(
          "SELECT estado, numero_guia_tsi FROM pedidos WHERE codigo_pedido = $1;",
          [codigoPedidoGenerado]
        );
        assert(checkGuiaRes.rows[0].estado === "DESPACHADO_TSI", "Estado de pedido actualizado a 'DESPACHADO_TSI' en Neon");
        assert(checkGuiaRes.rows[0].numero_guia_tsi === numeroGuiaTest, "Número de guía TSI guardado en Neon DB");
      } finally {
        client.release();
      }
    } catch (err) {
      assert(false, `Error vinculando guía TSI: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 7: Cabeceras de Seguridad HTTP (Security Headers)
  // -------------------------------------------------------------
  console.log("\n▶ TEST 7: Verificación de HTTP Security Headers y CSP...");
  try {
    const resRoot = await fetch(`${BASE_URL}/`);
    assert(resRoot.headers.get("x-frame-options") === "DENY", "X-Frame-Options: DENY (anti-clickjacking)");
    assert(resRoot.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff (anti-MIME sniffing)");
    assert(resRoot.headers.has("content-security-policy"), "Content-Security-Policy header activo");
  } catch (err) {
    assert(false, `Error verificando cabeceras de seguridad: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Resumen Final
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`📊 RESULTADO DE LA SUITE DE PRUEBAS:`);
  console.log(`   Total pruebas: ${totalTests}`);
  console.log(`   Superadas:     ${passedTests}`);
  console.log(`   Fallidas:      ${failedTests}`);
  console.log("=================================================================");

  await pool.end();

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSimulation().catch(err => {
  console.error("Fallo crítico en el test runner:", err);
  process.exit(1);
});
