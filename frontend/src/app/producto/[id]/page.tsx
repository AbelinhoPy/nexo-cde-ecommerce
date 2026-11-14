import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { 
  getProductoById, 
  PRODUCTOS_CATALOGO,
  ProductoCatalogo 
} from "@/lib/catalogData";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: { id: string };
}

/**
 * Metadatos dinámicos desde el servidor (SSR / SSG) para SEO,
 * Open Graph y vista previa en redes sociales (WhatsApp, Facebook, Twitter).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const prod = getProductoById(params.id);
  if (!prod) {
    return {
      title: "Producto no encontrado | NEXO CDE",
      description: "El artículo solicitado no está disponible en el catálogo activo de Ciudad del Este.",
    };
  }

  const title = `${prod.nombre} - Precio Mayorista CDE`;
  const ogTitle = `${prod.nombre} | NEXO CDE`;
  const description = `Comprá ${prod.nombre} al costo mayorista de Ciudad del Este por ₲ ${prod.precioPyg.toLocaleString("es-PY")} (US$ ${prod.precioUsd.toFixed(2)}). Despacho diario garantizado por Transportadora TSI a Asunción y todo Paraguay.`;
  const canonicalUrl = `https://nexocde.vercel.app/producto/${prod.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
      siteName: "NEXO CDE",
      locale: "es_PY",
      type: "website",
      images: [
        {
          url: prod.img,
          width: 800,
          height: 800,
          alt: prod.nombre,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [prod.img],
    },
  };
}

/**
 * Pre-renderizado estático de fichas populares
 */
export async function generateStaticParams() {
  return PRODUCTOS_CATALOGO.map((prod) => ({
    id: prod.id,
  }));
}

/**
 * Componente de Servidor para la Ficha de Producto:
 * Inyecta datos estructurados JSON-LD Schema.org (Product y Offer)
 * y monta el cliente interactivo sin romper carrito ni checkout.
 */
export default function ProductDetailPage({ params }: PageProps) {
  const prod = getProductoById(params.id);

  if (!prod) {
    notFound();
  }

  const canonicalUrl = `https://nexocde.vercel.app/producto/${prod.id}`;

  // Datos estructurados Schema.org: Product + Offer oficiales para Google Search & Shopping
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": prod.nombre,
    "image": [prod.img, ...(prod.galeria || []).filter(g => g !== prod.img)],
    "description": prod.descripcion || `Comprá ${prod.nombre} al precio mayorista de frontera de Connect Partner CDE. Despacho diario vía Transportadora TSI a todo el interior del país.`,
    "sku": prod.id,
    "category": prod.categoria,
    ...(prod.colores && prod.colores.length > 0 ? { "color": prod.colores[0] } : {}),
    "brand": {
      "@type": "Brand",
      "name": prod.marca
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "PYG",
      "price": prod.precioPyg,
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": prod.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "NEXO CDE"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "PY",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": prod.fletePyg,
          "currency": "PYG"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "PY"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          }
        }
      }
    }
  };

  // Migas de pan Schema.org BreadcrumbList coincidentes con la navegación visible
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://nexocde.vercel.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": prod.categoria,
        "item": "https://nexocde.vercel.app/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": prod.nombre,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <>
      {/* Datos estructurados JSON-LD validados para Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      {/* Componente Interactivo del Cliente (Carrito, Fotos, Opciones, Checkout) */}
      <ProductDetailClient initialProd={prod} />
    </>
  );
}
