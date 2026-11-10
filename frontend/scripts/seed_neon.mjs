import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

const PIZARRA_CDE_VENTA = 7550;
const COLCHON_SEGURIDAD = 90;
const COTIZACION_EFECTIVA = PIZARRA_CDE_VENTA + COLCHON_SEGURIDAD; // ₲7.640
const DESCUENTO_PARTNER_PCT = 5.0; // 5% mayorista

function redondearMil(monto) {
  return Math.ceil(monto / 1000.0) * 1000;
}

const PRODUCTOS_SEED = [
  // SMARTPHONES (20 ítems)
  { sku: "XIA-R13C-128", nombre: "Xiaomi Redmi 13C 128GB / 6GB RAM Dual SIM", cat: "SMARTPHONES", flete: "REGULAR", usd: 105.00, margen: 11.0, stock: 25 },
  { sku: "XIA-R13C-256", nombre: "Xiaomi Redmi 13C 256GB / 8GB RAM Dual SIM", cat: "SMARTPHONES", flete: "REGULAR", usd: 122.00, margen: 11.0, stock: 30 },
  { sku: "XIA-R13-128", nombre: "Xiaomi Redmi 13 4G 128GB / 6GB RAM Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 130.00, margen: 11.0, stock: 18 },
  { sku: "XIA-R13-256", nombre: "Xiaomi Redmi 13 4G 256GB / 8GB RAM Blue", cat: "SMARTPHONES", flete: "REGULAR", usd: 145.00, margen: 11.0, stock: 22 },
  { sku: "XIA-RN13-128", nombre: "Xiaomi Redmi Note 13 4G 128GB / 6GB RAM Mint Green", cat: "SMARTPHONES", flete: "REGULAR", usd: 150.00, margen: 11.0, stock: 40 },
  { sku: "XIA-RN13-256", nombre: "Xiaomi Redmi Note 13 4G 256GB / 8GB RAM Midnight Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 168.00, margen: 11.0, stock: 35 },
  { sku: "XIA-RN13-5G-256", nombre: "Xiaomi Redmi Note 13 5G 256GB / 8GB RAM Ocean Teal", cat: "SMARTPHONES", flete: "REGULAR", usd: 202.00, margen: 11.0, stock: 20 },
  { sku: "XIA-RN13P-256", nombre: "Xiaomi Redmi Note 13 Pro 4G 256GB / 8GB RAM Midnight Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 218.00, margen: 11.0, stock: 28 },
  { sku: "XIA-RN13P-5G-256", nombre: "Xiaomi Redmi Note 13 Pro 5G 256GB / 8GB RAM Arctic White", cat: "SMARTPHONES", flete: "REGULAR", usd: 265.00, margen: 11.0, stock: 25 },
  { sku: "XIA-RN13PP-256", nombre: "Xiaomi Redmi Note 13 Pro+ 5G 256GB / 8GB RAM Midnight Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 335.00, margen: 11.0, stock: 15 },
  { sku: "XIA-RN13PP-512", nombre: "Xiaomi Redmi Note 13 Pro+ 5G 512GB / 12GB RAM Aurora Purple", cat: "SMARTPHONES", flete: "REGULAR", usd: 380.00, margen: 11.0, stock: 14 },
  { sku: "POC-M6-128", nombre: "Poco M6 Pro 4G 128GB / 6GB RAM Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 165.00, margen: 11.0, stock: 16 },
  { sku: "POC-M6-256", nombre: "Poco M6 Pro 4G 256GB / 8GB RAM Blue", cat: "SMARTPHONES", flete: "REGULAR", usd: 185.00, margen: 11.0, stock: 20 },
  { sku: "POC-M6-512", nombre: "Poco M6 Pro 4G 512GB / 12GB RAM Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 215.00, margen: 11.0, stock: 12 },
  { sku: "POC-X6-256", nombre: "Poco X6 5G 256GB / 8GB RAM White", cat: "SMARTPHONES", flete: "REGULAR", usd: 230.00, margen: 11.0, stock: 18 },
  { sku: "POC-X6-512", nombre: "Poco X6 5G 512GB / 12GB RAM Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 260.00, margen: 11.0, stock: 15 },
  { sku: "POC-X6P-256", nombre: "Poco X6 Pro 5G 256GB / 8GB RAM Yellow", cat: "SMARTPHONES", flete: "REGULAR", usd: 290.00, margen: 11.0, stock: 24 },
  { sku: "POC-X6P-512", nombre: "Poco X6 Pro 5G 512GB / 12GB RAM Grey", cat: "SMARTPHONES", flete: "REGULAR", usd: 328.00, margen: 11.0, stock: 22 },
  { sku: "POC-F6-256", nombre: "Poco F6 5G 256GB / 8GB RAM Black", cat: "SMARTPHONES", flete: "REGULAR", usd: 365.00, margen: 11.0, stock: 10 },
  { sku: "POC-F6P-512", nombre: "Poco F6 Pro 5G 512GB / 12GB RAM White", cat: "SMARTPHONES", flete: "REGULAR", usd: 485.00, margen: 11.0, stock: 8 },

  // CONSOLAS GAMING (10 ítems)
  { sku: "CON-PS5-SLIM-DIG", nombre: "Sony PlayStation 5 Slim Digital Edition 1TB (JP/USA)", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 465.00, margen: 10.0, stock: 12 },
  { sku: "CON-PS5-SLIM-DSK", nombre: "Sony PlayStation 5 Slim Standard Con Lectora Blu-Ray 1TB", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 515.00, margen: 10.0, stock: 15 },
  { sku: "CON-PS5-PRO-2TB", nombre: "Sony PlayStation 5 Pro 2TB Digital Console", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 850.00, margen: 10.0, stock: 6 },
  { sku: "CON-NSW-OLED-WHT", nombre: "Nintendo Switch OLED 64GB White Edition", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 285.00, margen: 10.0, stock: 20 },
  { sku: "CON-NSW-OLED-NEO", nombre: "Nintendo Switch OLED 64GB Neon Blue / Red", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 285.00, margen: 10.0, stock: 18 },
  { sku: "CON-NSW-OLED-MAR", nombre: "Nintendo Switch OLED Mario Red Special Edition", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 305.00, margen: 10.0, stock: 8 },
  { sku: "CON-NSW-LITE-TRQ", nombre: "Nintendo Switch Lite Turquoise 32GB", cat: "CONSOLAS_GAMING", flete: "REGULAR", usd: 170.00, margen: 10.0, stock: 14 },
  { sku: "CON-NSW-LITE-COR", nombre: "Nintendo Switch Lite Coral 32GB", cat: "CONSOLAS_GAMING", flete: "REGULAR", usd: 170.00, margen: 10.0, stock: 10 },
  { sku: "CON-XBS-X-1TB", nombre: "Microsoft Xbox Series X 1TB Black Console", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 530.00, margen: 10.0, stock: 7 },
  { sku: "CON-XBS-S-512", nombre: "Microsoft Xbox Series S 512GB Robot White", cat: "CONSOLAS_GAMING", flete: "PESADO", usd: 295.00, margen: 10.0, stock: 11 },

  // SMART TVS (10 ítems)
  { sku: "TV-XIA-A32", nombre: "Smart TV Xiaomi Mi TV A 32\" HD Google TV Bluetooth", cat: "SMART_TVS", flete: "PESADO", usd: 142.00, margen: 12.0, stock: 16 },
  { sku: "TV-XIA-A43", nombre: "Smart TV Xiaomi Mi TV A 43\" Full HD Google TV", cat: "SMART_TVS", flete: "PESADO", usd: 210.00, margen: 12.0, stock: 12 },
  { sku: "TV-XIA-A43-4K", nombre: "Smart TV Xiaomi Mi TV A Pro 43\" 4K UHD Dolby Audio", cat: "SMART_TVS", flete: "PESADO", usd: 248.00, margen: 12.0, stock: 10 },
  { sku: "TV-LG-32-LR60", nombre: "Smart TV LG 32\" 32LR6000 HD HDR webOS 23", cat: "SMART_TVS", flete: "PESADO", usd: 158.00, margen: 12.0, stock: 14 },
  { sku: "TV-LG-43-UT73", nombre: "Smart TV LG 43\" 43UT7300 4K UHD ThinQ AI", cat: "SMART_TVS", flete: "PESADO", usd: 285.00, margen: 12.0, stock: 9 },
  { sku: "TV-SAM-32-T4300", nombre: "Smart TV Samsung 32\" UN32T4300 HD Tizen OS", cat: "SMART_TVS", flete: "PESADO", usd: 162.00, margen: 12.0, stock: 15 },
  { sku: "TV-SAM-43-CU7000", nombre: "Smart TV Samsung 43\" UN43CU7000 4K Crystal UHD", cat: "SMART_TVS", flete: "PESADO", usd: 290.00, margen: 12.0, stock: 11 },
  { sku: "TV-TCL-32-S5400", nombre: "Smart TV TCL 32\" 32S5400 Full HD Android TV", cat: "SMART_TVS", flete: "PESADO", usd: 138.00, margen: 12.0, stock: 18 },
  { sku: "TV-TCL-43-P635", nombre: "Smart TV TCL 43\" 43P635 4K UHD Google TV HDR10", cat: "SMART_TVS", flete: "PESADO", usd: 235.00, margen: 12.0, stock: 13 },
  { sku: "TV-TCL-43-C645", nombre: "Smart TV TCL 43\" 43C645 QLED 4K Google TV Dolby Vision", cat: "SMART_TVS", flete: "PESADO", usd: 275.00, margen: 12.0, stock: 8 },

  // PERIFÉRICOS TOP (10 ítems)
  { sku: "PER-PS5-DS-WHT", nombre: "Mando Sony DualSense Wireless Controller PS5 White", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 63.00, margen: 12.0, stock: 25 },
  { sku: "PER-PS5-DS-BLK", nombre: "Mando Sony DualSense Wireless Controller Midnight Black", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 63.00, margen: 12.0, stock: 20 },
  { sku: "PER-PS5-DS-RED", nombre: "Mando Sony DualSense Cosmic Red", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 65.00, margen: 12.0, stock: 12 },
  { sku: "PER-XIA-BUDS5-PRO", nombre: "Auriculares Xiaomi Redmi Buds 5 Pro ANC 52dB Hi-Res", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 55.00, margen: 12.0, stock: 30 },
  { sku: "PER-XIA-BUDS5", nombre: "Auriculares Xiaomi Redmi Buds 5 Bluetooth 5.3 Black", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 32.00, margen: 12.0, stock: 45 },
  { sku: "PER-NSW-PRO-CTRL", nombre: "Nintendo Switch Pro Controller Original", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 62.00, margen: 12.0, stock: 15 },
  { sku: "PER-LOG-G502-HERO", nombre: "Mouse Gamer Logitech G502 HERO 25.600 DPI RGB", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 42.00, margen: 12.0, stock: 22 },
  { sku: "PER-LOG-GPRO-X", nombre: "Headset Gamer Logitech G PRO X Lightspeed Wireless", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 155.00, margen: 12.0, stock: 10 },
  { sku: "PER-JBL-FLIP6", nombre: "Parlante Portátil JBL Flip 6 Bluetooth Waterproof Black", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 88.00, margen: 12.0, stock: 18 },
  { sku: "PER-JBL-CHARGE5", nombre: "Parlante Portátil JBL Charge 5 Powerbank Squad", cat: "PERIFERICOS_TOP", flete: "REGULAR", usd: 135.00, margen: 12.0, stock: 12 }
];

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("1. Insertando configuración de cotización en Neon...");
    await client.query(`
      INSERT INTO configuraciones_cambio 
      (pizarra_cde_venta, colchon_seguridad_pyg, descuento_partner_pct, activo)
      VALUES ($1, $2, $3, TRUE);
    `, [PIZARRA_CDE_VENTA, COLCHON_SEGURIDAD, DESCUENTO_PARTNER_PCT]);

    console.log("2. Insertando catálogo de 50 productos en Neon...");
    for (const item of PRODUCTOS_SEED) {
      const costo_neto_usd = Number((item.usd * (1 - (DESCUENTO_PARTNER_PCT / 100.0))).toFixed(2));
      const costo_neto_pyg = Math.round(costo_neto_usd * COTIZACION_EFECTIVA);
      const precio_bruto_pyg = costo_neto_pyg * (1 + (item.margen / 100.0));
      const precio_venta_pyg = redondearMil(precio_bruto_pyg);

      await client.query(`
        INSERT INTO productos (
          sku, nombre, categoria, tipo_flete,
          precio_lista_usd, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg,
          margen_aplicado_pct, precio_venta_pyg, stock_disponible, imagen_url, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
        ON CONFLICT (sku) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          precio_lista_usd = EXCLUDED.precio_lista_usd,
          costo_neto_usd = EXCLUDED.costo_neto_usd,
          costo_neto_pyg = EXCLUDED.costo_neto_pyg,
          precio_venta_pyg = EXCLUDED.precio_venta_pyg,
          stock_disponible = EXCLUDED.stock_disponible,
          ultima_sincronizacion = NOW();
      `, [
        item.sku,
        item.nombre,
        item.cat,
        item.flete,
        item.usd,
        costo_neto_usd,
        COTIZACION_EFECTIVA,
        costo_neto_pyg,
        item.margen,
        precio_venta_pyg,
        item.stock,
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"
      ]);
    }

    const countRes = await client.query('SELECT COUNT(*) AS total FROM productos;');
    console.log(`✓ Total productos en Neon: ${countRes.rows[0].total}`);
  } catch (err) {
    console.error("Error en seed Neon:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
