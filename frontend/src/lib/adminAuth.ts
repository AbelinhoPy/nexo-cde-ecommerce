import { NextRequest } from "next/server";

const DEFAULT_ADMIN_PIN = "4196";

export function verifyAdminAccess(req: NextRequest): { authorized: boolean; reason?: string } {
  const expectedPin = process.env.ADMIN_ACCESS_PIN || DEFAULT_ADMIN_PIN;

  // Check header 'x-admin-pin'
  const headerPin = req.headers.get("x-admin-pin");
  if (headerPin && headerPin.trim() === expectedPin) {
    return { authorized: true };
  }

  // Check query parameter 'pin'
  const url = new URL(req.url);
  const queryPin = url.searchParams.get("pin");
  if (queryPin && queryPin.trim() === expectedPin) {
    return { authorized: true };
  }

  // Check cookie 'nexo_admin_pin'
  const cookiePin = req.cookies.get("nexo_admin_pin")?.value;
  if (cookiePin && cookiePin.trim() === expectedPin) {
    return { authorized: true };
  }

  return { 
    authorized: false, 
    reason: "Acceso denegado: Se requiere PIN de administrador autorizado para consultar datos financieros y logística privada." 
  };
}
