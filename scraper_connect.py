"""
==============================================================================
MOTOR DE EXTRACCIÓN Y SINCRONIZACIÓN (SCRAPING CON SCRAPLING)
Objetivo: Extracción de catálogo Atacado Connect (CDE, Paraguay)
Frecuencia programada (Cron): 07:00 AM y 11:30 AM
==============================================================================
"""

import os
import sys
import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Importación de Scrapling para mitigación de huellas digitales y evasión anti-bot
try:
    from scrapling import Fetcher, StealthyFetcher, Adaptor
except ImportError:
    # Fallback descriptivo si la librería se instala en runtime
    raise ImportError("Instale scrapling ejecutando: pip install scrapling")

# Cargar variables de entorno
load_dotenv()

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (ScraperConnect) %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scraper_connect.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("ScraperConnect")

# CONFIGURACIÓN Y CONSTANTES DEL NEGOCIO
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cde_store")
ATACADO_CONNECT_BASE_URL = os.getenv("ATACADO_CONNECT_URL", "https://www.atacadoconnect.com")
PARTNER_DISCOUNT_PCT = 5.00  # 5% de descuento mayorista garantizado

# Catálogos objetivo (Top 50 de alta rotación)
CATEGORIAS_OBJETIVO = {
    "SMARTPHONES": {
        "keywords": ["xiaomi", "redmi", "poco"],
        "margen_pct": 11.0,
        "tipo_flete": "REGULAR"
    },
    "CONSOLAS_GAMING": {
        "keywords": ["playstation 5", "ps5", "nintendo switch oled"],
        "margen_pct": 10.0,
        "tipo_flete": "PESADO"
    },
    "SMART_TVS": {
        "keywords": ['32"', '43"', "smart tv", "tv 32", "tv 43"],
        "margen_pct": 12.0,
        "tipo_flete": "PESADO"
    },
    "PERIFERICOS_TOP": {
        "keywords": ["dualense", "airpods", "redmi buds", "logitech g"],
        "margen_pct": 12.0,
        "tipo_flete": "REGULAR"
    }
}


