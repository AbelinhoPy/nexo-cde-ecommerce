import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const pool = new Pool({ connectionString: match[1] });

// Read catalogData
const catContent = fs.readFileSync('src/lib/catalogData.ts', 'utf8');

// Parse products
const lines = catContent.split(/\r?\n/);
const products = [];
let cur = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('id: "')) {
    const id = line.match(/id:\s*"([^"]+)"/)[1];
    cur = { id };
  } else if (cur) {
    if (line.startsWith('nombre: "')) {
      cur.nombre = line.match(/nombre:\s*"([^"]+)"/)[1];
    } else if (line.startsWith('categoria: "')) {
      cur.categoria = line.match(/categoria:\s*"([^"]+)"/)[1];
    } else if (line.startsWith('precioUsd:')) {
      const m = line.match(/precioUsd:\s*([0-9.]+)/);
      if (m) cur.precioUsd = parseFloat(m[1]);
    } else if (line.startsWith('precioPyg:')) {
      const m = line.match(/precioPyg:\s*([0-9]+)/);
      if (m) cur.precioPyg = parseInt(m[1]);
    } else if (line.startsWith('tipoFlete: "')) {
      cur.tipoFlete = line.match(/tipoFlete:\s*"([^"]+)"/)[1];
    } else if (line.startsWith('stock:')) {
      const m = line.match(/stock:\s*([0-9]+)/);
      if (m) cur.stock = parseInt(m[1]);
    } else if (line.startsWith('img: "')) {
      cur.img = line.match(/img:\s*"([^"]+)"/)[1];
    } else if (line === '},') {
      if (cur.id && cur.nombre) {
        if (!cur.precioPyg && cur.precioUsd) {
          cur.precioPyg = Math.ceil((cur.precioUsd * 7640) / 1000) * 1000;
        }
        products.push(cur);
      }
      cur = null;
    }
  }
}

console.log('Parsed products from catalogData:', products.length);

function mapCategoria(cat) {
  const c = (cat || '').toUpperCase();
  if (c.includes('SMARTPHONE')) return 'SMARTPHONES';
  if (c.includes('GAME') || c.includes('CONSOLA')) return 'CONSOLAS_GAMING';
  if (c.includes('INFORMÁTICA') || c.includes('INFORMATICA') || c.includes('PC')) return 'INFORMATICA';
  if (c.includes('ELECTRÓNICO') || c.includes('ELECTRONICO') || c.includes('TV')) return 'ELECTRONICOS';
  if (c.includes('DRONE') || c.includes('CÁMARA') || c.includes('CAMARA')) return 'DRONES';
  if (c.includes('AUDIO') || c.includes('PARLANTE')) return 'AUDIO';
  if (c.includes('TABLET')) return 'TABLETS';
  if (c.includes('WEARABLE') || c.includes('SMARTWATCH')) return 'WEARABLES';
  if (c.includes('BELLEZA') || c.includes('PERFUME')) return 'BELLEZA_CUIDADO';
  return 'OTROS';
}

async function run() {
  const client = await pool.connect();
  try {
    for (const p of products) {
      const catEnum = mapCategoria(p.categoria);
      const fleteEnum = p.tipoFlete === 'PESADO' ? 'PESADO' : 'REGULAR';
      const usd = p.precioUsd || 100;
      const costoUsd = Number((usd * 0.95).toFixed(2));
      const costoPyg = Math.round(costoUsd * 7640);
      const precioPyg = p.precioPyg || Math.round(usd * 7640);
      const stock = p.stock || 10;
      const img = p.img || '';

      await client.query(`
        INSERT INTO productos (
          sku, nombre, categoria, tipo_flete,
          precio_lista_usd, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg,
          margen_aplicado_pct, precio_venta_pyg, stock_disponible, imagen_url, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, 7640, $7, 10.0, $8, $9, $10, TRUE)
        ON CONFLICT (sku) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          categoria = EXCLUDED.categoria,
          tipo_flete = EXCLUDED.tipo_flete,
          precio_lista_usd = EXCLUDED.precio_lista_usd,
          costo_neto_usd = EXCLUDED.costo_neto_usd,
          costo_neto_pyg = EXCLUDED.costo_neto_pyg,
          precio_venta_pyg = EXCLUDED.precio_venta_pyg,
          stock_disponible = EXCLUDED.stock_disponible,
          imagen_url = EXCLUDED.imagen_url,
          activo = TRUE;
      `, [p.id, p.nombre, catEnum, fleteEnum, usd, costoUsd, costoPyg, precioPyg, stock, img]);
    }
    console.log('✓ Successfully synced all products to Neon DB!');
    const countRes = await client.query('SELECT count(*) FROM productos;');
    console.log('Total products in DB now:', countRes.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
