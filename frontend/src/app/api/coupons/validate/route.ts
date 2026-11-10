import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, getPool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { codigo, subtotalProductosPyg, fletePyg } = await req.json();

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json(
        { success: false, error: "Por favor ingresa un código de cupón válido." },
        { status: 400 }
      );
    }

    const cleanCode = codigo.trim().toUpperCase();

    // 1. Si la DB está disponible, buscar en la tabla 'cupones'
    if (isDbConfigured()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        const res = await client.query(
          `
          SELECT 
            codigo, descripcion, tipo_descuento, valor_descuento, flete_gratis,
            activo, valido_hasta, usos_maximos, usos_actuales
          FROM cupones
          WHERE codigo = $1 AND activo = TRUE
          LIMIT 1;
          `,
          [cleanCode]
        );

        if (res.rows.length > 0) {
          const cup = res.rows[0];

          // Validar vencimiento
          if (cup.valido_hasta && new Date(cup.valido_hasta) < new Date()) {
            return NextResponse.json(
              { success: false, error: "Este cupón ha expirado." },
              { status: 400 }
            );
          }

          let descuentoCalculadoPyg = 0;
          if (cup.tipo_descuento === "PORCENTAJE") {
            const pct = Number(cup.valor_descuento);
            descuentoCalculadoPyg = Math.round((subtotalProductosPyg * pct) / 100);
          } else if (cup.tipo_descuento === "FIJO_PYG") {
            descuentoCalculadoPyg = Number(cup.valor_descuento);
          }

          if (cup.flete_gratis && fletePyg) {
            descuentoCalculadoPyg += Number(fletePyg);
          }

          return NextResponse.json({
            success: true,
            cupon: {
              codigo: cup.codigo,
              descripcion: cup.descripcion,
              descuentoPyg: descuentoCalculadoPyg,
            },
          });
        }
      } finally {
        client.release();
      }
    }

    // 2. Fallback de cupones oficiales activos
    if (cleanCode === "BIENVENIDA") {
      return NextResponse.json({
        success: true,
        cupon: {
          codigo: "BIENVENIDA",
          descripcion: "Bono de bienvenida: ₲50.000 de descuento en flete TSI",
          descuentoPyg: 50000,
        },
      });
    }

    if (cleanCode === "CDE5") {
      const desc = Math.round((subtotalProductosPyg * 0.05) / 1000) * 1000;
      return NextResponse.json({
        success: true,
        cupon: {
          codigo: "CDE5",
          descripcion: "5% de descuento especial mayorista Ciudad del Este",
          descuentoPyg: desc,
        },
      });
    }

    if (cleanCode === "NEXO10") {
      const desc = Math.round((subtotalProductosPyg * 0.10) / 1000) * 1000;
      return NextResponse.json({
        success: true,
        cupon: {
          codigo: "NEXO10",
          descripcion: "10% de descuento en tu compra NEXO",
          descuentoPyg: desc,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "El cupón ingresado no es válido o ya caducó." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error validando cupón:", err);
    return NextResponse.json(
      { success: false, error: "Error procesando el cupón." },
      { status: 500 }
    );
  }
}
