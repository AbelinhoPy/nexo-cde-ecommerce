const BASE_URL = "http://localhost:3000";
const ADMIN_PIN = "4196";

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE COMPROBANTE FÍSICO TSI Y CONCIERGE ===");
  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`  ✓ [TEST ${total}] PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ [TEST ${total}] FAIL: ${desc}`);
    }
  }

  // 1. Probar solicitud concierge de producto especial
  try {
    const res = await fetch(`${BASE_URL}/api/concierge/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Carlos Gómez Encarnación",
        telefono: "0971 555 777",
        email: "carlos.gomez@test.com",
        productoSolicitado: "MacBook Pro 16 M3 Max 36GB",
        linkReferencia: "https://atacadoconnect.com/macbook-pro-16",
        ciudadDestino: "Encarnación",
        notas: "Color Space Black teclado en español si tienen"
      })
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "POST /api/concierge/request guarda solicitud especial");
  } catch (e) {
    assert(false, `Error en concierge request: ${e.message}`);
  }

  // 2. Probar lectura de solicitudes concierge desde Admin con PIN
  try {
    const res = await fetch(`${BASE_URL}/api/admin/concierge`, {
      headers: { "x-admin-pin": ADMIN_PIN }
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Array.isArray(data.solicitudes), "GET /api/admin/concierge retorna solicitudes para Abel");
  } catch (e) {
    assert(false, `Error en admin concierge: ${e.message}`);
  }

  // 3. Registrar un cliente nuevo
  const testEmail = `cliente_foto_${Date.now()}@test.com`;
  let customerToken = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Test Foto TSI Cliente",
        email: testEmail,
        ci: "5555444",
        telefono: "0983 111 222",
        ciudad: "Asunción",
        departamento: "Asunción (Distrito Capital)",
        direccion: "Avda. Mariscal López 1234 c/ San Martín",
        password: "PasswordSeguro123!"
      })
    });
    const data = await res.json();
    customerToken = data.token;
    assert(res.status === 201 && Boolean(customerToken), "Registro de cliente para prueba de foto TSI");
  } catch (e) {
    assert(false, `Error registrando cliente: ${e.message}`);
  }

  // 4. Crear un pedido con checkout
  let codigoPedido = "";
  try {
    const res = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [
          {
            productoId: "1450781",
            nombre: "Smartphone Xiaomi Redmi Note 13 4G",
            precioPyg: 1184000,
            tipoFlete: "REGULAR",
            cantidad: 1
          }
        ],
        montoProductosPyg: 1184000,
        terminosAceptados: true,
        cuponCodigo: "CDE5",
        cliente: {
          nombre: "Test Foto TSI Cliente",
          ci: "5555444",
          telefono: "0983 111 222",
          email: testEmail,
          ciudad: "Asunción",
          departamento: "Asunción (Distrito Capital)",
          direccion: "Avda. Mariscal López 1234 c/ San Martín"
        }
      })
    });
    const data = await res.json();
    codigoPedido = data.codigoPedido;
    assert(res.status === 201 && Boolean(codigoPedido), `Checkout exitoso con orden ${codigoPedido}`);
  } catch (e) {
    assert(false, `Error en checkout: ${e.message}`);
  }

  // 5. Asignar guía TSI y foto del comprobante físico de ventanilla
  const dummyFotoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  try {
    const res = await fetch(`${BASE_URL}/api/admin/tsi-guia`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-pin": ADMIN_PIN
      },
      body: JSON.stringify({
        codigoPedido: codigoPedido,
        numeroGuiaTsi: "TSI-ASU-998877",
        telefonoCliente: "0983 111 222",
        nombreCliente: "Test Foto TSI Cliente",
        fotoGuiaTsi: dummyFotoBase64
      })
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "POST /api/admin/tsi-guia vincula número de guía y FOTO de comprobante");
  } catch (e) {
    assert(false, `Error vinculando guía y foto: ${e.message}`);
  }

  // 6. Consultar pedidos del cliente y verificar que la foto y guía aparecen
  try {
    const res = await fetch(`${BASE_URL}/api/customer/orders`, {
      headers: { "Authorization": `Bearer ${customerToken}` }
    });
    const data = await res.json();
    const pedido = data.pedidos?.find(p => p.codigoPedido === codigoPedido);
    assert(
      res.status === 200 && 
      pedido && 
      pedido.numeroGuiaTsi === "TSI-ASU-998877" && 
      pedido.fotoGuiaTsi === dummyFotoBase64,
      "GET /api/customer/orders retorna foto del comprobante físico TSI para el cliente"
    );
  } catch (e) {
    assert(false, `Error consultando pedidos del cliente: ${e.message}`);
  }

  // 7. Consultar pedidos desde admin
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { "x-admin-pin": ADMIN_PIN }
    });
    const data = await res.json();
    const pedidoAdmin = data.pedidos?.find(p => p.codigo === codigoPedido);
    assert(
      res.status === 200 && 
      pedidoAdmin && 
      pedidoAdmin.guia === "TSI-ASU-998877" &&
      Boolean(pedidoAdmin.fotoGuiaTsi),
      "GET /api/admin/orders retorna pedido con foto de comprobante en panel administrativo"
    );
  } catch (e) {
    assert(false, `Error consultando pedidos admin: ${e.message}`);
  }

  console.log(`\n=== RESUMEN: ${passed} de ${total} pruebas superadas (${((passed/total)*100).toFixed(0)}%) ===\n`);
  if (passed === total) {
    console.log("¡TODAS LAS PRUEBAS FUNCIONAN A LA PERFECCIÓN!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
