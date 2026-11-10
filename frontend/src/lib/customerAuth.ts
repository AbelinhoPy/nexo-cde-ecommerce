import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
const IV_LENGTH = 16;

/**
 * Cifrado AES-256-CBC retornando Buffer para BYTEA
 */
export function encryptAES256Buffer(text: string): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

/**
 * Descifrado AES-256-CBC desde Buffer BYTEA
 */
export function decryptAES256Buffer(buffer: Buffer): string {
  try {
    if (!buffer || buffer.length <= IV_LENGTH) return "";
    const iv = buffer.subarray(0, IV_LENGTH);
    const encryptedText = buffer.subarray(IV_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Error descifrando buffer:", err);
    return "";
  }
}

/**
 * Hash SHA-256 para Blind Indexing (búsquedas exactas)
 */
export function hashSHA256(text: string): string {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

/**
 * Hash seguro de contraseñas con PBKDF2 + SHA-512 + Salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { hash, salt };
}

/**
 * Verificación resistente a timing attacks
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch (err) {
    return false;
  }
}

/**
 * Creación de token de sesión firmado para el cliente
 */
export function createCustomerToken(payload: { id: string; email: string; nombre: string }): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 días
  });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = crypto.createHmac("sha256", ENCRYPTION_KEY).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

/**
 * Verificación de token de sesión
 */
export function verifyCustomerToken(token: string): { id: string; email: string; nombre: string } | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [encoded, signature] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", ENCRYPTION_KEY).update(encoded).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return { id: payload.id, email: payload.email, nombre: payload.nombre };
  } catch {
    return null;
  }
}
