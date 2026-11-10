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

async function runTests() {
  console.log("=================================================================");
  console.log("🚀 PRUEBAS COMPLETAS: LOGIN CLIENTE, TICKET DE ENVÍO, CUPÓN & PEDIDOS");
  console.log("=================================================================\n");

  const testEmail = `cliente_${Date.now()}@test.com`;
  const testCi = `${Math.floor(1000000 + Math.random() * 8000000)}`;
  const testPassword = "MiPasswordSeguro123";
  let token = null;
  let customerId = null;
  let orderCode = null;

  // 1. Registro de Cliente con Ticket de Envío
  console.log("▶ TEST 1: Registro de nuevo cliente con Ticket de Envío...");
  try {
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Lic. Andrea González",
        ci: testCi,
        telefono: "0971 445 889",
        email: testEmail,
        password: testPassword,
        departamento: "Itapúa",
        ciudad: "Encarnación",
        direccion: "Calle Mcal. Estigarribia 850 c/ Villarrica",
      }),
    });

    const regData = await resReg.json();
    assert(resReg.status === 201, `Status 201 Created (recibido ${resReg.status})`);
    assert(regData.success === true, "Registro exitoso");
    assert(typeof regData.token === "string", "Token de sesión generado");
    assert(regData.cliente.ci === testCi, "Cédula guardada en ticket");
    assert(regData.cliente.ciudad === "Encarnación", "Ciudad guardada");

    token = regData.token;
    customerId = regData.cliente.id;
  } catch (err) {
    assert(false, `Error en registro: ${err.message}`);
  }

  // 2. Inicio de Sesión (Login) con Email y Contraseña
  console.log("\n▶ TEST 2: Inicio de sesión con credenciales válidas...");
  try {
    const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await resLogin.json();
    assert(resLogin.status === 200, "Login 200 OK");
    assert(loginData.success === true, "Login exitoso");
    assert(loginData.cliente.nombre === "Lic. Andrea González", "Datos de cliente recibidos");
    assert(loginData.cliente.ci === testCi, "Cédula descifrada correctamente");
  } catch (err) {
    assert(false, `Error en login: ${err.message}`);
  }

  // 3. Inicio de Sesión con CI y Contraseña
  console.log("\n▶ TEST 3: Inicio de sesión alternativo usando CI en lugar de email...");
  try {
    const resLoginCi = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: testCi,
        password: testPassword,
      }),
    });

    const loginCiData = await resLoginCi.json();
    assert(resLoginCi.status === 200, "Login por CI 200 OK");
    assert(loginCiData.success === true, "Login por CI exitoso");
  } catch (err) {
    assert(false, `Error en login por CI: ${err.message}`);
  }

  // 4. Rechazo de Contraseña Incorrecta
  console.log("\n▶ TEST 4: Rechazo con contraseña incorrecta...");
  try {
    const resWrong = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: testEmail,
        password: "PasswordEquivocado",
      }),
    });

    assert(resWrong.status === 401, "Rechazo 401 Unauthorized ante contraseña incorrecta");
  } catch (err) {
    assert(false, `Error prueba password incorrecto: ${err.message}`);
  }

  // 5. Cambio de Contraseña ("Cambiar Seña")
  console.log("\n▶ TEST 5: Cambio de contraseña ('Cambiar Seña')...");
  const newPassword = "NuevaPassword456";
  try {
    const resChange = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: testPassword,
        newPassword: newPassword,
      }),
    });

    const changeData = await resChange.json();
    assert(resChange.status === 200, "Cambio de contraseña 200 OK");
    assert(changeData.success === true, "Contraseña actualizada");

    // Verificar que el login ahora funciona con la nueva
    const resNewLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: testEmail,
        password: newPassword,
      }),
    });
    assert(resNewLogin.status === 200, "Login exitoso con la nueva contraseña");
  } catch (err) {
    assert(false, `Error cambiando contraseña: ${err.message}`);
  }

  // 6. Validación de Cupones
  console.log("\n▶ TEST 6: Validación de cupones de descuento...");
  try {
    // 6a. Cupón válido BIENVENIDA (₲50.000 flete)
    const resCup1 = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: "BIENVENIDA",
        subtotalProductosPyg: 3971000,
        fletePyg: 50000,
      }),
    });
    const cup1Data = await resCup1.json();
    assert(resCup1.status === 200 && cup1Data.success === true, "Cupón 'BIENVENIDA' validado");
    assert(cup1Data.cupon.descuentoPyg === 50000, "Descuento ₲50.000 en flete aplicado");

    // 6b. Cupón válido CDE5 (5% de descuento)
    const resCup2 = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: "CDE5",
        subtotalProductosPyg: 2000000,
        fletePyg: 35000,
      }),
    });
    const cup2Data = await resCup2.json();
    assert(resCup2.status === 200 && cup2Data.success === true, "Cupón 'CDE5' validado");
    assert(cup2Data.cupon.descuentoPyg === 100000, "Descuento 5% (₲100.000) calculado");

    // 6c. Cupón inexistente
    const resCupFake = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: "CUPON_FALSO_XYZ",
        subtotalProductosPyg: 1000000,
        fletePyg: 35000,
      }),
    });
    assert(resCupFake.status === 400, "Rechazo 400 ante cupón inexistente");
  } catch (err) {
    assert(false, `Error en cupones: ${err.message}`);
  }

  // 7. Compra de Múltiples Ítems de Carrito con Cupón y Ticket de Cliente
  console.log("\n▶ TEST 7: Checkout con carrito multi-ítem, cupón 'BIENVENIDA' y ticket de cliente...");
  try {
    const resCheckout = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: {
          id: customerId,
          nombre: "Lic. Andrea González",
          ci: testCi,
          telefono: "0971 445 889",
          email: testEmail,
          departamento: "Itapúa",
          ciudad: "Encarnación",
          direccion: "Calle Mcal. Estigarribia 850 c/ Villarrica",
        },
        items: [
          {
            productoId: "CON-PS5-SLIM-DIG",
            cantidad: 1,
            precioPyg: 3971000,
            tipoFlete: "PESADO",
            nombre: "PlayStation 5 Slim 1TB",
          },
          {
            productoId: "PER-PS5-DS-WHT",
            cantidad: 2,
            precioPyg: 540000,
            tipoFlete: "REGULAR",
            nombre: "Mando Sony DualSense White",
          },
        ],
        montoProductosPyg: 3971000 + (540000 * 2), // ₲5.051.000
        cuponCodigo: "BIENVENIDA",
        descuentoCuponPyg: 50000,
        terminosAceptados: true,
      }),
    });

    const checkData = await resCheckout.json();
    assert(resCheckout.status === 201, "Checkout con carrito 201 Created");
    assert(checkData.success === true, "Pedido registrado exitosamente");
    assert(checkData.fletePyg === 50000, "Flete TSI plano PESADO ₲50.000");
    assert(checkData.descuentoPyg === 50000, "Descuento de cupón ₲50.000 aplicado");
    assert(checkData.totalPagarPyg === 5051000, "Total exacto: 5.051.000 + 50.000 - 50.000 = ₲5.051.000");

    orderCode = checkData.codigoPedido;
  } catch (err) {
    assert(false, `Error en checkout de carrito: ${err.message}`);
  }

  // 8. Consulta de "Mis Compras Anteriores" del Cliente
  console.log("\n▶ TEST 8: Consulta de compras anteriores ('Mis Compras')...");
  try {
    const resOrders = await fetch(`${BASE_URL}/api/customer/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ordersData = await resOrders.json();
    assert(resOrders.status === 200, "Compras anteriores 200 OK");
    assert(ordersData.success === true, "Consulta de compras exitosa");
    assert(ordersData.pedidos.length >= 1, `Pedidos encontrados: ${ordersData.pedidos.length}`);
    const latestOrder = ordersData.pedidos[0];
    assert(latestOrder.codigoPedido === orderCode, `Último pedido coincide (${orderCode})`);
    assert(latestOrder.items.length === 2, "Items del carrito desglosados en el pedido (2 ítems)");
    assert(latestOrder.cuponCodigo === "BIENVENIDA", "Cupón 'BIENVENIDA' registrado en el historial");
  } catch (err) {
    assert(false, `Error en compras anteriores: ${err.message}`);
  }

  // 9. Vinculación de Guía TSI y Rastreo para el Cliente
  console.log("\n▶ TEST 9: Despacho con Guía TSI y verificación de rastreo en el historial del cliente...");
  if (orderCode) {
    try {
      const guiaTest = `TSI-ENC-${Date.now().toString().slice(-5)}`;
      const resGuia = await fetch(`${BASE_URL}/api/admin/tsi-guia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": ADMIN_PIN,
        },
        body: JSON.stringify({
          codigoPedido: orderCode,
          numeroGuiaTsi: guiaTest,
          telefonoCliente: "0971 445 889",
          nombreCliente: "Lic. Andrea González",
        }),
      });

      const guiaData = await resGuia.json();
      assert(resGuia.status === 200 && guiaData.success === true, "Guía TSI vinculada por el admin");

      // Consultar nuevamente las compras del cliente
      const resOrdersUpdated = await fetch(`${BASE_URL}/api/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedOrdersData = await resOrdersUpdated.json();
      const updatedOrder = updatedOrdersData.pedidos.find((p) => p.codigoPedido === orderCode);
      assert(updatedOrder.estado === "DESPACHADO_TSI", "Estado del pedido en el portal del cliente es 'DESPACHADO_TSI'");
      assert(updatedOrder.numeroGuiaTsi === guiaTest, `Guía TSI visible en el ticket del cliente (${guiaTest})`);
      assert(typeof updatedOrder.trackingUrl === "string", "Enlace de rastreo directo generado para el cliente");
    } catch (err) {
      assert(false, `Error probando despacho TSI: ${err.message}`);
    }
  }

  // 10. Verificación de Seguridad: Botón Operativo Oculto
  console.log("\n▶ TEST 10: Verificación de ocultamiento del botón operativo...");
  try {
    const resHome = await fetch(`${BASE_URL}/`);
    const homeHtml = await resHome.text();
    // Asegurar que NO haya un botón de "Panel Interno" ni "Panel Operativo CDE" visible en el header ni en los links destacados
    const headerHasAdminText = homeHtml.includes(">Panel Operativo CDE<") || homeHtml.includes(">Panel Interno<");
    assert(!headerHasAdminText, "Botón 'Panel Operativo / Interno' removido de elementos visibles");
    assert(homeHtml.includes("/admin"), "Enlace camuflado existe discretamente en el copyright para el dueño");
  } catch (err) {
    assert(false, `Error comprobando ocultamiento: ${err.message}`);
  }

  // Resumen
  console.log("\n=================================================================");
  console.log(`📊 RESULTADO SUITE DE AUTENTICACIÓN, CARRITO & COMPRAS:`);
  console.log(`   Total pruebas: ${totalTests}`);
  console.log(`   Superadas:     ${passedTests}`);
  console.log(`   Fallidas:      ${failedTests}`);
  console.log("=================================================================");

  await pool.end();

  if (failedTests > 0) process.exit(1);
  else process.exit(0);
}

runTests().catch(err => {
  console.error("Fallo general:", err);
  process.exit(1);
});
