import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  
  try {
    const schemaPath = path.resolve('../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log("Ejecutando schema.sql completo con client.query...");
    await client.query(schemaSql);
    console.log("✓ Éxito al ejecutar con Pool client.query!");

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Tablas creadas:", tables.rows.map(r => r.table_name));

    const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `);
    console.log("Vistas creadas:", views.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error en client.query:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
