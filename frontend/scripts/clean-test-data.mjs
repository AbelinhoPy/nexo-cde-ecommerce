import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/)[1];
const sql = neon(dbUrl);

async function cleanTestData() {
  console.log("===============================================================================");
  console.log("LIMPIEZA DE DATOS DE PRUEBA EN NEON POSTGRESQL (NEXO CDE)");
  console.log("===============================================================================\n");

  console.log("1. Eliminando ítems de pedidos de prueba (pedido_items)...");
  const delItems = await sql`DELETE FROM pedido_items;`;
  console.log("✓ pedido_items limpiado.");

  console.log("2. Eliminando pedidos de prueba (pedidos)...");
  const delPedidos = await sql`DELETE FROM pedidos;`;
  console.log("✓ pedidos limpiado.");

  console.log("3. Eliminando solicitudes de prueba de concierge...");
  const delConcierge = await sql`DELETE FROM solicitudes_concierge;`;
  console.log("✓ solicitudes_concierge limpiado.");

  console.log("4. Eliminando clientes de prueba (clientes)...");
  const delClientes = await sql`DELETE FROM clientes;`;
  console.log("✓ clientes limpiado.");

  console.log("\n--- VERIFICACIÓN POST-LIMPIEZA ---");
  const [pCount] = await sql`SELECT count(*) FROM pedidos;`;
  const [cCount] = await sql`SELECT count(*) FROM clientes;`;
  const [iCount] = await sql`SELECT count(*) FROM pedido_items;`;
  const [sCount] = await sql`SELECT count(*) FROM solicitudes_concierge;`;
  const [prodCount] = await sql`SELECT count(*) FROM productos;`;
  const [destCount] = await sql`SELECT count(*) FROM destinos_tsi;`;

  console.log(`- Pedidos restantes: ${pCount.count} (Esperado: 0)`);
  console.log(`- Clientes restantes: ${cCount.count} (Esperado: 0)`);
  console.log(`- Ítems de pedido restantes: ${iCount.count} (Esperado: 0)`);
  console.log(`- Solicitudes concierge restantes: ${sCount.count} (Esperado: 0)`);
  console.log(`- Productos en catálogo: ${prodCount.count} (Preservado)`);
  console.log(`- Destinos TSI habilitados: ${destCount.count} (Preservado)`);

  console.log("\n===============================================================================");
  console.log("BASE DE DATOS 100% LIMPIA Y LISTA PARA CLIENTES REALES");
  console.log("===============================================================================");
}

cleanTestData().catch((err) => {
  console.error("Error limpiando datos de prueba:", err);
  process.exit(1);
});
