import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDbConfigured, getPool } from "@/lib/db";
import { 
  decryptAES256Buffer, 
  hashSHA256, 
  verifyPassword, 
  createCustomerToken 
} from "@/lib/customerAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const LoginSchema = z.object({
  identificador: z.string().min(3, "Ingresa tu correo o CI"),
  password: z.string().min(4, "Contraseña requerida"),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login_${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      max: 15,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Demasiados intentos fallidos. Espere 15 minutos." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parse = LoginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "Credenciales incompletas." },
        { status: 400 }
      );
    }

    const { identificador, password } = parse.data;
    const cleanId = identificador.trim().toLowerCase();

    if (!isDbConfigured()) {
      return NextResponse.json(
        { success: false, error: "Base de datos no configurada." },
        { status: 500 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Buscar por email o por CI (blind index)
      const ciHash = hashSHA256(cleanId);
      const userRes = await client.query(
        `
        SELECT 
          id, nombre_completo, email, password_hash, password_salt,
          ci_cifrado, telefono_cifrado, direccion_cifrada,
          ciudad_destino, departamento
        FROM clientes
        WHERE LOWER(email) = $1 OR ci_hash = $2
        LIMIT 1;
        `,
        [cleanId, ciHash]
      );

      if (userRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Credenciales incorrectas o usuario no encontrado." },
          { status: 401 }
        );
      }

      const user = userRes.rows[0];

      if (!user.password_hash || !user.password_salt) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Esta cuenta fue creada en compras anteriores sin contraseña. Por favor regístrate nuevamente con una contraseña." 
          },
          { status: 400 }
        );
      }

      // Validar contraseña
      const valid = verifyPassword(password, user.password_hash, user.password_salt);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Contraseña incorrecta." },
          { status: 401 }
        );
      }

      // Actualizar último login
      await client.query("UPDATE clientes SET ultimo_login = NOW() WHERE id = $1;", [user.id]);

      // Descifrar datos para el ticket de envío
      const ciDecrypted = decryptAES256Buffer(user.ci_cifrado);
      const telDecrypted = decryptAES256Buffer(user.telefono_cifrado);
      const dirDecrypted = decryptAES256Buffer(user.direccion_cifrada);

      const token = createCustomerToken({
        id: user.id,
        email: user.email || cleanId,
        nombre: user.nombre_completo,
      });

      return NextResponse.json({
        success: true,
        token,
        cliente: {
          id: user.id,
          nombre: user.nombre_completo,
          email: user.email || cleanId,
          ci: ciDecrypted,
          telefono: telDecrypted,
          direccion: dirDecrypted,
          ciudad: user.ciudad_destino,
          departamento: user.departamento,
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error en login:", err);
    return NextResponse.json(
      { success: false, error: "Error procesando inicio de sesión." },
      { status: 500 }
    );
  }
}
