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
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://nexocde.vercel.app/#organization",
        "name": "NEXO CDE",
        "alternateName": "NEXO Concierge Comercial & Transporte",
        "url": "https://nexocde.vercel.app",
        "logo": "https://nexocde.vercel.app/logo-nexo-sheet.jpg",
        "description": "Intermediación mayorista directa de tecnología en Ciudad del Este con despacho diario por Transportadora TSI a todo Paraguay.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Ciudad del Este",
          "addressRegion": "Alto Paraná",
          "addressCountry": "PY"
        },
        "paymentAccepted": "SIPAP Banco Continental, Transferencia Bancaria",
        "currenciesAccepted": "PYG, USD"
      },
      {
        "@type": "WebSite",
        "@id": "https://nexocde.vercel.app/#website",
        "url": "https://nexocde.vercel.app",
        "name": "NEXO CDE",
        "publisher": {
          "@id": "https://nexocde.vercel.app/#organization"
        },
        "inLanguage": "es-PY"
      }
    ]
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-slate-900 text-slate-100 antialiased min-h-screen">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
