import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const sql = neon(DATABASE_URL);
  
  // Leer schema.sql
  const schemaPath = path.resolve('../schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Separar sentencias respetando bloques DO $$ ... $$;
  // Una forma limpia y segura es usar regex para separar por ; fuera de bloques $$
  const statements = [];
  let current = '';
  let inDollarBlock = false;

  for (const line of schemaSql.split('\n')) {
    if (line.includes('$$')) {
      inDollarBlock = !inDollarBlock;
    }
    current += line + '\n';
    if (!inDollarBlock && line.trim().endsWith(';')) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
    }
  }

  console.log(`Ejecutando ${statements.length} sentencias DDL en Neon...`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.unsafe(stmt);
    } catch (err) {
      console.warn(`Sentencia ${i + 1} (${stmt.slice(0, 40).replace(/\n/g, ' ')}...):`, err.message);
    }
  }

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log("✓ Tablas existentes en Neon:", tables.map(t => t.table_name));

  const views = await sql`
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public';
  `;
  console.log("✓ Vistas existentes en Neon:", views.map(v => v.table_name));
}

run();
