import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const pool = new Pool({ connectionString: match[1] });

// Add new enum values to categoria_producto_enum
async function run() {
  const client = await pool.connect();
  try {
    const enumValues = [
      'INFORMATICA', 'ELECTRONICOS', 'DRONES', 'AUDIO', 'TABLETS', 'WEARABLES', 'BELLEZA_CUIDADO', 'OTROS'
    ];
    for (const val of enumValues) {
      try {
        await client.query(`ALTER TYPE categoria_producto_enum ADD VALUE IF NOT EXISTS '${val}';`);
        console.log(`Added enum value: ${val}`);
      } catch (e) {
        console.log(`Enum value ${val} already exists or error:`, e.message);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
