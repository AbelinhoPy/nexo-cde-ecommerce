"""
==============================================================================
BOT DE CONCILIACIÓN BANCARIA AUTOMÁTICA (BANCO CONTINENTAL - SIPAP)
Daemon en segundo plano para acreditaciones SIPAP en Ciudad del Este
- Monitoreo IMAP/SSL Gmail (@bancontinental.com.py)
- Matching de montos exactos en Guaraníes (PYG)
- Regla estricta de corte 12:00 PM y agenda de despacho TSI a las 13:00 PM
- Creación de evento en Google Calendar con alerta a las 11:30 AM
- Notificación WhatsApp al Administrador (Evolution API / Cloud API)
==============================================================================
"""

import os
import re
import sys
import time
import signal
import logging
from datetime import datetime, date, time as dtime, timedelta, timezone
from typing import Optional, Dict, Any
import email
from email.header import decode_header
import imaplib
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Google Calendar Client Libraries
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    service_account = None
    build = None

load_dotenv()

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (BotContinental) %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bot_continental.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("BotContinental")

# VARIABLES DE ENTORNO
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cde_store")
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
IMAP_PORT = int(os.getenv("IMAP_PORT", "993"))
IMAP_USER = os.getenv("IMAP_USER", "notificaciones.sipap.cde@gmail.com")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD", "")  # Google App Password

GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "service_account.json")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")

WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "http://localhost:8080/message/sendText/cde-instance")
WHATSAPP_API_KEY = os.getenv("WHATSAPP_API_KEY", "")
ADMIN_WHATSAPP_NUMBER = os.getenv("ADMIN_WHATSAPP_NUMBER", "595983000000")  # Formato internacional Paraguay


