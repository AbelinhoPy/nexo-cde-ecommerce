import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function runMigration() {
  console.log("Iniciando migración en Neon DB...");
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN;");

    // 1. Agregar columna para la foto física del documento TSI
    console.log("1. Agregando columna 'foto_guia_tsi' en 'pedidos'...");
    await client.query(`
      ALTER TABLE pedidos 
      ADD COLUMN IF NOT EXISTS foto_guia_tsi TEXT;
    `);

    // 2. Crear tabla de solicitudes especiales concierge
    console.log("2. Creando tabla 'solicitudes_concierge'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_concierge (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(50) NOT NULL,
        email VARCHAR(180),
        producto_solicitado VARCHAR(255) NOT NULL,
        link_referencia TEXT,
        presupuesto_estimado VARCHAR(100),
        ciudad_destino VARCHAR(100),
        estado VARCHAR(50) DEFAULT 'PENDIENTE',
        notas TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query("COMMIT;");
    console.log("✓ Migración completada con éxito en Neon DB.");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Error en migración:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().then(() => {
  process.exit(0);
});
