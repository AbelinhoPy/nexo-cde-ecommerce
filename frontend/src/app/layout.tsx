import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CDE E-Commerce | Compras Mayoristas en Ciudad del Este con Envío TSI",
  description: "Intermediación directa desde Atacado Connect en Ciudad del Este. Despacho garantizado a todo Paraguay vía Transportadora TSI. Pagos 100% seguros vía SIPAP Banco Continental.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
