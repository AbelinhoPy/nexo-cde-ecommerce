import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function deploySchema() {
  console.log("Conectando a Neon PostgreSQL...");
  const sql = neon(DATABASE_URL);

  try {
    // 1. Probar conexión básica
    const result = await sql`SELECT NOW() AS now, current_database() AS db;`;
    console.log("✓ Conectado exitosamente a Neon:", result[0]);

    // 2. Leer schema.sql
    const schemaPath = path.resolve('../schema.sql');
    console.log(`Leyendo esquema desde: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Dividir en sentencias seguras ejecutando el bloque DDL
    console.log("Aplicando schema.sql a Neon...");
    await sql.unsafe(schemaSql);
    console.log("✓ Esquema DDL aplicado con éxito en Neon.");

    // 3. Verificar tablas creadas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("Tablas creadas en Neon:", tables.map(t => t.table_name));

  } catch (error) {
    console.error("Error aplicando esquema a Neon:", error);
    process.exit(1);
  }
}

deploySchema();
