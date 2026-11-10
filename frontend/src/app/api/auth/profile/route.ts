import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, getPool } from "@/lib/db";
import { 
  verifyCustomerToken, 
  decryptAES256Buffer, 
  encryptAES256Buffer, 
  hashSHA256 
} from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-customer-token");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Sesión expirada o inválida" }, { status: 401 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no configurada" }, { status: 500 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      const res = await client.query(
        `
        SELECT 
          id, nombre_completo, email, ci_cifrado, telefono_cifrado,
          direccion_cifrada, ciudad_destino, departamento, created_at
        FROM clientes 
        WHERE id = $1 
        LIMIT 1;
        `,
        [payload.id]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
      }

      const row = res.rows[0];
      return NextResponse.json({
        success: true,
        cliente: {
          id: row.id,
          nombre: row.nombre_completo,
          email: row.email,
          ci: decryptAES256Buffer(row.ci_cifrado),
          telefono: decryptAES256Buffer(row.telefono_cifrado),
          direccion: decryptAES256Buffer(row.direccion_cifrada),
          ciudad: row.ciudad_destino,
          departamento: row.departamento,
          fechaRegistro: row.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error obteniendo perfil:", err);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-customer-token");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Sesión inválida" }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, ci, telefono, direccion, ciudad, departamento } = body;

    if (!nombre || !ci || !telefono || !direccion || !ciudad || !departamento) {
      return NextResponse.json({ success: false, error: "Todos los datos de envío son obligatorios" }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      const ciCifrado = encryptAES256Buffer(ci);
      const telCifrado = encryptAES256Buffer(telefono);
      const dirCifrado = encryptAES256Buffer(direccion);
      const ciHash = hashSHA256(ci);
      const telHash = hashSHA256(telefono);

      await client.query(
        `
        UPDATE clientes
        SET 
          nombre_completo = $1,
          ci_cifrado = $2,
          telefono_cifrado = $3,
          direccion_cifrada = $4,
          ci_hash = $5,
          telefono_hash = $6,
          ciudad_destino = $7,
          departamento = $8
        WHERE id = $9;
        `,
        [
          nombre,
          ciCifrado,
          telCifrado,
          dirCifrado,
          ciHash,
          telHash,
          ciudad,
          departamento,
          payload.id,
        ]
      );

      return NextResponse.json({
        success: true,
        mensaje: "Ticket de envío actualizado exitosamente.",
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error actualizando perfil:", err);
    return NextResponse.json({ success: false, error: "Error actualizando ticket" }, { status: 500 });
  }
}
