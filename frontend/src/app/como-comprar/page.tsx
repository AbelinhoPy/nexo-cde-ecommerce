import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { 
  Truck, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  CreditCard, 
  Camera, 
  HelpCircle, 
  ArrowLeft, 
  ShoppingBag, 
  ChevronRight,
  Phone,
  Building2,
  FileText,
  BadgeCheck,
  Search,
  Sparkles
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";

export const metadata: Metadata = {
  title: "Cómo Comprar en Ciudad del Este con Envío TSI | Guía NEXO CDE",
  description: "Guía paso a paso para comprar electrónica, consolas y smartphones al precio mayorista de Ciudad del Este con flete plano garantizado por Transportadora TSI a todo Paraguay.",
  alternates: {
    canonical: "https://nexocde.vercel.app/como-comprar",
  },
  openGraph: {
    title: "Cómo Comprar en Ciudad del Este con Envío TSI | Guía NEXO CDE",
    description: "Comprá al verdadero precio mayorista de frontera de Connect Partner CDE con despacho asegurado en 24-48 hs vía Transportadora TSI a todo el interior de Paraguay.",
    url: "https://nexocde.vercel.app/como-comprar",
    siteName: "NEXO CDE",
    locale: "es_PY",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Cómo Comprar en NEXO CDE con Envío TSI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cómo Comprar en Ciudad del Este con Envío TSI | Guía NEXO CDE",
    description: "Guía oficial de compras mayoristas de tecnología con envío garantizado por Transportadora TSI.",
    images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&q=80"],
  },
};

export default function ComoComprarPage() {
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
        "name": "Cómo Comprar",
        "item": "https://nexocde.vercel.app/como-comprar"
      }
    ]
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo comprar en Ciudad del Este con envío por Transportadora TSI",
    "description": "Pasos para adquirir tecnología a precio mayorista de frontera en NEXO CDE y recibirla en Asunción o el interior de Paraguay.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Elegir el equipo en el catálogo",
        "text": "Seleccioná smartphones, consolas o electrónica con stock físico verificado en CDE o solicitá un producto por encargo con el servicio Concierge."
      },
      {
        "@type": "HowToStep",
        "name": "Consultar total y flete plano TSI",
        "text": "El sistema calcula el costo del equipo más el flete plano de Transportadora TSI (₲ 35.000 para equipos regulares o ₲ 50.000 para consolas y TVs)."
      },
      {
        "@type": "HowToStep",
        "name": "Pago seguro SIPAP Banco Continental",
        "text": "Transferencia bancaria oficial a nombre de Abel Núñez Martínez (RUC 4196328-8)."
      },
      {
        "@type": "HowToStep",
        "name": "Corte 12:00 PM y Despacho 13:00 hs",
        "text": "Los pagos confirmados antes de mediodía salen a las 13:00 hs en el camión diario de TSI desde CDE."
      },
      {
        "@type": "HowToStep",
        "name": "Recepción de comprobante y guía sellada",
        "text": "Recibís la fotografía de la guía de remisión sellada por TSI para realizar el seguimiento de tu paquete hasta tu ciudad."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] antialiased font-sans flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Top Banner de Horario y Restricción Geográfica */}
      <div className="bg-gradient-to-r from-black via-zinc-950 to-black text-amber-300 text-[11px] font-semibold py-2 px-4 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider animate-pulse">
              GUÍA OFICIAL
            </span>
            <span className="text-zinc-300">
              Compras directas de frontera para Asunción y el Interior del país
            </span>
            <span className="hidden sm:flex items-center gap-1 text-amber-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <strong>Corte 12:00 PM</strong> • Despacho TSI 13:00 hs
            </span>
          </div>
          <Link href="/" className="text-amber-300 hover:text-white font-bold text-xs flex items-center gap-1">
            <span>Volver a la Tienda</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Header Compacto */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition">
              <NexoLogo theme="light" size="md" />
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link 
              href="/" 
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" /> 
              <span>Ir al Catálogo de Productos</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/#catalogo-principal"
              className="px-4 py-2 rounded-full bg-[#00c853] hover:bg-[#00b34a] text-white flex items-center gap-2 text-xs font-black transition shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Catálogo Mayorista</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10 flex-1">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Cómo Comprar y Envíos TSI</span>
        </nav>

        {/* Hero de la Guía */}
        <section className="bg-gradient-to-br from-slate-950 via-zinc-900 to-black text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Logística Mayorista Ciudad del Este ➔ Todo Paraguay</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Cómo comprar al precio mayorista de CDE y recibirlo por Transportadora TSI
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed">
              En NEXO CDE conectamos a compradores de Asunción y del interior con el stock físico de distribuidores mayoristas de frontera como Connect Partner. Sin sobreprecios inflados de shoppings y con total transparencia en fletes y pagos.
            </p>
          </div>
        </section>

        {/* Paso a Paso Detallado */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-900">
              El proceso de compra en 5 pasos sencillos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Desde la elección en la web hasta la llegada del paquete a tu ciudad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Paso 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-emerald-500 transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                  1
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Catálogo o Encargo
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Elegí tu equipo o pedilo por Concierge
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Navegá nuestro catálogo de 100 productos de alta rotación (consolas PlayStation, smartphones Xiaomi/Samsung/Apple, drones DJI, audio JBL). Si buscás un modelo específico que no esté en la lista, usá el botón <strong>&ldquo;Pedir por Encargo&rdquo;</strong> y te lo cotizamos en minutos.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-emerald-500 transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                  2
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Flete Transparente
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Tarifa plana de flete Transportadora TSI
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sin sorpresas ni cobros abusivos por kilo:
              </p>
              <ul className="text-xs text-slate-700 space-y-1 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <li>• <strong>₲ 35.000:</strong> Paquete regular (Smartphones, Auriculares, Perfumes, Smartwatches).</li>
                <li>• <strong>₲ 50.000:</strong> Paquete pesado/voluminoso (Consolas PS5/Xbox, Notebooks, TVs).</li>
              </ul>
            </div>

            {/* Paso 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-emerald-500 transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center">
                  3
                </span>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Pago Seguro
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Pago por SIPAP Banco Continental
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Al confirmar en checkout, transferís mediante SIPAP con total respaldo bancario y trazabilidad:
              </p>
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-slate-800 font-mono space-y-1">
                <div><strong>Banco:</strong> Continental S.A.</div>
                <div><strong>Titular:</strong> NUÑEZ MARTINEZ, ABEL IRENEO</div>
                <div><strong>RUC:</strong> 4196328-8 • Cuenta: 010015602601</div>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-emerald-500 transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                  4
                </span>
                <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Salida Diaria
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Corte 12:00 PM • Salida 13:00 hs
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Los pagos confirmados antes de las 12:00 hs se retiran de depósito, se embalan con protección de burbuja y salen ese mismo día a las 13:00 hs en la flota diaria de Transportadora TSI desde Ciudad del Este hacia tu ciudad.
              </p>
            </div>

            {/* Paso 5 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-emerald-500 transition md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                  5
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Garantía y Entrega
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Guía sellada en tu perfil y recepción en destino
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Una vez despachado en ventanilla TSI, cargamos en tu perfil de cliente la <strong>fotografía real del comprobante sellado y firmado</strong> con el número de remisión. Con ese código hacés el seguimiento en tiempo real y retirás en la sucursal de TSI de tu localidad o lo recibís en puerta en 24 a 48 horas hábiles.
              </p>
            </div>
          </div>
        </section>

        {/* Cobertura de Envíos TSI en Paraguay */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Cobertura Nacional vía Transportadora TSI</h3>
              <p className="text-xs text-slate-500">Llegamos a todo Paraguay sin sobrecostos de intermediarios.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-semibold text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Asunción y Gran Asunción</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 San Lorenzo, Luque, Lambaré</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Encarnación e Itapúa</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Coronel Oviedo y Caaguazú</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Villarrica y Guairá</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Concepción y San Pedro</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Paraguarí y Misiones</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">📍 Chaco y demás departamentos</div>
          </div>
        </section>

        {/* Preguntas Frecuentes */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            <span>Preguntas Frecuentes sobre el Servicio</span>
          </h2>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1.5 shadow-xs">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                ¿Puedo comprar para retirar en Ciudad del Este de forma presencial?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No. NEXO CDE opera <strong>exclusivamente como servicio de intermediación y despacho para clientes de Asunción y el interior del país</strong>. No contamos con salón de ventas abierto al público en CDE; el stock físico se retira directo de distribuidores mayoristas y se entrega cerrado en ventanilla de Transportadora TSI.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1.5 shadow-xs">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                ¿Los productos son nuevos y originales?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sí, 100%. Todos los artículos son nuevos de fábrica, sellados en caja con número de serie y garantía oficial del fabricante. Antes del empaquetado verificamos el precinto original.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1.5 shadow-xs">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                ¿Qué hago si necesito un producto que no está en el catálogo?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                En Ciudad del Este tenemos acceso directo a más de 50.000 artículos en distribuidores de frontera. Simplemente usá la opción &ldquo;Pedir por Encargo&rdquo; o escribinos desde el formulario de contacto con la marca y modelo que buscás, y te pasamos cotización mayorista en el día.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-[#00c853] text-white rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-md">
          <h3 className="text-xl sm:text-2xl font-black">
            ¿Listo para comprar al verdadero precio de frontera?
          </h3>
          <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto leading-relaxed">
            Explorá nuestro catálogo de 100 productos en liquidación Black November o pedí una cotización especial hoy mismo.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#catalogo-principal"
              className="px-8 py-3 rounded-full bg-white text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-xs"
            >
              Ver Productos Disponibles
            </Link>
          </div>
        </section>
      </main>

      {/* Footer Mínimo */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <NexoLogo theme="dark" size="sm" />
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>•</span>
            <Link href="/como-comprar" className="hover:text-white transition text-white font-bold">Cómo Comprar</Link>
            <span>•</span>
            <Link href="/#contacto" className="hover:text-white transition">Contacto</Link>
          </div>
          <span className="text-[11px] text-slate-500">
            NEXO CDE • Envíos garantizados vía Transportadora TSI
          </span>
        </div>
      </footer>
    </div>
  );
}
