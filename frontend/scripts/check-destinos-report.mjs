import { Pool } from "@neondatabase/serverless";
import fs from "fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(".env.local")) {
  const env = fs.readFileSync(".env.local", "utf8");
  const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) dbUrl = match[1];
}

const pool = new Pool({ connectionString: dbUrl });

async function checkDestinos() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT departamento, ciudad, modalidad, cobertura_habilitada, flete_regular_pyg, flete_pesado_pyg, agencia_nombre, tiempo_estimado, fuente_informacion, fecha_actualizacion
      FROM destinos_tsi
      ORDER BY departamento, ciudad;
    `);

    console.log(`Total destinos en BD: ${res.rows.length}`);
    const habilitados = res.rows.filter(r => r.cobertura_habilitada && r.flete_regular_pyg !== null);
    const pendientesTarifa = res.rows.filter(r => r.cobertura_habilitada && r.flete_regular_pyg === null);
    const deshabilitados = res.rows.filter(r => !r.cobertura_habilitada);

    console.log(`\n--- HABILITADOS CON TARIFA CONFIRMADA (${habilitados.length}) ---`);
    habilitados.forEach(r => {
      console.log(`[${r.departamento}] ${r.ciudad} | Mod: ${r.modalidad} | Regular: ₲${r.flete_regular_pyg.toLocaleString()} | Pesado: ₲${r.flete_pesado_pyg.toLocaleString()} | Tiempo: ${r.tiempo_estimado} | Agencia: ${r.agencia_nombre || 'N/A'} | Fuente: ${r.fuente_informacion} (${r.fecha_actualizacion?.toISOString()?.slice(0,10)})`);
    });

    console.log(`\n--- PENDIENTES DE COTIZACIÓN (${pendientesTarifa.length}) ---`);
    pendientesTarifa.forEach(r => {
      console.log(`[${r.departamento}] ${r.ciudad} | Mod: ${r.modalidad} | Tarifa: PENDIENTE | Fuente: ${r.fuente_informacion} (${r.fecha_actualizacion?.toISOString()?.slice(0,10)})`);
    });

    console.log(`\n--- DESHABILITADOS / FUERA DE COBERTURA DIRECTA (${deshabilitados.length}) ---`);
    deshabilitados.forEach(r => {
      console.log(`[${r.departamento}] ${r.ciudad} | Cobertura: NO HABILITADA | Fuente: ${r.fuente_informacion} (${r.fecha_actualizacion?.toISOString()?.slice(0,10)})`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

checkDestinos();
