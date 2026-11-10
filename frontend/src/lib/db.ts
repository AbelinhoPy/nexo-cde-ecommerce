import 'server-only';
import { Pool, neon } from '@neondatabase/serverless';

let poolInstance: Pool | null = null;

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))
  );
}

export function getPool(): Pool {
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL de Neon no configurada en las variables de entorno.');
  }
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return poolInstance;
}

/**
 * Ejecuta una consulta SQL parametrizada de forma segura contra Neon PostgreSQL.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!isDbConfigured()) {
    console.warn('[Neon DB] DATABASE_URL no configurada. Operando en modo local.');
    return [];
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Consulta las métricas financieras en tiempo real desde la vista Neon
 */
export async function obtenerMetricasFinancierasNeon() {
  if (!isDbConfigured()) return null;

  try {
    const rows = await query(`
      SELECT 
        fecha,
        pedidos_totales_pagados,
        total_recaudado_pyg,
        costo_mercaderia_total_usd,
        costo_mercaderia_total_pyg,
        margen_bruto_pyg,
        costo_estimado_tsi_pyg,
        ganancia_neta_pyg,
        margen_neto_pct
      FROM vista_metricas_financieras
      ORDER BY fecha DESC
      LIMIT 30;
    `);
    return rows;
  } catch (error) {
    console.error('Error consultando vista_metricas_financieras en Neon:', error);
    return null;
  }
}
