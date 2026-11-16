import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Lista de respaldo garantizada en caso de caída temporal de red
const FALLBACK_DESTINOS = [
  { departamento: "Asunción (Distrito Capital)", ciudad: "Asunción", agenciaNombre: "Agencia Central TSI Asunción (Av. Fdo. de la Mora)", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "San Lorenzo", agenciaNombre: "Agencia TSI San Lorenzo (Ruta 2)", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Luque", agenciaNombre: "Agencia TSI Luque", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Fernando de la Mora", agenciaNombre: "Agencia Central TSI", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Lambaré", agenciaNombre: "Agencia TSI Lambaré", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Capiatá", agenciaNombre: "Agencia TSI Capiatá", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Mariano Roque Alonso", agenciaNombre: "Agencia TSI MRA", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Ñemby", agenciaNombre: "Agencia TSI Ñemby", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Itauguá", agenciaNombre: "Agencia TSI Itauguá", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Central", ciudad: "Villa Elisa", agenciaNombre: "Agencia TSI Villa Elisa", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Central", ciudad: "Limpio", agenciaNombre: "Agencia TSI Limpio", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Itapúa", ciudad: "Encarnación", agenciaNombre: "Agencia TSI Encarnación (Zona Terminal)", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Itapúa", ciudad: "Coronel Bogado", agenciaNombre: "Agencia TSI Cnel. Bogado", modalidad: "AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "Itapúa", ciudad: "Hohenau", agenciaNombre: "Agencia TSI Colonias Unidas", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Caaguazú", ciudad: "Coronel Oviedo", agenciaNombre: "Agencia TSI Cnel. Oviedo", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Caaguazú", ciudad: "Caaguazú", agenciaNombre: "Agencia TSI Ciudad de Caaguazú", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Guairá", ciudad: "Villarrica", agenciaNombre: "Agencia TSI Villarrica", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Cordillera", ciudad: "Caacupé", agenciaNombre: "Agencia TSI Caacupé", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Cordillera", ciudad: "Eusebio Ayala", agenciaNombre: "Agencia TSI Eusebio Ayala", modalidad: "AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 hs" },
  { departamento: "Paraguarí", ciudad: "Paraguarí", agenciaNombre: "Agencia TSI Paraguarí", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Paraguarí", ciudad: "Carapeguá", agenciaNombre: "Agencia TSI Carapeguá", modalidad: "AGENCIA", fleteRegularPyg: 35000, fletePesadoPyg: 50000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Concepción", ciudad: "Concepción", agenciaNombre: "Agencia TSI Concepción", modalidad: "AGENCIA", fleteRegularPyg: 45000, fletePesadoPyg: 70000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "San Pedro", ciudad: "Santa Rosa del Aguaray", agenciaNombre: "Agencia TSI Santa Rosa", modalidad: "AGENCIA", fleteRegularPyg: 45000, fletePesadoPyg: 65000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "San Pedro", ciudad: "San Pedro del Ycuamandyyú", agenciaNombre: "Agencia TSI San Pedro", modalidad: "AGENCIA", fleteRegularPyg: 45000, fletePesadoPyg: 65000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "Amambay", ciudad: "Pedro Juan Caballero", agenciaNombre: "Agencia TSI PJC", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 45000, fletePesadoPyg: 65000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "Canindeyú", ciudad: "Curuguaty", agenciaNombre: "Agencia TSI Curuguaty", modalidad: "AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Canindeyú", ciudad: "Salto del Guairá", agenciaNombre: "Agencia TSI Salto del Guairá", modalidad: "AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Misiones", ciudad: "San Juan Bautista", agenciaNombre: "Agencia TSI San Juan Bautista", modalidad: "AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "Misiones", ciudad: "San Ignacio", agenciaNombre: "Agencia TSI San Ignacio", modalidad: "AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  { departamento: "Ñeembucú", ciudad: "Pilar", agenciaNombre: "Agencia TSI Pilar", modalidad: "AGENCIA", fleteRegularPyg: 50000, fletePesadoPyg: 75000, coberturaHabilitada: true, tiempoEstimado: "48 a 72 hs" },
  { departamento: "Caazapá", ciudad: "Caazapá", agenciaNombre: "Agencia TSI Caazapá", modalidad: "AGENCIA", fleteRegularPyg: 40000, fletePesadoPyg: 60000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  // Chaco - Localidades con cobertura confirmada
  { departamento: "Presidente Hayes", ciudad: "Villa Hayes", agenciaNombre: "Agencia TSI Villa Hayes (Acceso Chaco)", modalidad: "DOMICILIO_Y_AGENCIA", fleteRegularPyg: 45000, fletePesadoPyg: 65000, coberturaHabilitada: true, tiempoEstimado: "24 a 48 hs" },
  { departamento: "Presidente Hayes", ciudad: "Benjamín Aceval", agenciaNombre: "Agencia TSI Benjamín Aceval", modalidad: "AGENCIA", fleteRegularPyg: 45000, fletePesadoPyg: 65000, coberturaHabilitada: true, tiempoEstimado: "48 hs" },
  // Chaco - Localidad habilitada pero sin tarifa confirmada (pendiente de cotización)
  { departamento: "Presidente Hayes", ciudad: "Pozo Colorado", agenciaNombre: "Punto de Encomienda Pozo Colorado", modalidad: "AGENCIA", fleteRegularPyg: null, fletePesadoPyg: null, coberturaHabilitada: true, tiempoEstimado: "Cotización requerida", observaciones: "Ruta Transchaco km 270. Pendiente cotización especial TSI." },
  // Localidades fuera de cobertura directa
  { departamento: "Boquerón", ciudad: "Filadelfia", agenciaNombre: "Sin agencia directa TSI CDE", modalidad: "AGENCIA", fleteRegularPyg: null, fletePesadoPyg: null, coberturaHabilitada: false, tiempoEstimado: "Sin cobertura", observaciones: "Fuera de cobertura directa TSI desde CDE." },
  { departamento: "Boquerón", ciudad: "Loma Plata", agenciaNombre: "Sin agencia directa TSI CDE", modalidad: "AGENCIA", fleteRegularPyg: null, fletePesadoPyg: null, coberturaHabilitada: false, tiempoEstimado: "Sin cobertura", observaciones: "Fuera de cobertura directa TSI desde CDE." },
  { departamento: "Alto Paraguay", ciudad: "Fuerte Olimpo", agenciaNombre: "Sin servicio terrestre TSI", modalidad: "AGENCIA", fleteRegularPyg: null, fletePesadoPyg: null, coberturaHabilitada: false, tiempoEstimado: "Sin cobertura", observaciones: "Zona fluvial/remota Chaco Norte sin cobertura." },
  { departamento: "Alto Paraguay", ciudad: "Bahía Negra", agenciaNombre: "Sin servicio terrestre TSI", modalidad: "AGENCIA", fleteRegularPyg: null, fletePesadoPyg: null, coberturaHabilitada: false, tiempoEstimado: "Sin cobertura", observaciones: "Zona fluvial/remota Chaco Norte sin cobertura." }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departamento = searchParams.get("departamento");

    let items: any[] = FALLBACK_DESTINOS;

    if (isDbConfigured()) {
      try {
        let sql = `
          SELECT 
            id, departamento, ciudad, agencia_nombre, modalidad,
            flete_regular_pyg, flete_pesado_pyg, cobertura_habilitada,
            tiempo_estimado, observaciones, fuente_informacion, fecha_actualizacion
          FROM destinos_tsi
        `;
        const params: any[] = [];
        if (departamento) {
          sql += ` WHERE LOWER(departamento) = LOWER($1)`;
          params.push(departamento);
        }
        sql += ` ORDER BY departamento ASC, ciudad ASC;`;

        const rows = await query<any>(sql, params);
        if (rows && rows.length > 0) {
          items = rows.map((r) => ({
            id: r.id,
            departamento: r.departamento,
            ciudad: r.ciudad,
            agenciaNombre: r.agencia_nombre,
            modalidad: r.modalidad,
            fleteRegularPyg: r.flete_regular_pyg !== null ? Number(r.flete_regular_pyg) : null,
            fletePesadoPyg: r.flete_pesado_pyg !== null ? Number(r.flete_pesado_pyg) : null,
            coberturaHabilitada: Boolean(r.cobertura_habilitada),
            tiempoEstimado: r.tiempo_estimado,
            observaciones: r.observaciones,
            fuenteInformacion: r.fuente_informacion,
            fechaActualizacion: r.fecha_actualizacion,
            requiereCotizacion: r.flete_regular_pyg === null || r.flete_pesado_pyg === null,
          }));
        }
      } catch (dbErr) {
        console.warn("Falla temporal consultando destinos_tsi en Neon, usando fallback:", dbErr);
      }
    }

    if (departamento && items === FALLBACK_DESTINOS) {
      items = items.filter(
        (it) => it.departamento.toLowerCase() === departamento.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      destinos: items,
      fuente: "Tarifario Oficial TSI Paraguay - Noviembre 2026",
    });
  } catch (err: any) {
    console.error("Error en /api/geo/destinos:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
