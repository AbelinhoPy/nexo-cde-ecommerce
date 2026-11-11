import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Headers nativos de Vercel Edge / Functions
    const vercelCity = req.headers.get("x-vercel-ip-city");
    const vercelRegion = req.headers.get("x-vercel-ip-country-region");
    const vercelCountry = req.headers.get("x-vercel-ip-country") || "PY";
    const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

    const ciudad = vercelCity ? decodeURIComponent(vercelCity).trim() : null;
    const region = vercelRegion ? decodeURIComponent(vercelRegion).trim() : null;

    // Ciudades excluidas de la zona este / frontera
    const ciudadesExcluidasCde = [
      "ciudad del este",
      "hernandarias",
      "presidente franco",
      "minga guazú",
      "minga guazu",
      "foz do iguacu",
      "foz do iguaçu",
      "puerto iguazu",
      "puerto iguazú"
    ];

    let esZonaCde = false;

    if (ciudad && ciudadesExcluidasCde.some(c => ciudad.toLowerCase().includes(c))) {
      esZonaCde = true;
    }

    // Región 10 en Paraguay corresponde a Alto Paraná
    if (region && (region === "10" || region.toLowerCase().includes("alto paraná") || region.toLowerCase().includes("alto parana"))) {
      esZonaCde = true;
    }

    return NextResponse.json({
      success: true,
      esZonaCde,
      esInterior: !esZonaCde,
      ciudad: ciudad || "Desconocida",
      region: region || "Desconocida",
      pais: vercelCountry,
      mensaje: esZonaCde
        ? "Ubicación detectada en Ciudad del Este / Alto Paraná. Servicio exclusivo para envíos al interior vía TSI."
        : "Ubicación apta para envíos TSI al interior de Paraguay."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      esZonaCde: false,
      esInterior: true,
      error: error.message
    });
  }
}
