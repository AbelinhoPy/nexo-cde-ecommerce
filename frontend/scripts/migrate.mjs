import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_k6oFQOqf7zlv@ep-rapid-pine-bdx0b21n-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Migration ---');

    // 1. Add enum values if needed
    try {
      await client.query("ALTER TYPE estado_pedido_enum ADD VALUE IF NOT EXISTS 'PREPARANDO_ENVIO';");
      console.log('✓ Added PREPARANDO_ENVIO to enum');
    } catch (e) {
      console.log('Enum PREPARANDO_ENVIO notice:', e.message);
    }

    try {
      await client.query("ALTER TYPE estado_pedido_enum ADD VALUE IF NOT EXISTS 'ENVIADO';");
      console.log('✓ Added ENVIADO to enum');
    } catch (e) {
      console.log('Enum ENVIADO notice:', e.message);
    }

    // 2. Add columns to pedidos
    await client.query(`
      ALTER TABLE pedidos 
      ADD COLUMN IF NOT EXISTS destino_departamento VARCHAR(100),
      ADD COLUMN IF NOT EXISTS destino_ciudad VARCHAR(100),
      ADD COLUMN IF NOT EXISTS modalidad_entrega VARCHAR(50) DEFAULT 'DOMICILIO',
      ADD COLUMN IF NOT EXISTS agencia_tsi VARCHAR(150),
      ADD COLUMN IF NOT EXISTS notificacion_admin_enviada BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS notificacion_admin_error TEXT,
      ADD COLUMN IF NOT EXISTS notificacion_admin_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS notificacion_despacho_enviada BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS fecha_confirmacion_entrega TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✓ Columns added to pedidos table');

    // 3. Create destinos_tsi table
    await client.query(`
      CREATE TABLE IF NOT EXISTS destinos_tsi (
        id SERIAL PRIMARY KEY,
        departamento VARCHAR(100) NOT NULL,
        ciudad VARCHAR(100) NOT NULL,
        agencia_nombre VARCHAR(150),
        modalidad VARCHAR(50) NOT NULL DEFAULT 'DOMICILIO_Y_AGENCIA',
        flete_regular_pyg INT,
        flete_pesado_pyg INT,
        cobertura_habilitada BOOLEAN NOT NULL DEFAULT TRUE,
        tiempo_estimado VARCHAR(50) DEFAULT '24 a 48 hs',
        observaciones TEXT,
        fuente_informacion VARCHAR(150) DEFAULT 'Tarifario Oficial TSI Paraguay - Noviembre 2026',
        fecha_actualizacion DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_destino_depto_ciudad UNIQUE (departamento, ciudad)
      );
    `);
    console.log('✓ destinos_tsi table created or verified');

    // 4. Seed destinos_tsi with confirmed data
    const destinos = [
      // Asunción
      { dep: 'Asunción (Distrito Capital)', ciudad: 'Asunción', agencia: 'Agencia Central TSI Asunción (Av. Fdo. de la Mora)', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      
      // Central
      { dep: 'Central', ciudad: 'San Lorenzo', agencia: 'Agencia TSI San Lorenzo (Ruta 2)', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Luque', agencia: 'Agencia TSI Luque', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Fernando de la Mora', agencia: 'Agencia Central TSI', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Lambaré', agencia: 'Agencia TSI Lambaré', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Capiatá', agencia: 'Agencia TSI Capiatá', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Mariano Roque Alonso', agencia: 'Agencia TSI MRA', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Ñemby', agencia: 'Agencia TSI Ñemby', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Itauguá', agencia: 'Agencia TSI Itauguá', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 a 48 hs' },
      { dep: 'Central', ciudad: 'Villa Elisa', agencia: 'Agencia TSI Villa Elisa', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Central', ciudad: 'Limpio', agencia: 'Agencia TSI Limpio', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 a 48 hs' },

      // Itapúa
      { dep: 'Itapúa', ciudad: 'Encarnación', agencia: 'Agencia TSI Encarnación (Zona Terminal)', mod: 'DOMICILIO_Y_AGENCIA', reg: 40000, pes: 60000, cob: true, t: '24 a 48 hs' },
      { dep: 'Itapúa', ciudad: 'Coronel Bogado', agencia: 'Agencia TSI Cnel. Bogado', mod: 'AGENCIA', reg: 40000, pes: 60000, cob: true, t: '48 hs' },
      { dep: 'Itapúa', ciudad: 'Hohenau', agencia: 'Agencia TSI Colonias Unidas', mod: 'DOMICILIO_Y_AGENCIA', reg: 40000, pes: 60000, cob: true, t: '24 a 48 hs' },

      // Caaguazú
      { dep: 'Caaguazú', ciudad: 'Coronel Oviedo', agencia: 'Agencia TSI Cnel. Oviedo (Cruce Internacional)', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Caaguazú', ciudad: 'Caaguazú', agencia: 'Agencia TSI Ciudad de Caaguazú', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },

      // Guairá
      { dep: 'Guairá', ciudad: 'Villarrica', agencia: 'Agencia TSI Villarrica', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },

      // Cordillera
      { dep: 'Cordillera', ciudad: 'Caacupé', agencia: 'Agencia TSI Caacupé', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },
      { dep: 'Cordillera', ciudad: 'Eusebio Ayala', agencia: 'Agencia TSI Eusebio Ayala', mod: 'AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 hs' },

      // Paraguarí
      { dep: 'Paraguarí', ciudad: 'Paraguarí', agencia: 'Agencia TSI Paraguarí', mod: 'DOMICILIO_Y_AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 a 48 hs' },
      { dep: 'Paraguarí', ciudad: 'Carapeguá', agencia: 'Agencia TSI Carapeguá', mod: 'AGENCIA', reg: 35000, pes: 50000, cob: true, t: '24 a 48 hs' },

      // Concepción
      { dep: 'Concepción', ciudad: 'Concepción', agencia: 'Agencia TSI Concepción', mod: 'AGENCIA', reg: 45000, pes: 70000, cob: true, t: '48 hs' },

      // San Pedro
      { dep: 'San Pedro', ciudad: 'Santa Rosa del Aguaray', agencia: 'Agencia TSI Santa Rosa', mod: 'AGENCIA', reg: 45000, pes: 65000, cob: true, t: '48 hs' },
      { dep: 'San Pedro', ciudad: 'San Pedro del Ycuamandyyú', agencia: 'Agencia TSI San Pedro', mod: 'AGENCIA', reg: 45000, pes: 65000, cob: true, t: '48 hs' },

      // Amambay
      { dep: 'Amambay', ciudad: 'Pedro Juan Caballero', agencia: 'Agencia TSI PJC', mod: 'DOMICILIO_Y_AGENCIA', reg: 45000, pes: 65000, cob: true, t: '48 hs' },

      // Canindeyú
      { dep: 'Canindeyú', ciudad: 'Curuguaty', agencia: 'Agencia TSI Curuguaty', mod: 'AGENCIA', reg: 40000, pes: 60000, cob: true, t: '24 a 48 hs' },
      { dep: 'Canindeyú', ciudad: 'Salto del Guairá', agencia: 'Agencia TSI Salto del Guairá', mod: 'AGENCIA', reg: 40000, pes: 60000, cob: true, t: '24 a 48 hs' },

      // Misiones
      { dep: 'Misiones', ciudad: 'San Juan Bautista', agencia: 'Agencia TSI San Juan Bautista', mod: 'AGENCIA', reg: 40000, pes: 60000, cob: true, t: '48 hs' },
      { dep: 'Misiones', ciudad: 'San Ignacio', agencia: 'Agencia TSI San Ignacio', mod: 'AGENCIA', reg: 40000, pes: 60000, cob: true, t: '48 hs' },

      // Ñeembucú
      { dep: 'Ñeembucú', ciudad: 'Pilar', agencia: 'Agencia TSI Pilar', mod: 'AGENCIA', reg: 50000, pes: 75000, cob: true, t: '48 a 72 hs' },

      // Caazapá
      { dep: 'Caazapá', ciudad: 'Caazapá', agencia: 'Agencia TSI Caazapá', mod: 'AGENCIA', reg: 40000, pes: 60000, cob: true, t: '48 hs' },

      // Presidente Hayes (Chaco - Cobertura confirmada y habilitada en Villa Hayes y Benjamín Aceval)
      { dep: 'Presidente Hayes', ciudad: 'Villa Hayes', agencia: 'Agencia TSI Villa Hayes (Acceso Chaco)', mod: 'DOMICILIO_Y_AGENCIA', reg: 45000, pes: 65000, cob: true, t: '24 a 48 hs' },
      { dep: 'Presidente Hayes', ciudad: 'Benjamín Aceval', agencia: 'Agencia TSI Benjamín Aceval', mod: 'AGENCIA', reg: 45000, pes: 65000, cob: true, t: '48 hs' },

      // Caso de prueba requerido: Chaco - Destino habilitado pero SIN TARIFA (pendiente de cotización)
      { dep: 'Presidente Hayes', ciudad: 'Pozo Colorado', agencia: 'Punto de Encomienda Pozo Colorado', mod: 'AGENCIA', reg: null, pes: null, cob: true, t: 'Cotización requerida', observaciones: 'Ruta Transchaco km 270. Pendiente tarifario TSI.' },

      // Casos de prueba requeridos: Destinos FUERA DE COBERTURA (cobertura_habilitada = false)
      { dep: 'Boquerón', ciudad: 'Filadelfia', agencia: 'Sin agencia directa TSI CDE', mod: 'AGENCIA', reg: null, pes: null, cob: false, t: 'Sin servicio directo', observaciones: 'Fuera de cobertura directa TSI desde CDE.' },
      { dep: 'Boquerón', ciudad: 'Loma Plata', agencia: 'Sin agencia directa TSI CDE', mod: 'AGENCIA', reg: null, pes: null, cob: false, t: 'Sin servicio directo', observaciones: 'Fuera de cobertura directa TSI desde CDE.' },
      { dep: 'Alto Paraguay', ciudad: 'Fuerte Olimpo', agencia: 'Sin servicio terrestre TSI', mod: 'AGENCIA', reg: null, pes: null, cob: false, t: 'Sin cobertura', observaciones: 'Zona fluvial/remota Chaco Norte sin cobertura.' },
      { dep: 'Alto Paraguay', ciudad: 'Bahía Negra', agencia: 'Sin servicio terrestre TSI', mod: 'AGENCIA', reg: null, pes: null, cob: false, t: 'Sin cobertura', observaciones: 'Zona fluvial/remota Chaco Norte sin cobertura.' }
    ];

    for (const d of destinos) {
      await client.query(`
        INSERT INTO destinos_tsi (
          departamento, ciudad, agencia_nombre, modalidad, flete_regular_pyg, flete_pesado_pyg,
          cobertura_habilitada, tiempo_estimado, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (departamento, ciudad) DO UPDATE SET
          agencia_nombre = EXCLUDED.agencia_nombre,
          modalidad = EXCLUDED.modalidad,
          flete_regular_pyg = EXCLUDED.flete_regular_pyg,
          flete_pesado_pyg = EXCLUDED.flete_pesado_pyg,
          cobertura_habilitada = EXCLUDED.cobertura_habilitada,
          tiempo_estimado = EXCLUDED.tiempo_estimado,
          observaciones = EXCLUDED.observaciones,
          fecha_actualizacion = CURRENT_DATE;
      `, [d.dep, d.ciudad, d.agencia, d.mod, d.reg, d.pes, d.cob, d.t, d.observaciones || null]);
    }

    console.log(`✓ Seeded ${destinos.length} destinos TSI successfully`);

    const countRes = await client.query('SELECT count(*) FROM destinos_tsi;');
    console.log(`Total destinos in table: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
