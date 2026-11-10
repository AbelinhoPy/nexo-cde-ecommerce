import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, getPool } from "@/lib/db";
import { verifyCustomerToken, verifyPassword, hashPassword } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
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

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, error: "Base de datos no configurada." }, { status: 500 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      const userRes = await client.query(
        "SELECT password_hash, password_salt FROM clientes WHERE id = $1 LIMIT 1;",
        [payload.id]
      );

      if (userRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
      }

      const { password_hash, password_salt } = userRes.rows[0];

      // Verificar contraseña actual
      if (password_hash && password_salt) {
        const isCurrentValid = verifyPassword(currentPassword, password_hash, password_salt);
        if (!isCurrentValid) {
          return NextResponse.json(
            { success: false, error: "La contraseña actual no es correcta." },
            { status: 401 }
          );
        }
      }

      // Hash de nueva contraseña
      const { hash, salt } = hashPassword(newPassword);

      await client.query(
        "UPDATE clientes SET password_hash = $1, password_salt = $2 WHERE id = $3;",
        [hash, salt, payload.id]
      );

      return NextResponse.json({
        success: true,
        mensaje: "Contraseña actualizada con éxito.",
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error cambiando contraseña:", err);
    return NextResponse.json(
      { success: false, error: "Error cambiando contraseña." },
      { status: 500 }
    );
  }
}
