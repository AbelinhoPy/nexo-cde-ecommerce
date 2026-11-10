# E-Commerce de Intermediación CDE -> TSI Paraguay
### Arquitectura Full-Stack, Seguridad Bancaria y Automatización Logística

Plataforma de comercio electrónico diseñada para la intermediación de compras en **Ciudad del Este (CDE), Alto Paraná**, con entrega nacional vía **Transportadora TSI**, abastecimiento en **Atacado Connect**, conciliación automática vía **Banco Continental (SIPAP)** y gestión de corte diario a las **12:00 PM**.

---

## 1. Módulos y Estructura del Proyecto

```
cde-ecommerce-tsi/
├── schema.sql              # Esquema DDL PostgreSQL/Supabase (Cifrado AES-256 + Vistas Financieras)
├── scraper_connect.py      # Motor de extracción con Scrapling (Anti-bot + Reglas de Redondeo)
├── bot_continental.py      # Daemon de conciliación IMAP Banco Continental + Google Calendar + WhatsApp
├── .env.example            # Plantilla de variables de entorno seguras
└── frontend/               # Aplicación Next.js 14+ (App Router, Tailwind CSS)
    ├── package.json
    └── src/
        ├── app/
        │   ├── checkout/
        │   │   └── page.tsx        # Página de checkout con validación de flete y términos
        │   └── api/
        │       └── checkout/
        │           └── route.ts    # Endpoint seguro de creación de pedidos y cifrado de PII
        └── components/
            ├── SipapInstructions.tsx # Datos Banco Continental + Regla de Corte 12:00 PM
            └── TermsModal.tsx        # Modal legal (Inspección TSI, 48hs Garantía, Logística Inversa)
```

---

## 2. Flujo Operativo y Reglas de Negocio

### A. Precios, Márgenes y Conversión Monetaria
1. **Descuento de Partner**: $5\%$ directo sobre el precio de lista mayorista de Atacado Connect:
   $$\text{Costo Neto USD} = \text{Precio Lista USD} \times 0.95$$
2. **Cotización Blindada**:
   $$\text{Cotización Efectiva} = \text{Pizarra Venta CDE} + \text{Colchón de Seguridad (₲80 a ₲100)}$$
3. **Margen Bruto de Ganancia**:
   * Smartphones (Xiaomi/Poco/Redmi): **$11\%$**
   * Gaming (PS5, Nintendo Switch OLED): **$10\%$**
   * Smart TVs (32", 43") y Periféricos Top: **$12\%$**
4. **Redondeo Comercial**: Todo precio al consumidor final en Guaraníes se redondea hacia arriba al múltiplo de ₲1.000 más cercano.

### B. Regla Estricta de Corte y Agenda TSI
* **Hora Límite Diaria**: **12:00 PM (Mediodía)**.
* **Pagado y Conciliado $\le$ 12:00 PM (Día X)**:
  * Compra en tienda y entrega en TSI: **Día X+1 a las 13:00 PM**.
* **Pagado y Conciliado $>$ 12:00 PM (Día X)**:
  * Pasa al siguiente lote: Despacho **Día X+2 a las 13:00 PM**.
* **Automatización**:
  * Creación inmediata de evento en **Google Calendar** para el administrador.
  * Alerta con recordatorio sonoro y push a las **11:30 AM** del día de despacho.
  * Notificación automática por WhatsApp con el listado consolidado de productos a retirar en Atacado Connect.

---

## 3. Guía de Ejecución y Programación (Cronjobs)

### 1. Extracción de Catálogo (`scraper_connect.py`)
Programar en el servidor / VPS (ej. Ubuntu / Debian):
```bash
# Editar crontab
crontab -e

# Ejecutar a las 07:00 AM y 11:30 AM todos los días
0 7,11 * * * /usr/bin/python3 /ruta/al/proyecto/scraper_connect.py >> /var/log/cde_scraper.log 2>&1
```

### 2. Daemon de Conciliación Bancaria (`bot_continental.py`)
Configurar como servicio en `systemd` para ejecución ininterrumpida 24/7:
```ini
# /etc/systemd/system/bot-continental.service
[Unit]
Description=Daemon de Conciliación Banco Continental SIPAP CDE
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/ruta/al/proyecto
ExecStart=/usr/bin/python3 /ruta/al/proyecto/bot_continental.py
Restart=always
RestartSec=10
EnvironmentFile=/ruta/al/proyecto/.env

[Install]
WantedBy=multi-user.target
```
Habilitar y arrancar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bot-continental
sudo systemctl start bot-continental
```

---

## 4. Consultas Clave de Vistas Financieras en PostgreSQL

### A. Lista de Compras para el Día (Atacado Connect)
```sql
SELECT * FROM vista_agenda_compras_dia 
WHERE fecha_despacho_programada = CURRENT_DATE + INTERVAL '1 day';
```

### B. Reporte de Margen y Ganancia Neta Consolidada
```sql
SELECT 
    fecha,
    pedidos_totales_pagados,
    total_recaudado_pyg,
    costo_mercaderia_total_pyg,
    margen_bruto_pyg,
    costo_estimado_tsi_pyg,
    ganancia_neta_pyg,
    margen_neto_pct
FROM vista_metricas_financieras
ORDER BY fecha DESC;
```
