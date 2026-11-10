import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDbConfigured, getPool } from "@/lib/db";
import { 
  encryptAES256Buffer, 
  hashSHA256, 
  hashPassword, 
  createCustomerToken 
} from "@/lib/customerAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RegisterSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(120),
  ci: z.string().min(5, "La cédula debe tener al menos 5 dígitos").max(20),
  telefono: z.string().min(6, "El teléfono debe tener al menos 6 dígitos").max(25),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  ciudad: z.string().min(2, "Ciudad requerida").max(80),
  departamento: z.string().min(2, "Departamento requerido").max(60),
  direccion: z.string().min(5, "La dirección debe ser descriptiva para TSI").max(200),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`reg_${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      max: 10,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Demasiados intentos de registro. Intente más tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parse = RegisterSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: parse.error.issues[0]?.message || "Datos de registro inválidos." 
        },
        { status: 400 }
      );
    }

    const data = parse.data;
    const emailSanitized = data.email.trim().toLowerCase();
    const ciHash = hashSHA256(data.ci);
    const telefonoHash = hashSHA256(data.telefono);

    if (!isDbConfigured()) {
      // Modo Mock si DB no configurada
      const mockId = "mock-cli-" + Date.now();
      const token = createCustomerToken({ id: mockId, email: emailSanitized, nombre: data.nombre });
      return NextResponse.json({
        success: true,
        token,
        cliente: {
          id: mockId,
          nombre: data.nombre,
          ci: data.ci,
          telefono: data.telefono,
          email: emailSanitized,
          ciudad: data.ciudad,
          departamento: data.departamento,
          direccion: data.direccion,
        },
      });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // 1. Verificar si el email ya existe
      const checkEmail = await client.query(
        "SELECT id FROM clientes WHERE LOWER(email) = $1 LIMIT 1;",
        [emailSanitized]
      );
      if (checkEmail.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta registrada con este correo electrónico." },
          { status: 400 }
        );
      }

      // 2. Hash seguro de contraseña
      const { hash, salt } = hashPassword(data.password);

      // 3. Cifrado simétrico AES-256 para campos PII
      const ciCifradoBuf = encryptAES256Buffer(data.ci);
      const telCifradoBuf = encryptAES256Buffer(data.telefono);
      const dirCifradoBuf = encryptAES256Buffer(data.direccion);

      // 4. Inserción o actualización con datos de login
      const insertRes = await client.query(
        `
        INSERT INTO clientes (
          nombre_completo, ci_cifrado, telefono_cifrado, direccion_cifrada,
          ci_hash, telefono_hash, ciudad_destino, departamento,
          email, password_hash, password_salt, ultimo_login
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (ci_hash) DO UPDATE SET
          nombre_completo = EXCLUDED.nombre_completo,
          telefono_cifrado = EXCLUDED.telefono_cifrado,
          direccion_cifrada = EXCLUDED.direccion_cifrada,
          ciudad_destino = EXCLUDED.ciudad_destino,
          departamento = EXCLUDED.departamento,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          password_salt = EXCLUDED.password_salt,
          ultimo_login = NOW()
        RETURNING id;
        `,
        [
          data.nombre,
          ciCifradoBuf,
          telCifradoBuf,
          dirCifradoBuf,
          ciHash,
          telefonoHash,
          data.ciudad,
          data.departamento,
          emailSanitized,
          hash,
          salt,
        ]
      );

      const clienteId = insertRes.rows[0].id;
      const token = createCustomerToken({
        id: clienteId,
        email: emailSanitized,
        nombre: data.nombre,
      });

      return NextResponse.json(
        {
          success: true,
          mensaje: "Cuenta creada exitosamente con ticket de envío vinculado.",
          token,
          cliente: {
            id: clienteId,
            nombre: data.nombre,
            ci: data.ci,
            telefono: data.telefono,
            email: emailSanitized,
            ciudad: data.ciudad,
            departamento: data.departamento,
            direccion: data.direccion,
          },
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error en registro de cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error procesando el registro. Intente nuevamente." },
      { status: 500 }
    );
  }
}
