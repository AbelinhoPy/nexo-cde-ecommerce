"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Camera, 
  Copy, 
  Check, 
  ChevronRight, 
  MessageSquare, 
  AlertCircle,
  Package,
  Share2
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { useCart } from "@/lib/CartContext";
import { 
  getProductoById, 
  getEspecificacionesProducto, 
  PRODUCTOS_CATALOGO, 
  COTIZACION_DOLAR_PYG 
} from "@/lib/catalogData";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const prod = getProductoById(id);
  const [cantidad, setCantidad] = useState(1);
  const [copiedId, setCopiedId] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);

  const { addToCart, setIsCartOpen, totalItems, mostrarNotificacion } = useCart();

  if (!prod) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-black text-slate-800">Producto no encontrado</h2>
          <p className="text-xs text-slate-500">
            El código o artículo solicitado no está disponible en el catálogo activo de Ciudad del Este.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00b34a] text-white font-bold text-xs uppercase transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>
      </div>
    );
  }

  const specs = getEspecificacionesProducto(prod);
  const relacionados = PRODUCTOS_CATALOGO
    .filter(p => p.categoria === prod.categoria && p.id !== prod.id)
    .slice(0, 4);

  const copiarSku = () => {
    navigator.clipboard.writeText(prod.id);
    setCopiedId(true);
    mostrarNotificacion(`✓ Código ${prod.id} copiado`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < cantidad; i++) {
      addToCart(prod);
    }
    setIsCartOpen(true);
  };

  const handleComprarAhora = () => {
    for (let i = 0; i < cantidad; i++) {
      addToCart(prod);
    }
    router.push("/checkout");
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: prod.nombre,
        text: `Mira ${prod.nombre} a precio mayorista en NEXO CDE:`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      mostrarNotificacion("✓ Enlace del producto copiado al portapapeles");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] antialiased font-sans flex flex-col">
      {/* Top Banner de Horario y Restricción Geográfica */}
      <div className="bg-[#00c853] text-white text-[11px] font-semibold py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-white" />
              <strong>Corte Diario: 12:00 PM</strong> • Despacho garantizado por TSI a las 13:00 hs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/90">
              Servicio exclusivo para compradores del Interior de Paraguay (Asunción, Central, etc.)
            </span>
            <span className="text-white/95 font-medium">
              Flete plano TSI: ₲ {prod.fletePyg.toLocaleString("es-PY")}
            </span>
          </div>
        </div>
      </div>

      {/* Header Compacto */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition">
              <NexoLogo theme="light" size="sm" />
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link 
              href="/" 
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al catálogo completo
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={shareProduct}
              className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Compartir producto"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 rounded-full bg-[#00c853] hover:bg-[#00b34a] text-white flex items-center gap-2 text-xs font-bold transition shadow-xs cursor-pointer relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Carrito</span>
              {totalItems > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal del Producto */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        
        {/* Breadcrumb de Navegación */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/" className="hover:text-slate-900 transition">{prod.categoria}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">{prod.nombre}</span>
        </nav>

        {/* Tarjeta Principal de Detalle: Dos Columnas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Imagen Grande y Garantías */}
          <div className="lg:col-span-5 space-y-5">
            <div className="relative rounded-2xl border border-slate-100 bg-[#FBFBFB] p-6 flex items-center justify-center min-h-[340px] sm:min-h-[400px]">
              <button
                onClick={() => {
                  setEsFavorito(!esFavorito);
                  mostrarNotificacion(esFavorito ? "Removido de favoritos" : "❤️ Guardado en favoritos");
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition shadow-xs cursor-pointer"
                title="Guardar en favoritos"
              >
                <Heart className={`w-5 h-5 ${esFavorito ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>

              <img
                src={prod.img}
                alt={prod.nombre}
                className="max-h-[320px] max-w-full object-contain hover:scale-105 transition duration-300"
              />

              <div className="absolute bottom-4 left-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Stock Físico en CDE Verificado</span>
              </div>
            </div>

            {/* Sellos de Confianza y Despacho */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Despacho TSI</span>
                  <span className="text-[11px] text-slate-500">Salidas diarias 13:00 hs</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Comprobante Físico</span>
                  <span className="text-[11px] text-slate-500">Foto sellada en tu perfil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Información, Precios y Acciones */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Badges de Categoría y Marca */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                  {prod.categoria}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  {prod.marca}
                </span>
                <button
                  onClick={copiarSku}
                  className="px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 text-[11px] font-mono hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
                  title="Copiar código del producto"
                >
                  <span>Cód: {prod.id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Título del Producto */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-snug">
                {prod.nombre}
              </h1>

              {/* Caja de Precios */}
              <div className="p-5 rounded-2xl bg-[#F8FAF9] border border-emerald-100 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#00c853] font-mono">
                    US$ {prod.precioUsd.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Precio mayorista CDE
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <span className="text-lg font-black font-mono">
                    ₲ {prod.precioPyg.toLocaleString("es-PY")}
                  </span>
                  <span className="text-xs text-slate-500">
                    (Cotización ₲ {COTIZACION_DOLAR_PYG.toLocaleString("es-PY")})
                  </span>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    Flete plano Transportadora TSI a todo Paraguay:
                  </span>
                  <span className="font-bold font-mono">
                    ₲ {prod.fletePyg.toLocaleString("es-PY")}
                  </span>
                </div>
              </div>

              {/* Aviso Exclusivo Interior */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Servicio para el Interior:</strong> Este artículo se despacha desde Ciudad del Este directamente a tu localidad vía Transportadora TSI. No contamos con mostrador ni retiro presencial en CDE.
                </p>
              </div>

              {/* Selector de Cantidad */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cantidad:
                </span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 font-bold transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-mono font-bold text-xs text-slate-900 min-w-10 text-center">
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 font-bold transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  className="py-3.5 px-6 rounded-2xl bg-white border-2 border-[#00c853] text-[#00c853] hover:bg-emerald-50 font-black text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>AGREGAR AL CARRITO</span>
                </button>

                <button
                  onClick={handleComprarAhora}
                  className="py-3.5 px-6 rounded-2xl bg-[#00c853] hover:bg-[#00b34a] text-white font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>COMPRAR AHORA</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Botón WhatsApp Directo con Abel */}
              <a
                href={`https://wa.me/595983000000?text=${encodeURIComponent(`Hola Abel de NEXO CDE, me interesa comprar: ${prod.nombre} (Cód ${prod.id}). ¿Tienen disponibilidad para despachar hoy por TSI?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consultar Disponibilidad por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Ficha Técnica y Especificaciones Oficiales */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ShieldCheck className="w-5 h-5 text-[#00c853]" />
            <h3 className="text-base font-black text-slate-900">
              Especificaciones Técnicas Oficiales
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {specs.map((item, index) => (
              <div 
                key={index}
                className="flex items-baseline justify-between py-2 border-b border-slate-100 text-xs"
              >
                <span className="font-bold text-slate-500">{item.etiqueta}:</span>
                <span className="font-semibold text-slate-900 text-right max-w-xs">{item.valor}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1 leading-relaxed">
            <span className="font-bold text-slate-800 block">Condiciones de Inspección en Ciudad del Este:</span>
            <p>
              Todos los equipos son adquiridos con stock físico en distribuidores oficiales de Ciudad del Este con precinto intacto. Antes de entregar la encomienda a Transportadora TSI, nuestro equipo verifica visualmente el número de serie de fábrica y asienta el remito correspondiente.
            </p>
          </div>
        </div>

        {/* Productos Relacionados */}
        {relacionados.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-base font-black text-slate-900">
              Más artículos de {prod.categoria} en Ciudad del Este
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relacionados.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-[#00c853] transition shadow-xs group"
                >
                  <Link href={`/producto/${rel.id}`} className="block">
                    <div className="h-40 flex items-center justify-center p-2 mb-2">
                      <img
                        src={rel.img}
                        alt={rel.nombre}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                      {rel.nombre}
                    </h4>
                  </Link>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-[#00c853] font-mono block">
                        U$ {rel.precioUsd.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ₲ {rel.precioPyg.toLocaleString("es-PY")}
                      </span>
                    </div>

                    <Link
                      href={`/producto/${rel.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#00c853] hover:text-white text-slate-700 text-xs font-bold transition"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Compacto */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <NexoLogo theme="dark" size="sm" />
          <p className="text-[11px] text-slate-500">
            © 2026 NEXO CDE Concierge Comercial. Despachos diarios a todo el interior de Paraguay vía Transportadora TSI.
          </p>
          <Link href="/" className="text-xs text-emerald-400 hover:underline font-semibold">
            Ir a la Portada
          </Link>
        </div>
      </footer>

      {/* Modales Compartidos */}
      <CartDrawer />
      <AuthModal />
      <ProfileDrawer />
    </div>
  );
}
