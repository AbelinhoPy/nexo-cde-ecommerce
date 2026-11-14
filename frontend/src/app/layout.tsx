import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexocde.vercel.app"),
  title: {
    default: "NEXO Concierge Comercial & Transporte | Compras Mayoristas en Ciudad del Este",
    template: "%s | NEXO CDE",
  },
  description: "Intermediación mayorista directa en Ciudad del Este. Despacho diario garantizado a todo el interior de Paraguay vía Transportadora TSI. Pagos 100% seguros vía SIPAP Banco Continental.",
  alternates: {
    canonical: "https://nexocde.vercel.app",
  },
  openGraph: {
    title: "NEXO Concierge Comercial & Transporte | Compras Mayoristas en CDE",
    description: "Comprá tecnología al verdadero precio mayorista de frontera de Connect Partner CDE con envíos diarios por Transportadora TSI a todo Paraguay.",
    url: "https://nexocde.vercel.app",
    siteName: "NEXO CDE",
    locale: "es_PY",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "NEXO CDE - Tecnología Mayorista con Envío TSI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXO Concierge Comercial & Transporte | Compras en Ciudad del Este",
    description: "Tecnología al costo de frontera con flete diario asegurado vía Transportadora TSI.",
    images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&q=80"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-slate-100 antialiased min-h-screen">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