class AtacadoConnectScraper:
    def __init__(self, db_url: str):
        self.db_url = db_url
        # Inicializa StealthyFetcher de scrapling para saltar TLS fingerprinting y Cloudflare Turnstile/WAF
        self.fetcher = StealthyFetcher()
        self.cotizacion_efectiva: int = 7600  # Default fallback

    def get_db_connection(self):
        return psycopg2.connect(self.db_url)

    def obtener_cotizacion_vigente(self) -> int:
        """
        Obtiene la cotización Pizarra CDE venta + Colchón de seguridad (80-100 Gs.)
        desde la tabla de configuraciones.
        """
        query = """
            SELECT cotizacion_efectiva_pyg 
            FROM configuraciones_cambio 
            WHERE activo = TRUE 
            ORDER BY created_at DESC 
            LIMIT 1;
        """
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    row = cur.fetchone()
                    if row:
                        self.cotizacion_efectiva = int(row[0])
                        logger.info(f"Cotización efectiva aplicada: ₲{self.cotizacion_efectiva:,} / USD")
                    else:
                        logger.warning("No se encontró configuración activa de cotización. Usando ₲7.600 por defecto.")
        except Exception as e:
            logger.error(f"Error consultando cotización en BD: {e}. Usando fallback ₲7.600.")
        return self.cotizacion_efectiva

    def clasificar_producto(self, nombre: str) -> Optional[Dict[str, Any]]:
        """
        Determina si el producto entra en la selección estricta de 50 ítems de alta rotación.
        Descarta accesorios genéricos o productos fuera de objetivo.
        """
        nombre_lower = nombre.lower()
        for cat_key, meta in CATEGORIAS_OBJETIVO.items():
            for kw in meta["keywords"]:
                if kw in nombre_lower:
                    return {
                        "categoria": cat_key,
                        "margen_pct": meta["margen_pct"],
                        "tipo_flete": meta["tipo_flete"]
                    }
        return None

    def redondear_mil_guaranies(self, monto: float) -> int:
        """
        Redondea el precio final en Guaraníes hacia el múltiplo de 1.000 más cercano superior.
        Ejemplo: ₲1.450.250 -> ₲1.451.000
        """
        return int(math.ceil(monto / 1000.0) * 1000)

    def extraer_catalogo(self) -> List[Dict[str, Any]]:
        """
        Navega y extrae los productos objetivo usando Scrapling con protección anti-fingerprint.
        """
        productos_procesados = []
        # URLs de endpoints / categorías clave en Atacado Connect
        target_endpoints = [
            f"{ATACADO_CONNECT_BASE_URL}/categoria/smartphones",
            f"{ATACADO_CONNECT_BASE_URL}/categoria/consolas-videojuegos",
            f"{ATACADO_CONNECT_BASE_URL}/categoria/smart-tv",
            f"{ATACADO_CONNECT_BASE_URL}/categoria/perifericos"
        ]

        logger.info("Iniciando extracción con Scrapling StealthyFetcher...")

        for url in target_endpoints:
            try:
                logger.info(f"Scrapeando endpoint: {url}")
                # StealthyFetcher ejecuta request adaptativo emulando browser real Chrome/Safari
                response = self.fetcher.fetch(url)

                if response.status != 200:
                    logger.warning(f"Error de estado HTTP {response.status} en {url}")
                    continue

                adaptor = Adaptor(response.text)
                # Selectores CSS estandarizados en Atacado Connect
                cards = adaptor.css(".product-item, .product-card, .card-item")

                for card in cards:
                    nombre_el = card.css_first(".product-title, .product-name, h2.title")
                    precio_el = card.css_first(".price-usd, .current-price, .usd-amount")
                    sku_el = card.css_first("[data-sku], .product-sku, .sku-code")
                    stock_el = card.css_first(".stock-qty, .availability, [data-stock]")
                    img_el = card.css_first("img.product-img, img.lazyload, .card-image img")

                    if not (nombre_el and precio_el):
                        continue

                    nombre = nombre_el.text.strip()
                    clasificacion = self.clasificar_producto(nombre)
                    if not clasificacion:
                        continue  # Omitir ítems que no correspondan a los 50 objetivos

                    # Stock check: omitir ítems sin stock o con stock crítico (< 3 unidades)
                    stock_qty = 10  # default si está disponible
                    if stock_el:
                        stock_text = stock_el.text.strip()
                        if "agotado" in stock_text.lower() or "sin stock" in stock_text.lower():
                            continue
                        # Extraer dígitos
                        nums = [int(s) for s in stock_text.split() if s.isdigit()]
                        if nums:
                            stock_qty = nums[0]
                            if stock_qty < 3:
                                logger.info(f"Omitiendo {nombre} por stock crítico ({stock_qty} un.)")
                                continue

                    # Parser del precio en USD
                    raw_price_str = precio_el.text.replace("$", "").replace("USD", "").replace(",", "").strip()
                    try:
                        precio_lista_usd = float(raw_price_str)
                    except ValueError:
                        continue

                    # Generación / Extracción de SKU
                    sku = sku_el.text.strip() if sku_el else f"AC-{hash(nombre) % 10000000:07d}"
                    img_url = img_el.attrib.get("data-src") or img_el.attrib.get("src") if img_el else None

                    # --- REGLAS MATEMÁTICAS DE NEGOCIO ---
                    # 1. Costo neto con descuento mayorista de partner (5%)
                    costo_neto_usd = round(precio_lista_usd * (1 - (PARTNER_DISCOUNT_PCT / 100.0)), 2)
                    
                    # 2. Conversión a PYG con cotización segura
                    costo_neto_pyg = int(costo_neto_usd * self.cotizacion_efectiva)
                    
                    # 3. Margen comercial bruto (10% a 12% según categoría)
                    margen_pct = clasificacion["margen_pct"]
                    precio_bruto_pyg = costo_neto_pyg * (1 + (margen_pct / 100.0))
                    
                    # 4. Redondeo estricto a múltiplos de ₲1.000
                    precio_venta_pyg = self.redondear_mil_guaranies(precio_bruto_pyg)

                    productos_procesados.append({
                        "sku": sku,
                        "nombre": nombre,
                        "categoria": clasificacion["categoria"],
                        "tipo_flete": clasificacion["tipo_flete"],
                        "precio_lista_usd": precio_lista_usd,
                        "costo_neto_usd": costo_neto_usd,
                        "cotizacion_aplicada_pyg": self.cotizacion_efectiva,
                        "costo_neto_pyg": costo_neto_pyg,
                        "margen_aplicado_pct": margen_pct,
                        "precio_venta_pyg": precio_venta_pyg,
                        "stock_disponible": stock_qty,
                        "imagen_url": img_url,
                        "activo": True,
                        "ultima_sincronizacion": datetime.now(timezone.utc)
                    })

            except Exception as ex:
                logger.error(f"Falla durante la extracción de {url}: {ex}", exc_info=True)

        logger.info(f"Extracción finalizada. Total de productos calificados: {len(productos_procesados)}")
        return productos_procesados

    def persistir_catalogo(self, productos: List[Dict[str, Any]]):
        """
        Almacena en PostgreSQL / Supabase con operación UPSERT por SKU.
        """
        if not productos:
            logger.warning("No hay productos para sincronizar.")
            return

        upsert_query = """
            INSERT INTO productos (
                sku, nombre, categoria, tipo_flete,
                precio_lista_usd, costo_neto_usd, cotizacion_aplicada_pyg, costo_neto_pyg,
                margen_aplicado_pct, precio_venta_pyg, stock_disponible, imagen_url,
                activo, ultima_sincronizacion
            ) VALUES %s
            ON CONFLICT (sku) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                categoria = EXCLUDED.categoria,
                tipo_flete = EXCLUDED.tipo_flete,
                precio_lista_usd = EXCLUDED.precio_lista_usd,
                costo_neto_usd = EXCLUDED.costo_neto_usd,
                cotizacion_aplicada_pyg = EXCLUDED.cotizacion_aplicada_pyg,
                costo_neto_pyg = EXCLUDED.costo_neto_pyg,
                margen_aplicado_pct = EXCLUDED.margen_aplicado_pct,
                precio_venta_pyg = EXCLUDED.precio_venta_pyg,
                stock_disponible = EXCLUDED.stock_disponible,
                imagen_url = COALESCE(EXCLUDED.imagen_url, productos.imagen_url),
                activo = EXCLUDED.activo,
                ultima_sincronizacion = EXCLUDED.ultima_sincronizacion;
        """

        valores = [
            (
                p["sku"], p["nombre"], p["categoria"], p["tipo_flete"],
                p["precio_lista_usd"], p["costo_neto_usd"], p["cotizacion_aplicada_pyg"], p["costo_neto_pyg"],
                p["margen_aplicado_pct"], p["precio_venta_pyg"], p["stock_disponible"], p["imagen_url"],
                p["activo"], p["ultima_sincronizacion"]
            )
            for p in productos
        ]

        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    execute_values(cur, upsert_query, valores)
                conn.commit()
            logger.info(f"Sincronización exitosa en base de datos. {len(productos)} registros actualizados.")
        except Exception as e:
            logger.error(f"Error persistiendo catálogo en Supabase/Postgres: {e}", exc_info=True)


def ejecutar_rutina_scraping():
    logger.info("=== INICIANDO RUTINA DE SINCRONIZACIÓN DE CATÁLOGO ATACADO CONNECT ===")
    scraper = AtacadoConnectScraper(db_url=DATABASE_URL)
    scraper.obtener_cotizacion_vigente()
    productos = scraper.extraer_catalogo()
    scraper.persistir_catalogo(productos)
    logger.info("=== SINCRONIZACIÓN COMPLETADA SATISFACTORIAMENTE ===")


if __name__ == "__main__":
    ejecutar_rutina_scraping()
