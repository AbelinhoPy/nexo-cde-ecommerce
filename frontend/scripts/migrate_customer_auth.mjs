import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
  console.log("Aplicando migración de autenticación y cupones a Neon DB...");
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Columnas de autenticación en clientes
    console.log("1. Agregando columnas de autenticación en 'clientes'...");
    await client.query(`
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email VARCHAR(180);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email) WHERE email IS NOT NULL;
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64);
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE;
    `);

    // 2. Columnas de cupones en pedidos
    console.log("2. Agregando columnas de cupones en 'pedidos'...");
    await client.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupon_codigo VARCHAR(30);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS descuento_cupon_pyg BIGINT DEFAULT 0;
    `);

    // 3. Tabla de cupones válidos
    console.log("3. Creando tabla 'cupones'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS cupones (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(30) UNIQUE NOT NULL,
        descripcion VARCHAR(150) NOT NULL,
        tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('FIJO_PYG', 'PORCENTAJE')),
        valor_descuento NUMERIC(10, 2) NOT NULL,
        flete_gratis BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE,
        usos_maximos INT DEFAULT 1000,
        usos_actuales INT DEFAULT 0,
        valido_hasta TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      INSERT INTO cupones (codigo, descripcion, tipo_descuento, valor_descuento, flete_gratis, activo)
      VALUES 
        ('BIENVENIDA', 'Bono de bienvenida: ₲50.000 de descuento en flete TSI', 'FIJO_PYG', 50000, FALSE, TRUE),
        ('CDE5', '5% de descuento especial mayorista Ciudad del Este', 'PORCENTAJE', 5.00, FALSE, TRUE),
        ('NEXO10', '10% de descuento en tu compra', 'PORCENTAJE', 10.00, FALSE, TRUE)
      ON CONFLICT (codigo) DO NOTHING;
    `);

    await client.query("COMMIT;");
    console.log("✓ Migración completada exitosamente en Neon PostgreSQL!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Error durante la migración:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
