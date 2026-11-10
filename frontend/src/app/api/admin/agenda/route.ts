import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";
import { verifyAdminAccess } from "@/lib/adminAuth";

const MOCK_AGENDA = [
  {
    fecha_despacho_programada: new Date().toISOString().slice(0, 10),
    categoria: "CONSOLAS_GAMING",
    sku: "CON-PS5-SLIM-DIG",
    producto_nombre: "Sony PlayStation 5 Slim Digital Edition 1TB (JP/USA)",
    cantidad_total_a_comprar: 3,
    precio_unitario_lista_usd: 465.0,
    costo_unitario_neto_usd: 441.75, // -5% partner
    total_usd_necesario_tienda: 1325.25,
    pedidos_asociados: "CDE-20261109-9481, CDE-20261109-9485, CDE-20261109-9502",
    comprado: false,
  },
  {
    fecha_despacho_programada: new Date().toISOString().slice(0, 10),
    categoria: "SMARTPHONES",
    sku: "XIA-RN13PP-512",
    producto_nombre: "Xiaomi Redmi Note 13 Pro+ 5G 512GB / 12GB RAM Aurora Purple",
    cantidad_total_a_comprar: 4,
    precio_unitario_lista_usd: 380.0,
    costo_unitario_neto_usd: 361.0,
    total_usd_necesario_tienda: 1444.0,
    pedidos_asociados: "CDE-20261109-9482, CDE-20261109-9489, CDE-20261109-9510, CDE-20261109-9515",
    comprado: true,
  },
  {
    fecha_despacho_programada: new Date().toISOString().slice(0, 10),
    categoria: "SMART_TVS",
    sku: "TV-XIA-A43-4K",
    producto_nombre: "Smart TV Xiaomi Mi TV A Pro 43\" 4K UHD Dolby Audio",
    cantidad_total_a_comprar: 2,
    precio_unitario_lista_usd: 248.0,
    costo_unitario_neto_usd: 235.6,
    total_usd_necesario_tienda: 471.2,
    pedidos_asociados: "CDE-20261109-9494, CDE-20261109-9520",
    comprado: false,
  },
  {
    fecha_despacho_programada: new Date().toISOString().slice(0, 10),
    categoria: "PERIFERICOS_TOP",
    sku: "PER-PS5-DS-WHT",
    producto_nombre: "Mando Sony DualSense Wireless Controller PS5 White",
    cantidad_total_a_comprar: 5,
    precio_unitario_lista_usd: 63.0,
    costo_unitario_neto_usd: 59.85,
    total_usd_necesario_tienda: 299.25,
    pedidos_asociados: "CDE-20261109-9483, CDE-20261109-9488, CDE-20261109-9504",
    comprado: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    // 0. Verificación estricta de seguridad administrativa (PIN)
    const authCheck = verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.reason || "Acceso no autorizado." },
        { status: 401 }
      );
    }

    if (isDbConfigured()) {
      try {
        const rows = await query(`
          SELECT 
            fecha_despacho_programada,
            categoria,
            sku,
            producto_nombre,
            cantidad_total_a_comprar,
            precio_unitario_lista_usd,
            costo_unitario_neto_usd,
            total_usd_necesario_tienda,
            pedidos_asociados
          FROM vista_agenda_compras_dia
          WHERE fecha_despacho_programada >= CURRENT_DATE
          ORDER BY fecha_despacho_programada ASC, categoria ASC;
        `);

        if (rows && rows.length > 0) {
          const totalUsdRequerido = rows.reduce(
            (acc: number, item: any) => acc + Number(item.total_usd_necesario_tienda),
            0
          );
          return NextResponse.json({
            success: true,
            fuente: "Neon PostgreSQL en Vivo",
            fecha_agenda: new Date().toISOString().slice(0, 10),
            total_unidades: rows.reduce((acc: number, i: any) => acc + Number(i.cantidad_total_a_comprar), 0),
            total_usd_caja_tienda: totalUsdRequerido,
            items: rows.map((r: any) => ({
              ...r,
              costo_unitario_neto_usd: Number(r.costo_unitario_neto_usd),
              total_usd_necesario_tienda: Number(r.total_usd_necesario_tienda),
              comprado: false,
            })),
          });
        }
      } catch (errNeon) {
        console.warn("Neon agenda query:", errNeon);
      }
    }

    const totalUsdRequerido = MOCK_AGENDA.reduce(
      (acc, item) => acc + item.total_usd_necesario_tienda,
      0
    );

    return NextResponse.json({
      success: true,
      fuente: "Modo Local / Fallback",
      fecha_agenda: new Date().toISOString().slice(0, 10),
      total_unidades: MOCK_AGENDA.reduce((acc, i) => acc + i.cantidad_total_a_comprar, 0),
      total_usd_caja_tienda: totalUsdRequerido,
      items: MOCK_AGENDA,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Error consultando la agenda de compras." },
      { status: 500 }
    );
  }
}
