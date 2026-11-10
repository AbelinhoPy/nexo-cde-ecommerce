-- ==============================================================================
-- ESQUEMA DDL: PLATAFORMA E-COMMERCE INTERMEDIACIÓN CDE -> TSI PARAGUAY
-- MOTOR: PostgreSQL 15+ / Supabase
-- SEGURIDAD: Cifrado simétrico AES-256 (pgcrypto) para PII sensible
-- ==============================================================================

-- 1. HABILITACIÓN DE EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clave maestra de cifrado en sesión (en producción se suministra vía variable de entorno o vault)
-- SET app.crypto_key = 'TU_SUPER_SECRETO_AES_256_COMPLEJO';

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE estado_pedido_enum AS ENUM (
        'PENDIENTE',
        'PAGADO',
        'COMPRADO_PROVEEDOR',
        'EN_EMBALAJE',
        'DESPACHADO_TSI',
        'ENTREGADO',
        'CANCELADO'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_flete_enum AS ENUM (
        'REGULAR', -- ₲35.000 (Celulares, Periféricos, etc.)
        'PESADO'   -- ₲50.000 (Smart TVs, Consolas PS5/Switch)
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE categoria_producto_enum AS ENUM (
        'SMARTPHONES',
        'CONSOLAS_GAMING',
        'SMART_TVS',
        'PERIFERICOS_TOP'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE CONFIGURACIÓN Y COTIZACIÓN DIARIA
CREATE TABLE IF NOT EXISTS configuraciones_cambio (
    id SERIAL PRIMARY KEY,
    pizarra_cde_venta NUMERIC(10, 2) NOT NULL,
    colchon_seguridad_pyg INT NOT NULL DEFAULT 90, -- Entre 80 y 100 Gs.
    cotizacion_efectiva_pyg INT GENERATED ALWAYS AS (ROUND(pizarra_cde_venta + colchon_seguridad_pyg)) STORED,
    descuento_partner_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- 5% mayorista
    margen_gaming_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    margen_smartphones_pct NUMERIC(5, 2) NOT NULL DEFAULT 11.00,
    margen_tvs_pct NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE CATÁLOGO (TOP 50 PRODUCTOS ALTA ROTACIÓN)
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(60) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria categoria_producto_enum NOT NULL,
    tipo_flete tipo_flete_enum NOT NULL DEFAULT 'REGULAR',
    
    -- Precios y costos base
    precio_lista_usd NUMERIC(10, 2) NOT NULL,
    costo_neto_usd NUMERIC(10, 2) NOT NULL, -- precio_lista_usd * 0.95
    cotizacion_aplicada_pyg INT NOT NULL,
    costo_neto_pyg BIGINT NOT NULL,          -- costo_neto_usd * cotizacion_aplicada_pyg
    
    -- Margen y precio al cliente en Guaraníes (redondeado a múltiplos de 1.000)
    margen_aplicado_pct NUMERIC(5, 2) NOT NULL,
    precio_venta_pyg BIGINT NOT NULL,
    
    stock_disponible INT NOT NULL DEFAULT 0,
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_sincronizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- 5. TABLA DE CLIENTES CON CAMPOS PII CIFRADOS (AES-256)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(150) NOT NULL,
    
    -- Campos sensibles cifrados con pgcrypto
    ci_cifrado BYTEA NOT NULL,
    telefono_cifrado BYTEA NOT NULL,
    direccion_cifrada BYTEA NOT NULL,
    
    -- Claves de búsqueda hasheadas (blind index) para búsquedas exactas sin descifrar
    ci_hash VARCHAR(64) NOT NULL UNIQUE,
    telefono_hash VARCHAR(64) NOT NULL,
    
    ciudad_destino VARCHAR(100) NOT NULL, -- ej. Asunción, Encarnación, Cnel. Oviedo
    departamento VARCHAR(100) NOT NULL,
    email VARCHAR(180) UNIQUE,
    password_hash VARCHAR(255),
    password_salt VARCHAR(64),
    ultimo_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_ci_hash ON clientes(ci_hash);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- 6. TABLA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_pedido VARCHAR(20) UNIQUE NOT NULL, -- ej. CDE-20261109-8472
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    
    monto_productos_pyg BIGINT NOT NULL,
    monto_flete_pyg INT NOT NULL, -- 35000 o 50000
    cupon_codigo VARCHAR(30),
    descuento_cupon_pyg BIGINT DEFAULT 0,
    total_pagar_pyg BIGINT NOT NULL, -- Exacto para matching SIPAP
    
    estado estado_pedido_enum NOT NULL DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMP WITH TIME ZONE,
    comprobante_sipap VARCHAR(80),
    numero_guia_tsi VARCHAR(60),
    foto_guia_tsi TEXT, -- Foto nítida del comprobante físico emitido en ventanilla TSI
    
    -- Auditoría legal de aceptación de términos
    terminos_aceptados BOOLEAN NOT NULL DEFAULT FALSE,
    terminos_aceptados_ip VARCHAR(45) NOT NULL,
    terminos_aceptados_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado_monto ON pedidos(estado, total_pagar_pyg);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo_pedido);

-- 7. DETALLE DE PEDIDOS (ITEMS)
CREATE TABLE IF NOT EXISTS pedido_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    
    -- Snapshot histórico de costo y venta
    costo_unitario_usd NUMERIC(10, 2) NOT NULL,
    cotizacion_usada_pyg INT NOT NULL,
    costo_unitario_pyg BIGINT NOT NULL,
    precio_unitario_pyg BIGINT NOT NULL,
    subtotal_pyg BIGINT NOT NULL
);

-- 8. AGENDA DE CORTE Y DESPACHO (REGLA DE LAS 12:00 PM)
CREATE TABLE IF NOT EXISTS agenda_despacho (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
    
    fecha_pago_efectivo TIMESTAMP WITH TIME ZONE NOT NULL,
    corte_aplicado VARCHAR(10) NOT NULL, -- 'ANTES_12PM' o 'DESPUES_12PM'
    
    fecha_despacho_programada DATE NOT NULL,
    hora_despacho_programada TIME NOT NULL DEFAULT '13:00:00',
    
    google_calendar_event_id VARCHAR(120),
    notificacion_whatsapp_enviada BOOLEAN DEFAULT FALSE,
    
    estado_despacho VARCHAR(30) DEFAULT 'PROGRAMADO', -- PROGRAMADO, COMPRADO, EN_TSI, DESPACHADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_fecha_despacho ON agenda_despacho(fecha_despacho_programada);

-- 9. REGISTRO DE TRANSACCIONES SIPAP ENTRANTES (LOG AUDITORÍA)
CREATE TABLE IF NOT EXISTS log_transacciones_sipap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_comprobante VARCHAR(100) UNIQUE NOT NULL,
    monto_pyg BIGINT NOT NULL,
    fecha_transaccion TIMESTAMP WITH TIME ZONE NOT NULL,
    remitente_info TEXT,
    conciliado BOOLEAN DEFAULT FALSE,
    pedido_id UUID REFERENCES pedidos(id),
    email_uid VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 10. VISTAS FINANCIERAS Y OPERATIVAS
-- ==============================================================================

-- A. Vista de Agenda de Compras Diarias (Qué comprar en Atacado Connect en la mañana)
CREATE OR REPLACE VIEW vista_agenda_compras_dia AS
SELECT 
    ad.fecha_despacho_programada,
    p.categoria,
    p.sku,
    p.nombre AS producto_nombre,
    SUM(pi.cantidad) AS cantidad_total_a_comprar,
    p.precio_lista_usd AS precio_unitario_lista_usd,
    p.costo_neto_usd AS costo_unitario_neto_usd,
    SUM(pi.cantidad * p.costo_neto_usd) AS total_usd_necesario_tienda,
    STRING_AGG(ped.codigo_pedido, ', ') AS pedidos_asociados
FROM agenda_despacho ad
JOIN pedidos ped ON ad.pedido_id = ped.id
JOIN pedido_items pi ON ped.id = pi.pedido_id
JOIN productos p ON pi.producto_id = p.id
WHERE ad.estado_despacho IN ('PROGRAMADO', 'COMPRADO')
  AND ped.estado = 'PAGADO'
GROUP BY 
    ad.fecha_despacho_programada,
    p.categoria,
    p.sku,
    p.nombre,
    p.precio_lista_usd,
    p.costo_neto_usd
ORDER BY ad.fecha_despacho_programada ASC, p.categoria ASC;

-- B. Vista de Métricas Financieras y Ganancia Neta
CREATE OR REPLACE VIEW vista_metricas_financieras AS
SELECT 
    DATE(ped.fecha_pago) AS fecha,
    COUNT(DISTINCT ped.id) AS pedidos_totales_pagados,
    
    -- Ingresos brutos recaudados
    SUM(ped.total_pagar_pyg) AS total_recaudado_pyg,
    SUM(ped.monto_productos_pyg) AS ingresos_productos_pyg,
    SUM(ped.monto_flete_pyg) AS total_fletes_cobrados_pyg,
    
    -- Costo de mercadería pagado en Atacado Connect
    SUM(items_cost.costo_total_usd) AS costo_mercaderia_total_usd,
    SUM(items_cost.costo_total_pyg) AS costo_mercaderia_total_pyg,
    
    -- Margen Bruto
    SUM(ped.monto_productos_pyg - items_cost.costo_total_pyg) AS margen_bruto_pyg,
    
    -- Estimación Flete Real TSI (₲30.000 y ₲45.000 convenio de cuenta corporativa)
    SUM(CASE WHEN ped.monto_flete_pyg = 35000 THEN 30000 ELSE 45000 END) AS costo_estimado_tsi_pyg,
    
    -- Ganancia Neta Consolidada
    (SUM(ped.total_pagar_pyg) 
     - SUM(items_cost.costo_total_pyg) 
     - SUM(CASE WHEN ped.monto_flete_pyg = 35000 THEN 30000 ELSE 45000 END)
    ) AS ganancia_neta_pyg,
    
    -- % Margen neto promedio
    ROUND(
        ((SUM(ped.total_pagar_pyg) 
          - SUM(items_cost.costo_total_pyg) 
          - SUM(CASE WHEN ped.monto_flete_pyg = 35000 THEN 30000 ELSE 45000 END))::numeric 
          / NULLIF(SUM(ped.total_pagar_pyg), 0)::numeric) * 100, 
        2
    ) AS margen_neto_pct

FROM pedidos ped
JOIN (
    SELECT 
        pedido_id,
        SUM(cantidad * costo_unitario_usd) AS costo_total_usd,
        SUM(cantidad * costo_unitario_pyg) AS costo_total_pyg
    FROM pedido_items
    GROUP BY pedido_id
) items_cost ON ped.id = items_cost.pedido_id
WHERE ped.estado IN ('PAGADO', 'COMPRADO_PROVEEDOR', 'EN_EMBALAJE', 'DESPACHADO_TSI', 'ENTREGADO')
GROUP BY DATE(ped.fecha_pago)
ORDER BY fecha DESC;

-- 11. TABLA DE SOLICITUDES ESPECIALES CONCIERGE (ENCARGOS FUERA DE CATÁLOGO)
CREATE TABLE IF NOT EXISTS solicitudes_concierge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(180),
    producto_solicitado VARCHAR(255) NOT NULL,
    link_referencia TEXT,
    presupuesto_estimado VARCHAR(100),
    ciudad_destino VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, COTIZADO, CONFIRMADO, DESCARTADO
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_telefono ON solicitudes_concierge(telefono);