class BotConciliacionContinental:
    def __init__(self):
        self.running = True
        self.imap_conn: Optional[imaplib.IMAP4_SSL] = None
        self.calendar_service = self._init_google_calendar()

    def _init_google_calendar(self):
        """Inicializa el cliente de Google Calendar con Service Account."""
        if not service_account or not os.path.exists(GOOGLE_SERVICE_ACCOUNT_FILE):
            logger.warning("Credenciales de Google Calendar no encontradas. Las alertas en calendario se simularán.")
            return None
        try:
            scopes = ["https://www.googleapis.com/auth/calendar"]
            creds = service_account.Credentials.from_service_account_file(
                GOOGLE_SERVICE_ACCOUNT_FILE, scopes=scopes
            )
            return build("calendar", "v3", credentials=creds)
        except Exception as e:
            logger.error(f"Error inicializando Google Calendar: {e}")
            return None

    def get_db_connection(self):
        return psycopg2.connect(self.DATABASE_URL if hasattr(self, "DATABASE_URL") else DATABASE_URL)

    def conectar_imap(self):
        """Establece conexión TLS segura con el buzón de correo."""
        try:
            self.imap_conn = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
            self.imap_conn.login(IMAP_USER, IMAP_PASSWORD)
            self.imap_conn.select("INBOX")
            logger.info("Conectado exitosamente a IMAP Gmail.")
        except Exception as e:
            logger.error(f"Falla de conexión IMAP: {e}")
            self.imap_conn = None

    def calcular_fecha_despacho(self, fecha_pago: datetime) -> Dict[str, Any]:
        """
        Regla de corte estricta:
        - Pagos conciliados ANTES de las 12:00 PM del Día X -> Se despachan Día X+1 a las 13:00 PM.
        - Pagos conciliados DESPUÉS de las 12:00 PM del Día X -> Se despachan Día X+2 a las 13:00 PM.
        - Si el día resultante es Domingo (TSI no abre despachos regulares), pasa al Lunes siguiente.
        """
        hora_corte = dtime(12, 0, 0)
        hora_pago = fecha_pago.time()

        if hora_pago < hora_corte:
            dias_sumar = 1
            corte = "ANTES_12PM"
        else:
            dias_sumar = 2
            corte = "DESPUES_12PM"

        fecha_objetivo = (fecha_pago + timedelta(days=dias_sumar)).date()

        # Ajuste por domingo (weekday 6 = Domingo)
        if fecha_objetivo.weekday() == 6:
            fecha_objetivo = fecha_objetivo + timedelta(days=1)
            logger.info(f"El despacho caía domingo; se reprograma para el lunes {fecha_objetivo}")

        return {
            "corte_aplicado": corte,
            "fecha_despacho": fecha_objetivo,
            "hora_despacho": dtime(13, 0, 0)
        }

    def parsear_correo_continental(self, raw_email: bytes) -> Optional[Dict[str, Any]]:
        """
        Extrae datos del correo corporativo de Banco Continental:
        - Remitente debe coincidir con @bancontinental.com.py
        - Monto exacto en Guaraníes (PYG)
        - Comprobante / Nro de transacción
        - Fecha / hora de la operación
        """
        msg = email.message_from_bytes(raw_email)
        remitente = msg.get("From", "")

        # Validación estricta del remitente corporativo
        if "@bancontinental.com.py" not in remitente.lower():
            logger.debug(f"Correo descartado, remitente no corporativo: {remitente}")
            return None

        # Obtener cuerpo del correo
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype in ["text/plain", "text/html"]:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body += payload.decode("utf-8", errors="ignore")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                body = payload.decode("utf-8", errors="ignore")

        # Expresiones regulares adaptadas a las notificaciones oficiales de SIPAP Continental
        # 1. Monto: ej. "Importe: Gs. 3.450.000" o "Monto: PYG 1.250.000"
        monto_match = re.search(r"(?:Importe|Monto|Valor)\s*:\s*(?:Gs\.?|PYG)?\s*([\d\.,]+)", body, re.IGNORECASE)
        # 2. Número de Comprobante / Operación: ej. "Comprobante Nro: 94827104" o "Operación SIPAP: 202611090123"
        comprobante_match = re.search(r"(?:Comprobante|N[uú]mero de Operaci[oó]n|Transacci[oó]n|Referencia)\s*(?:Nro\.?|#)?\s*:\s*([A-Za-z0-9\-]+)", body, re.IGNORECASE)
        # 3. Fecha/Hora
        fecha_match = re.search(r"(?:Fecha y Hora|Fecha)\s*:\s*([\d]{2}/[\d]{2}/[\d]{4}(?:\s+[\d]{2}:[\d]{2}:?[\d]{0,2})?)", body, re.IGNORECASE)

        if not (monto_match and comprobante_match):
            logger.warning("No se pudo extraer monto o comprobante del correo bancario.")
            return None

        # Normalizar monto a entero en Guaraníes (quitar puntos de mil y decimales no usados en PYG)
        monto_str = monto_match.group(1).replace(".", "").replace(",", "").strip()
        monto_pyg = int(monto_str)
        nro_comprobante = comprobante_match.group(1).strip()

        fecha_op = datetime.now(timezone.utc)
        if fecha_match:
            try:
                raw_f = fecha_match.group(1)
                if len(raw_f) > 10:
                    fecha_op = datetime.strptime(raw_f, "%d/%m/%Y %H:%M:%S")
                else:
                    fecha_op = datetime.strptime(raw_f, "%d/%m/%Y")
            except Exception:
                pass

        return {
            "monto_pyg": monto_pyg,
            "numero_comprobante": nro_comprobante,
            "fecha_transaccion": fecha_op,
            "remitente": remitente
        }

    def agendar_google_calendar(self, codigo_pedido: str, destino: str, producto_resumen: str, fecha_despacho: date) -> Optional[str]:
        """
        Crea evento en Google Calendar para el despacho de TSI:
        - Inicio: Día de despacho a las 13:00 PM.
        - Fin: 14:00 PM.
        - Alarma/Recordatorio: 11:30 AM del mismo día (90 minutos antes).
        """
        if not self.calendar_service:
            logger.info(f"[SIMULADO] Evento Google Calendar: Despacho TSI: {codigo_pedido} - {destino} - {producto_resumen}")
            return "simulated-event-id"

        start_datetime = datetime.combine(fecha_despacho, dtime(13, 0, 0)).isoformat() + "-03:00"
        end_datetime = datetime.combine(fecha_despacho, dtime(14, 0, 0)).isoformat() + "-03:00"

        event = {
            "summary": f"Despacho TSI: [{codigo_pedido}] - [{destino}] - [{producto_resumen}]",
            "description": (
                f"Orden de despacho prioritario TSI CDE.\n"
                f"Pedido: {codigo_pedido}\n"
                f"Destino: {destino}\n"
                f"Productos: {producto_resumen}\n"
                f"Horario de entrega a Transportadora TSI: 13:00 PM."
            ),
            "start": {"dateTime": start_datetime, "timeZone": "America/Asuncion"},
            "end": {"dateTime": end_datetime, "timeZone": "America/Asuncion"},
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 90},  # 90 min antes de las 13:00 = 11:30 AM
                    {"method": "email", "minutes": 90}
                ]
            }
        }

        try:
            created_event = self.calendar_service.events().insert(
                calendarId=GOOGLE_CALENDAR_ID, body=event
            ).execute()
            logger.info(f"Evento agendado en Google Calendar. ID: {created_event.get('id')}")
            return created_event.get("id")
        except Exception as e:
            logger.error(f"Error creando evento en Google Calendar: {e}")
            return None

    def notificar_whatsapp_admin(self, pedido: Dict[str, Any], items_texto: str, fecha_despacho: date):
        """
        Envía notificación push inmediata al WhatsApp del administrador en CDE con el pedido
        pagado y la fecha de compra en Atacado Connect.
        """
        mensaje = (
            f"💰 *PAGO SIPAP CONFIRMADO - BANCO CONTINENTAL*\n\n"
            f"📦 *Pedido:* {pedido['codigo_pedido']}\n"
            f"💵 *Monto Acreditado:* ₲{pedido['total_pagar_pyg']:,}\n"
            f"📍 *Destino:* {pedido['ciudad_destino']} ({pedido['departamento']})\n"
            f"🚚 *Flete TSI:* ₲{pedido['monto_flete_pyg']:,}\n"
            f"🧾 *Comprobante SIPAP:* {pedido['comprobante_sipap']}\n\n"
            f"📋 *Ítems para compra física en Atacado Connect:*\n{items_texto}\n\n"
            f"📅 *Despacho Programado TSI:* {fecha_despacho.strftime('%d/%m/%Y')} a las 13:00 hs.\n"
            f"⏰ *Alerta de compra agendada para las 11:30 AM.*"
        )

        try:
            payload = {
                "number": ADMIN_WHATSAPP_NUMBER,
                "text": mensaje
            }
            headers = {"apikey": WHATSAPP_API_KEY, "Content-Type": "application/json"}
            res = requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                logger.info(f"Alerta de WhatsApp enviada exitosamente para pedido {pedido['codigo_pedido']}")
            else:
                logger.warning(f"Error en respuesta de WhatsApp Gateway: {res.text}")
        except Exception as e:
            logger.error(f"Falla enviando mensaje WhatsApp: {e}")

    def procesar_conciliacion(self, datos_bancarios: Dict[str, Any], email_uid: str) -> bool:
        """
        Busca un pedido PENDIENTE cuyo monto exacto coincida con el acreditado vía SIPAP.
        Aplica regla de corte, agenda despacho y notifica.
        """
        monto = datos_bancarios["monto_pyg"]
        comprobante = datos_bancarios["numero_comprobante"]
        fecha_pago = datos_bancarios["fecha_transaccion"]

        conn = self.get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. Registrar log de la transacción para evitar doble uso
                cur.execute(
                    """
                    INSERT INTO log_transacciones_sipap 
                    (numero_comprobante, monto_pyg, fecha_transaccion, remitente_info, email_uid)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (numero_comprobante) DO NOTHING
                    RETURNING id;
                    """,
                    (comprobante, monto, fecha_pago, datos_bancarios["remitente"], email_uid)
                )
                if not cur.fetchone():
                    logger.warning(f"Comprobante SIPAP {comprobante} ya procesado anteriormente. Omitiendo.")
                    return False

                # 2. Buscar pedido PENDIENTE con coincidencia exacta de monto
                cur.execute(
                    """
                    SELECT p.id, p.codigo_pedido, p.total_pagar_pyg, p.monto_flete_pyg,
                           c.ciudad_destino, c.departamento
                    FROM pedidos p
                    JOIN clientes c ON p.cliente_id = c.id
                    WHERE p.estado = 'PENDIENTE' AND p.total_pagar_pyg = %s
                    ORDER BY p.created_at ASC
                    LIMIT 1;
                    """,
                    (monto,)
                )
                pedido = cur.fetchone()

                if not pedido:
                    logger.warning(f"Acreditación de ₲{monto:,} (Comp: {comprobante}) no tiene pedido pendiente con monto idéntico.")
                    conn.commit()
                    return False

                pedido_id = pedido["id"]
                codigo_pedido = pedido["codigo_pedido"]

                # 3. Obtener productos del pedido
                cur.execute(
                    """
                    SELECT pr.nombre, pi.cantidad
                    FROM pedido_items pi
                    JOIN productos pr ON pi.producto_id = pr.id
                    WHERE pi.pedido_id = %s;
                    """,
                    (pedido_id,)
                )
                items = cur.fetchall()
                items_str = "\n".join([f"- {it['cantidad']}x {it['nombre']}" for it in items])
                producto_resumen = ", ".join([f"{it['cantidad']}x {it['nombre']}" for it in items[:2]])

                # 4. Calcular regla de corte (12:00 PM)
                regla = self.calcular_fecha_despacho(fecha_pago)
                fecha_despacho = regla["fecha_despacho"]
                corte_aplicado = regla["corte_aplicado"]

                # 5. Actualizar estado a 'PAGADO'
                cur.execute(
                    """
                    UPDATE pedidos
                    SET estado = 'PAGADO',
                        fecha_pago = %s,
                        comprobante_sipap = %s
                    WHERE id = %s;
                    """,
                    (fecha_pago, comprobante, pedido_id)
                )

                # 6. Agendar en Google Calendar
                event_id = self.agendar_google_calendar(
                    codigo_pedido, pedido["ciudad_destino"], producto_resumen, fecha_despacho
                )

                # 7. Insertar en tabla agenda_despacho
                cur.execute(
                    """
                    INSERT INTO agenda_despacho (
                        pedido_id, fecha_pago_efectivo, corte_aplicado,
                        fecha_despacho_programada, hora_despacho_programada,
                        google_calendar_event_id, notificacion_whatsapp_enviada,
                        estado_despacho
                    ) VALUES (%s, %s, %s, %s, %s, %s, TRUE, 'PROGRAMADO');
                    """,
                    (pedido_id, fecha_pago, corte_aplicado, fecha_despacho, regla["hora_despacho"], event_id)
                )

                # 8. Marcar transacción conciliada
                cur.execute(
                    "UPDATE log_transacciones_sipap SET conciliado = TRUE, pedido_id = %s WHERE numero_comprobante = %s;",
                    (pedido_id, comprobante)
                )

                conn.commit()

                # 9. Disparar WhatsApp al administrador
                pedido["comprobante_sipap"] = comprobante
                self.notificar_whatsapp_admin(pedido, items_str, fecha_despacho)
                logger.info(f"Pedido {codigo_pedido} CONCILIADO exitosamente. Despacho programado: {fecha_despacho}")
                return True

        except Exception as e:
            conn.rollback()
            logger.error(f"Error procesando conciliación de pedido: {e}", exc_info=True)
            return False
        finally:
            conn.close()

    def escanear_correos_no_leidos(self):
        """Monitorea correos no leídos en IMAP buscando avisos de Continental."""
        if not self.imap_conn:
            self.conectar_imap()
            if not self.imap_conn:
                return

        try:
            status, messages = self.imap_conn.search(None, '(UNSEEN FROM "bancontinental.com.py")')
            if status != "OK":
                return

            email_ids = messages[0].split()
            if not email_ids:
                return

            logger.info(f"Se encontraron {len(email_ids)} avisos SIPAP no leídos de Banco Continental.")

            for e_id in email_ids:
                res, data = self.imap_conn.fetch(e_id, "(RFC822)")
                if res != "OK":
                    continue

                raw_email = data[0][1]
                uid_str = e_id.decode()
                datos = self.parsear_correo_continental(raw_email)

                if datos:
                    exito = self.procesar_conciliacion(datos, email_uid=uid_str)
                    if exito:
                        # Marcar como leído
                        self.imap_conn.store(e_id, "+FLAGS", "\\Seen")
                else:
                    # Marcar como visto para evitar bucle si no era aviso válido
                    self.imap_conn.store(e_id, "+FLAGS", "\\Seen")

        except Exception as ex:
            logger.error(f"Error durante el escaneo IMAP: {ex}")
            self.imap_conn = None

    def start(self):
        """Inicia el ciclo principal del daemon."""
        logger.info("Daemon de Conciliación Banco Continental activo. Monitoreando cada 30 segundos...")
        while self.running:
            self.escanear_correos_no_leidos()
            time.sleep(30)

    def stop(self):
        logger.info("Deteniendo daemon de conciliación...")
        self.running = False
        if self.imap_conn:
            try:
                self.imap_conn.close()
                self.imap_conn.logout()
            except Exception:
                pass


if __name__ == "__main__":
    bot = BotConciliacionContinental()

    def signal_handler(sig, frame):
        bot.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    bot.start()
