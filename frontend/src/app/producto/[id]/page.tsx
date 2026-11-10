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
  AlertCircle,
  Package,
  Share2,
  Sparkles,
  TrendingDown,
  Layers,
  Box,
  HelpCircle,
  FileText,
  BadgePercent
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { ConciergeModal } from "@/components/ConciergeModal";
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
  const [selectedImg, setSelectedImg] = useState<string>(prod?.img || "");
  const [selectedColor, setSelectedColor] = useState<string>(prod?.colores?.[0] || "");
  const [activeTab, setActiveTab] = useState<"ficha" | "ahorro" | "caja" | "despacho" | "faq">("ficha");
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00b34a] text-white font-bold text-xs uppercase transition shadow-xs cursor-pointer"
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

  // Imágenes disponibles en galería
  const galeriaImagenes = prod.galeria && prod.galeria.length > 0 
    ? [prod.img, ...prod.galeria.filter(g => g !== prod.img)]
    : [prod.img];

  // Cálculo de ahorro frente al precio retail de Asunción / Nissei
  const precioRetail = prod.precioRetailReferencia || Math.round((prod.precioPyg * 1.22) / 1000) * 1000;
  const montoAhorro = Math.max(0, precioRetail - prod.precioPyg);
  const porcentajeAhorro = Math.round((montoAhorro / precioRetail) * 100);

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
        text: `Mirá ${prod.nombre} a precio mayorista de frontera en NEXO CDE:`,
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

      {/* Header Compacto con Acceso a Catálogo y Carrito */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition">
              <NexoLogo theme="light" size="sm" />
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link 
              href="/" 
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" /> 
              <span>Volver a la portada de la tienda</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={shareProduct}
              className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Compartir enlace de este producto"
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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Galería Interactiva con Miniaturas */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl border border-slate-100 bg-[#FBFBFB] p-6 flex items-center justify-center min-h-[340px] sm:min-h-[400px]">
              <button
                onClick={() => {
                  setEsFavorito(!esFavorito);
                  mostrarNotificacion(esFavorito ? "Removido de favoritos" : "❤️ Guardado en favoritos");
                }}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition shadow-xs cursor-pointer z-10"
                title="Guardar en favoritos"
              >
                <Heart className={`w-5 h-5 ${esFavorito ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>

              <img
                src={selectedImg || prod.img}
                alt={prod.nombre}
                className="max-h-[320px] max-w-full object-contain hover:scale-105 transition duration-300"
              />

              <div className="absolute bottom-4 left-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Stock Físico en CDE Verificado</span>
              </div>
            </div>

            {/* Miniaturas de Galería */}
            {galeriaImagenes.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {galeriaImagenes.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(imgUrl)}
                    className={`w-16 h-16 rounded-xl border p-1 bg-white shrink-0 transition cursor-pointer ${
                      (selectedImg || prod.img) === imgUrl
                        ? "border-[#00c853] ring-2 ring-[#00c853]/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Vista ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Sellos de Confianza y Despacho Físico */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Despacho TSI</span>
                  <span className="text-[11px] text-slate-500">Salidas diarias 13:00 hs</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Comprobante Físico</span>
                  <span className="text-[11px] text-slate-500">Foto sellada en tu perfil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Información, Precios, Ahorro y Acciones */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Badges de Categoría, Marca y SKU */}
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
                  title="Copiar código de producto"
                >
                  <span>Cód: {prod.id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Título Principal del Producto */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-snug">
                {prod.nombre}
              </h1>

              {/* Selector de Colores (si aplica) */}
              {prod.colores && prod.colores.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-700">
                    Color: <strong className="text-emerald-700">{selectedColor || prod.colores[0]}</strong>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {prod.colores.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          selectedColor === color
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caja de Precios y Comparador con Nissei / Asunción */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F8FAF9] to-emerald-50/40 border border-emerald-200/80 space-y-3">
                
                {/* Banner de Ahorro Directo vs Retail */}
                {montoAhorro > 0 && (
                  <div className="p-3 bg-emerald-600 text-white rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <BadgePercent className="w-5 h-5 text-emerald-200" />
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block font-semibold text-emerald-100">
                          Precio Retail Asunción (ej. Nissei): ₲ {precioRetail.toLocaleString("es-PY")}
                        </span>
                        <strong className="text-xs sm:text-sm font-black">
                          ¡Comprando en NEXO CDE ahorrás ₲ {montoAhorro.toLocaleString("es-PY")} ({porcentajeAhorro}% OFF)!
                        </strong>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-1 bg-white text-emerald-800 rounded-lg text-xs font-extrabold uppercase tracking-wide">
                      Ahorro CDE
                    </span>
                  </div>
                )}

                {/* Precios Principales: USD y Guaraníes */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-[#00c853] font-mono leading-none">
                        US$ {prod.precioUsd.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Mayorista CDE
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-800 mt-1">
                      <span className="text-xl font-black font-mono">
                        ₲ {prod.precioPyg.toLocaleString("es-PY")}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        (Cotización oficial ₲ {COTIZACION_DOLAR_PYG.toLocaleString("es-PY")})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Disponibilidad</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      ✓ {prod.stock} unidades en stock
                    </span>
                  </div>
                </div>

                {/* Flete Plano TSI */}
                <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Flete plano Transportadora TSI a todo Paraguay:
                  </span>
                  <span className="font-black font-mono text-sm">
                    ₲ {prod.fletePyg.toLocaleString("es-PY")}
                  </span>
                </div>
              </div>

              {/* Características Destacadas Rápidas */}
              {prod.destacados && prod.destacados.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Puntos Clave del Equipo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prod.destacados.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-white border border-slate-100 p-2 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00c853] shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aviso Exclusivo Interior */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Despacho Exclusivo al Interior:</strong> Este artículo se despacha desde Ciudad del Este directamente a tu localidad vía Transportadora TSI. No contamos con mostrador ni retiro presencial en CDE.
                </p>
              </div>

              {/* Selector de Cantidad */}
              <div className="flex items-center gap-4 pt-1">
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

              {/* Botón Consulta Concierge con Abel */}
              <button
                onClick={() => setIsConciergeOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>¿Consultar otra versión, color o pedir cotización especial?</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Información Detallada (Estilo Nissei / Tienda Profesional) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Barra de Pestañas */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-slate-50/70">
            <button
              onClick={() => setActiveTab("ficha")}
              className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === "ficha"
                  ? "border-[#00c853] text-[#00c853] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Ficha Técnica Completa</span>
            </button>

            <button
              onClick={() => setActiveTab("ahorro")}
              className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === "ahorro"
                  ? "border-[#00c853] text-[#00c853] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Comparativa vs Asunción</span>
            </button>

            <button
              onClick={() => setActiveTab("caja")}
              className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === "caja"
                  ? "border-[#00c853] text-[#00c853] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Contenido de la Caja</span>
            </button>

            <button
              onClick={() => setActiveTab("despacho")}
              className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === "despacho"
                  ? "border-[#00c853] text-[#00c853] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Garantía & Despacho TSI</span>
            </button>

            <button
              onClick={() => setActiveTab("faq")}
              className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === "faq"
                  ? "border-[#00c853] text-[#00c853] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Preguntas Frecuentes</span>
            </button>
          </div>

          {/* Contenido de la Pestaña Activa */}
          <div className="p-6 sm:p-8">
            
            {/* 1. FICHA TÉCNICA */}
            {activeTab === "ficha" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Especificaciones Técnicas Oficiales
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Datos extraídos de la ficha de fábrica del distribuidor oficial en Ciudad del Este.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                  {specs.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-baseline justify-between py-2.5 border-b border-slate-100 text-xs"
                    >
                      <span className="font-bold text-slate-500 shrink-0 pr-4">{item.etiqueta}:</span>
                      <span className="font-semibold text-slate-900 text-right">{item.valor}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 block mb-1">Verificación Presencial de Fábrica:</strong>
                  Cada unidad es retirada con precinto de fábrica intacto directamente de distribuidores mayoristas de Ciudad del Este. Antes del embalaje en la terminal de TSI, se coteja el número de serie con el comprobante de compra.
                </div>
              </div>
            )}

            {/* 2. COMPARATIVA DE AHORRO VS ASUNCIÓN */}
            {activeTab === "ahorro" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    ¿Por qué este producto es mucho más accesible aquí que en Asunción?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Transparencia absoluta sobre la intermediación mayorista en frontera.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Precio en Shoppings / Retail Asunción (ej. Nissei):</span>
                    <span className="font-bold text-slate-500 line-through">
                      ₲ {precioRetail.toLocaleString("es-PY")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-base">
                    <span className="font-bold text-slate-900">Precio Mayorista NEXO CDE:</span>
                    <span className="font-black text-emerald-700 text-xl font-mono">
                      ₲ {prod.precioPyg.toLocaleString("es-PY")} (US$ {prod.precioUsd.toFixed(2)})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Flete Plano Transportadora TSI hasta tu ciudad:</span>
                    <span className="font-semibold font-mono">
                      + ₲ {prod.fletePyg.toLocaleString("es-PY")}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-emerald-300 flex items-center justify-between text-base">
                    <strong className="text-emerald-950">Tu Ahorro Neto Puesto en Destino:</strong>
                    <strong className="text-emerald-700 text-xl font-mono">
                      ₲ {Math.max(0, montoAhorro - prod.fletePyg).toLocaleString("es-PY")}
                    </strong>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <h4 className="font-bold text-slate-900 text-sm">El Secreto del Precio de Frontera:</h4>
                  <p>
                    Las grandes tiendas de retail en Asunción tienen costos enormes de alquiler en centros comerciales, sueldos de cientos de empleados e impuestos de intermediación.
                  </p>
                  <p>
                    En <strong>NEXO CDE</strong> funcionamos como tu concierge comercial: compramos directamente con precio mayorista de primer anillo en Ciudad del Este y lo despachamos en la misma tarde por Transportadora TSI. Pagás el precio real de frontera sin recargos injustificados.
                  </p>
                </div>
              </div>
            )}

            {/* 3. CONTENIDO DE LA CAJA */}
            {activeTab === "caja" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    ¿Qué viene incluido dentro de la caja?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Todos los accesorios originales de fábrica con precintos intactos.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {(prod.contenidoCaja && prod.contenidoCaja.length > 0 ? prod.contenidoCaja : [
                    `${prod.nombre} (Unidad Nueva Sellada)`,
                    "Cable de datos y alimentación original de fábrica",
                    "Adaptador / Fuente de alimentación certificada",
                    "Manual de usuario y póliza de garantía oficial",
                    "Embalaje original con código de barras y número de serie"
                  ]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. GARANTÍA Y DESPACHO TSI */}
            {activeTab === "despacho" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Proceso de Despacho y Garantía con Transportadora TSI
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cero sorpresas: trazabilidad física garantizada de principio a fin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <h4 className="font-black text-slate-900">Corte Diario 12:00 PM</h4>
                    <p className="text-slate-500 leading-snug">
                      Pagos por transferencia SIPAP Continental confirmados antes de las 12:00 salen en el lote del mismo día.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                      2
                    </span>
                    <h4 className="font-black text-slate-900">Embalaje & Precinto</h4>
                    <p className="text-slate-500 leading-snug">
                      Caja protegida con plástico burbuja y precinto de seguridad sellado en la agencia TSI de Av. Monseñor Rodríguez.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <h4 className="font-black text-slate-900">Foto en tu Perfil</h4>
                    <p className="text-slate-500 leading-snug">
                      Subimos la foto real de la boleta física con el sello de ventanilla de TSI para que sigas tu encomienda sin dudas.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                  <strong className="block font-bold">Garantía de Satisfacción y Encendido:</strong>
                  <p className="leading-relaxed">
                    Contás con 48 horas tras retirar de la agencia TSI para verificar el correcto encendido del equipo, además de la garantía oficial contra cualquier falla técnica de fabricación.
                  </p>
                </div>
              </div>
            )}

            {/* 5. PREGUNTAS FRECUENTES (FAQ) */}
            {activeTab === "faq" && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Preguntas Frecuentes sobre Compras en CDE
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Resolvemos las dudas más habituales de nuestros clientes en el interior.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <h4 className="font-bold text-slate-900">¿El equipo funciona con las telefonías de Paraguay?</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Sí, 100% de los teléfonos que comercializamos son versiones Globales libres de fábrica. Son totalmente compatibles con Tigo, Claro y Personal en redes 5G y 4G LTE.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <h4 className="font-bold text-slate-900">¿Cómo realizo el pago?</h4>
                    <p className="text-slate-600 leading-relaxed">
                      El pago se efectúa mediante transferencia bancaria SIPAP a nuestra cuenta oficial en Banco Continental a nombre de NUÑEZ MARTINEZ, ABEL IRENEO (RUC 4196328-8).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <h4 className="font-bold text-slate-900">¿Puedo ir a retirar personalmente a Ciudad del Este?</h4>
                    <p className="text-slate-600 leading-relaxed">
                      No contamos con mostrador abierto al público en CDE; operamos exclusivamente como servicio de concierge y despacho mayorista por Transportadora TSI hacia Asunción y ciudades del interior.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Productos Relacionados en Nueva Pestaña */}
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
                  <Link 
                    href={`/producto/${rel.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block group/link"
                    title={`Ver ${rel.nombre} en nueva pestaña`}
                  >
                    <div className="h-40 flex items-center justify-center p-2 mb-2">
                      <img
                        src={rel.img}
                        alt={rel.nombre}
                        className="max-h-full max-w-full object-contain group-hover/link:scale-105 transition duration-200"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover/link:text-[#00c853] transition flex items-start justify-between gap-1">
                      <span>{rel.nombre}</span>
                      <span className="text-[10px] text-slate-400 font-normal">↗</span>
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
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#00c853] hover:text-white text-slate-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Ver</span>
                      <span className="text-[10px]">↗</span>
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

      {/* Modales y Drawers Compartidos */}
      <CartDrawer />
      <AuthModal />
      <ProfileDrawer />
      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        initialQuery={`Consulta por disponibilidad de: ${prod.nombre} (Cód ${prod.id}, US$ ${prod.precioUsd})`}
      />
    </div>
  );
}
