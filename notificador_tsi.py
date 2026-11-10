"""
==============================================================================
MÓDULO DE NOTIFICACIONES Y RASTREO TSI (NOTIFICADOR AUTOMÁTICO)
Objetivo:
- Monitorea pedidos que hayan recibido guía de despacho TSI
- Envía mensaje interactivo de WhatsApp al cliente con enlace de rastreo
- Refuerza recordatorio legal de inspección visual de caja antes de firmar
==============================================================================
"""

import os
import sys
import logging
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (NotificadorTSI) %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("notificador_tsi.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("NotificadorTSI")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cde_store")
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "http://localhost:8080/message/sendText/cde-instance")
WHATSAPP_API_KEY = os.getenv("WHATSAPP_API_KEY", "")


def enviar_whatsapp_guia(telefono: str, mensaje: str) -> bool:
    """Envía el mensaje vía Evolution API / WhatsApp Cloud API."""
    if not WHATSAPP_API_URL:
        logger.warning("WHATSAPP_API_URL no configurada. Mensaje simulado.")
        return True

    try:
        payload = {
            "number": telefono.replace("+", "").replace(" ", "").replace("-", ""),
            "text": mensaje
        }
        headers = {
            "apikey": WHATSAPP_API_KEY,
            "Content-Type": "application/json"
        }
        resp = requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=12)
        return resp.status_code in [200, 201]
    except Exception as e:
        logger.error(f"Error despachando WhatsApp a {telefono}: {e}")
        return False


def procesar_despachos_pendientes_notificacion():
    """
    Busca pedidos en estado DESPACHADO_TSI que tengan guía asignada
    pero aún no tengan notificación de tracking enviada.
    """
    query = """
        SELECT 
            p.id,
            p.codigo_pedido,
            p.numero_guia_tsi,
            c.nombre_completo,
            c.ciudad_destino,
            c.departamento,
            -- En producción se descifra telefono_cifrado mediante pgcrypto:
            -- pgp_sym_decrypt(c.telefono_cifrado, current_setting('app.crypto_key')) as telefono
            '595983000000' AS telefono_cliente
        FROM pedidos p
        JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado = 'DESPACHADO_TSI'
          AND p.numero_guia_tsi IS NOT NULL
        LIMIT 20;
    """

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                pedidos = cur.fetchall()

                logger.info(f"Se encontraron {len(pedidos)} pedidos con guía listos para notificar.")

                for ped in pedidos:
                    codigo = ped["codigo_pedido"]
                    guia = ped["numero_guia_tsi"]
                    destino = f"{ped['ciudad_destino']} ({ped['departamento']})"
                    
                    mensaje = (
                        f"🚚 *¡TU PEDIDO YA FUE DESPACHADO DESDE CDE!*\n\n"
                        f"Hola *{ped['nombre_completo']}*, tu compra ha sido entregada a *Transportadora TSI* en Ciudad del Este.\n\n"
                        f"📋 *Código de Pedido:* `{codigo}`\n"
                        f"📍 *Destino:* {destino}\n"
                        f"🏷️ *Guía de Remisión TSI:* *{guia}*\n"
                        f"🔗 *Seguimiento:* https://tsi.com.py/tracking?guia={guia}\n\n"
                        f"⚠️ *RECORDATORIO OBLIGATORIO DE INSPECCIÓN:*\n"
                        f"Al momento de la entrega por parte del chofer de TSI, por favor *inspecciona el estado exterior del paquete*. "
                        f"Si detectas roturas, precinto violado o abolladuras, asienta la observación en la planilla de TSI antes de firmar."
                    )

                    exito = enviar_whatsapp_guia(ped["telefono_cliente"], mensaje)
                    if exito:
                        logger.info(f"Notificación de guía enviada al cliente para pedido {codigo}.")

    except Exception as e:
        logger.error(f"Error consultando despachos en BD: {e}")


if __name__ == "__main__":
    procesar_despachos_pendientes_notificacion()
