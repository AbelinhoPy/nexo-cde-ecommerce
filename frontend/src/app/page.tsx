"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Heart, 
  User, 
  ShoppingBag, 
  Gamepad2, 
  Smartphone, 
  Laptop, 
  Tv, 
  Headphones, 
  Flame, 
  Package, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Video, 
  Truck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Phone,
  Sparkles,
  ArrowRight,
  Lock
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { ContactForm } from "@/components/ContactForm";
import { useCart } from "@/lib/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { ProfileDrawer } from "@/components/ProfileDrawer";

export interface ProductoCatalogo {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  precioUsd: number;
  precioPyg: number;
  fletePyg: number;
  tipoFlete: "REGULAR" | "PESADO" | string;
  stock: number;
  img: string;
}

// Catálogo Top 50 Alta Rotación CDE (Atacado Connect)
const PRODUCTOS_CATALOGO: ProductoCatalogo[] = [
  // SMARTPHONES
  { 
    id: "1450781", 
    nombre: "Smartphone Xiaomi Redmi Note 13 4G 256GB 8GB RAM Dual SIM", 
    categoria: "Smartphones", 
    marca: "XIAOMI", 
    precioUsd: 168.00, 
    precioPyg: 1448000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 35, 
    img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=450&q=80" 
  },
  { 
    id: "1450729", 
    nombre: "Smartphone Poco X6 Pro 5G 512GB 12GB RAM Dual SIM Pantalla 6.67\"", 
    categoria: "Smartphones", 
    marca: "POCO", 
    precioUsd: 328.00, 
    precioPyg: 2828000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 22, 
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=450&q=80" 
  },
  { 
    id: "1450422", 
    nombre: "Smartphone Xiaomi Redmi Note 13 Pro+ 5G 512GB 12GB RAM Aurora Purple", 
    categoria: "Smartphones", 
    marca: "XIAOMI", 
    precioUsd: 380.00, 
    precioPyg: 3276000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 14, 
    img: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=450&q=80" 
  },
  { 
    id: "1450415", 
    nombre: "Smartphone Xiaomi Redmi 13C 256GB 8GB RAM Dual SIM Midnight Black", 
    categoria: "Smartphones", 
    marca: "XIAOMI", 
    precioUsd: 122.00, 
    precioPyg: 1052000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 30, 
    img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=450&q=80" 
  },
  { 
    id: "1450890", 
    nombre: "Smartphone Poco F6 5G 256GB 8GB RAM Snapdragon 8s Gen 3", 
    categoria: "Smartphones", 
    marca: "POCO", 
    precioUsd: 365.00, 
    precioPyg: 3147000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 10, 
    img: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=450&q=80" 
  },

  // CONSOLAS GAMING
  { 
    id: "1448603", 
    nombre: "Consola Sony PlayStation 5 Slim Digital Edition 1TB SSD (CFI-2000)", 
    categoria: "Games", 
    marca: "SONY", 
    precioUsd: 465.00, 
    precioPyg: 3971000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 12, 
    img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=450&q=80" 
  },
  { 
    id: "1448597", 
    nombre: "Consola Sony PlayStation 5 Slim Standard Con Lectora Blu-Ray 1TB", 
    categoria: "Games", 
    marca: "SONY", 
    precioUsd: 515.00, 
    precioPyg: 4398000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 15, 
    img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=450&q=80" 
  },
  { 
    id: "1448580", 
    nombre: "Consola Nintendo Switch OLED 64GB Edición Blanca Original", 
    categoria: "Games", 
    marca: "NINTENDO", 
    precioUsd: 285.00, 
    precioPyg: 2434000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 20, 
    img: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=450&q=80" 
  },
  { 
    id: "1448512", 
    nombre: "Consola Nintendo Switch OLED 64GB Neon Blue / Red", 
    categoria: "Games", 
    marca: "NINTENDO", 
    precioUsd: 285.00, 
    precioPyg: 2434000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 18, 
    img: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=450&q=80" 
  },

  // SMART TVS
  { 
    id: "1451201", 
    nombre: "Smart TV Xiaomi Mi TV A Pro 43\" 4K UHD Dolby Audio Google TV", 
    categoria: "Electrónicos", 
    marca: "XIAOMI", 
    precioUsd: 248.00, 
    precioPyg: 2185000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 10, 
    img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=450&q=80" 
  },
  { 
    id: "1451202", 
    nombre: "Smart TV Xiaomi Mi TV A 32\" HD Google TV Bluetooth 5.0", 
    categoria: "Electrónicos", 
    marca: "XIAOMI", 
    precioUsd: 142.00, 
    precioPyg: 1251000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 16, 
    img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=450&q=80" 
  },
  { 
    id: "1451205", 
    nombre: "Smart TV Samsung 43\" Crystal UHD 4K UN43CU7000 Tizen OS", 
    categoria: "Electrónicos", 
    marca: "SAMSUNG", 
    precioUsd: 290.00, 
    precioPyg: 2555000, 
    fletePyg: 50000, 
    tipoFlete: "PESADO",
    stock: 11, 
    img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=450&q=80" 
  },

  // PERIFÉRICOS
  { 
    id: "1449301", 
    nombre: "Mando Inalámbrico Sony DualSense PS5 White Original", 
    categoria: "Informática", 
    marca: "SONY", 
    precioUsd: 63.00, 
    precioPyg: 556000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 25, 
    img: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=450&q=80" 
  },
  { 
    id: "1449302", 
    nombre: "Auriculares Xiaomi Redmi Buds 5 Pro ANC 52dB Hi-Res Wireless", 
    categoria: "Informática", 
    marca: "XIAOMI", 
    precioUsd: 55.00, 
    precioPyg: 485000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 30, 
    img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=450&q=80" 
  },
  { 
    id: "1449305", 
    nombre: "Mouse Gamer Logitech G502 HERO 25.600 DPI Sensor Óptico RGB", 
    categoria: "Informática", 
    marca: "LOGITECH", 
    precioUsd: 42.00, 
    precioPyg: 371000, 
    fletePyg: 35000, 
    tipoFlete: "REGULAR",
    stock: 22, 
    img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=450&q=80" 
  }
];

export default function StorefrontPage() {
  const [busqueda, setBusqueda] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [moneda, setMoneda] = useState<"PYG" | "USD">("PYG");

  const { 
    addToCart, 
    totalItems, 
    setIsCartOpen, 
    setIsAuthModalOpen, 
    setIsProfileOpen, 
    customer, 
    notificacion 
  } = useCart();

  const copiarSku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedId(sku);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const smartphones = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Smartphones");
  const games = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Games");
  const televisores = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Electrónicos");
  const informatica = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Informática");

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] antialiased font-sans flex flex-col">
      {/* ==============================================================================
          1. HEADER ATACADO CONNECT + NEXO CONCIERGE (PATRÓN EXACTO ATACADO CONNECT)
      ============================================================================== */}
      
      {/* Top Banner Verde con Horario de Corte y Garantía */}
      <div className="bg-[#00c853] text-white text-[11px] font-semibold py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-white" />
              <strong>Corte Hoy: 12:00 PM</strong> • Pagos SIPAP recibidos antes de las 12:00 se despachan a las 13:00 hs por TSI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/90">
              Despacho garantizado a todo el territorio paraguayo
            </span>
            <span className="text-white/95 font-medium">
              Flete plano TSI: ₲35.000 / ₲50.000
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Navegación Principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Logo Oficial NEXO / Atacado Connect Partner */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="hover:opacity-95 transition">
              <NexoLogo theme="light" size="md" />
            </Link>
            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00c853]"></span>
              Atacado Connect Partner
            </div>
          </div>

          {/* Gran Buscador Verde Ovalado (Estilo Atacado Connect) */}
          <div className="flex-1 max-w-2xl">
            <div className="relative flex items-center bg-[#00c853] rounded-full p-1 pl-4 shadow-sm">
              <input
                type="text"
                placeholder="¿Qué buscas? (ej. PS5 Slim, Redmi Note 13, TV 43')..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-transparent text-white placeholder-white/80 text-xs sm:text-sm font-medium focus:outline-none"
              />
              <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#00c853] hover:bg-slate-100 transition shrink-0 cursor-pointer shadow-xs">
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Indicadores de Moneda, Cotización y Acciones */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Cotización Dólar Oficial CDE */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-medium">Cotización Dólar</span>
              <span className="text-xs font-bold text-slate-800 font-mono">
                G$ 7.640
              </span>
            </div>

            {/* Selector de Moneda */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700">
              <span className="mr-1.5">🇵🇾</span>
              <span>Guaraní</span>
            </div>

            {/* Iconos de Acción (Favoritos, Usuario, Carrito) */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => alert("Favoritos: Guarda tus artículos preferidos de Atacado Connect.")}
                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-500 hover:border-red-200 transition cursor-pointer"
                title="Favoritos"
              >
                <Heart className="w-4 h-4" />
              </button>
              
              {/* Botón de Perfil / Login del Cliente */}
              <button
                onClick={() => {
                  if (customer) {
                    setIsProfileOpen(true);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer relative ${
                  customer 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" 
                    : "border-slate-200 text-slate-600 hover:text-[#00c853] hover:border-[#00c853]/40"
                }`}
                title={customer ? `Mi Cuenta: ${customer.nombre}` : "Iniciar Sesión / Crear Perfil"}
              >
                <User className="w-4 h-4" />
                {customer && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>

              {/* Botón de Carrito con Slide-over */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-9 h-9 rounded-full bg-[#00c853] text-white flex items-center justify-center hover:bg-[#00b34a] shadow-xs transition relative cursor-pointer"
                title="Ver Carrito y Finalizar Compra"
              >
                <ShoppingBag className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submenú de Categorías con Iconos + Botón Cámara en Vivo */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs py-2">
            <nav className="flex items-center gap-6 overflow-x-auto text-slate-700 font-semibold no-scrollbar">
              <Link href="#games" className="flex items-center gap-1.5 hover:text-[#00c853] transition whitespace-nowrap">
                <Gamepad2 className="w-4 h-4 text-slate-500" />
                <span>Games</span>
              </Link>
              <Link href="#smartphones" className="flex items-center gap-1.5 hover:text-[#00c853] transition whitespace-nowrap text-[#00c853] font-bold">
                <Smartphone className="w-4 h-4 text-[#00c853]" />
                <span>Smartphones</span>
              </Link>
              <Link href="#informatica" className="flex items-center gap-1.5 hover:text-[#00c853] transition whitespace-nowrap">
                <Laptop className="w-4 h-4 text-slate-500" />
                <span>Informática</span>
              </Link>
              <Link href="#electronicos" className="flex items-center gap-1.5 hover:text-[#00c853] transition whitespace-nowrap">
                <Tv className="w-4 h-4 text-slate-500" />
                <span>Electrónicos</span>
              </Link>
              <Link href="#perifericos" className="flex items-center gap-1.5 hover:text-[#00c853] transition whitespace-nowrap">
                <Headphones className="w-4 h-4 text-slate-500" />
                <span>Audio & Periféricos</span>
              </Link>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-300 text-slate-800 text-[11px] font-bold whitespace-nowrap">
                <span>DJI Drones</span>
              </div>
              <span className="flex items-center gap-1 text-red-600 font-bold hover:text-red-700 cursor-pointer whitespace-nowrap">
                <Flame className="w-3.5 h-3.5" />
                Ofertas CDE
              </span>
            </nav>

            {/* Botón Rojo Icónico: Cámara en Vivo del Puente de la Amistad */}
            <a
              href="https://www.youtube.com/results?search_query=puente+de+la+amistad+en+vivo+camara"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white text-[11px] font-bold shadow-xs transition shrink-0 ml-4"
            >
              <Video className="w-3.5 h-3.5" />
              <span>CÁMARA EN VIVO DEL PUENTE DE LA AMISTAD</span>
            </a>
          </div>
        </div>
      </header>

      {/* ==============================================================================
          2. BANNER PRINCIPAL Y SECCIÓN LATERAL PROMO (ESTILO ATACADO CONNECT OFICIAL)
      ============================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Banner Principal Grande (9 cols) - Fondo Grafito Oscuro con Arte Gamer/Tech */}
          <div className="lg:col-span-9 bg-[#111827] rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[300px] sm:min-h-[320px] shadow-sm border border-slate-800">
            
            {/* Contenido Textual a la Izquierda */}
            <div className="p-6 sm:p-10 max-w-lg z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00c853] text-white">
                <Truck className="w-3 h-3" />
                <span>Despacho Directo TSI Paraguay</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight leading-tight">
                Comprá en Ciudad del Este <br />
                <span className="text-[#00c853]">con 5% de descuento mayorista</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Catálogo curado con los 50 productos de mayor rotación en Atacado Connect. Despacho diario a las 13:00 hs con guía de rastreo a todo el país.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    const ps5 = PRODUCTOS_CATALOGO.find(p => p.id === "1448603");
                    if (ps5) addToCart(ps5);
                    setIsCartOpen(true);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#00c853] hover:bg-[#00b34a] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>AGREGAR AL CARRITO</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00c853]" />
                  Pago 100% SIPAP Continental
                </span>
              </div>
            </div>

            {/* Arte Fotográfico de Hardware / Gaming a la Derecha */}
            <div className="relative md:absolute md:right-0 md:top-0 md:bottom-0 w-full md:w-1/2 h-56 md:h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80"
                alt="PlayStation 5 y Gaming CDE"
                className="w-full h-full object-cover object-center md:mask-linear-left opacity-90 hover:scale-102 transition duration-500"
              />
              {/* Degradado para fundir la imagen suavemente con el fondo oscuro */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/40 to-transparent"></div>
            </div>
          </div>

          {/* Banner Lateral Derecho (3 cols) - Tarjeta Promocional con Foto Real (Estilo Atacado Connect) */}
          <div className="lg:col-span-3 rounded-2xl relative overflow-hidden shadow-sm border border-slate-200 group min-h-[300px] flex flex-col justify-end bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80"
              alt="Drones & Gaming CDE"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-85"
            />
            {/* Capa de contraste oscuro para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            <div className="relative z-10 p-5 space-y-2 text-white">
              <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#00c853] text-white">
                DRONES & GAMING
              </span>
              <h3 className="text-base font-black leading-snug">
                STOCK FÍSICO EN ATACADO CONNECT
              </h3>
              <p className="text-[11px] text-slate-300">
                Flete plano TSI: ₲35.000 (regular) y ₲50.000 (consolas y TVs).
              </p>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  className="w-full py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold flex items-center justify-center gap-1 shadow transition"
                >
                  <span>Ver Disponibilidad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#00c853]" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Píldoras de Categorías con Miniaturas (Patrón Atacado Connect) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-4">
          {[
            { label: "Games", img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=150&q=80" },
            { label: "Smartphones", img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150&q=80" },
            { label: "Informática", img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=150&q=80" },
            { label: "Electrónicos", img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=150&q=80" },
            { label: "Periféricos", img: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=150&q=80" },
            { label: "Belleza & Cuidado", img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&q=80" },
          ].map((cat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center gap-2.5 hover:border-[#00c853] transition cursor-pointer shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
              <span className="text-xs font-bold text-slate-800">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================================
          3. SECCIÓN SMARTPHONES CON BANNER LATERAL + TARJETAS (IMAGEN 2 DEL USUARIO)
      ============================================================================== */}
      <section id="smartphones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
        
        {/* Barra de Título Verde */}
        <div className="bg-[#00c853] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Smartphones Xiaomi & Poco (Top Ventas)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="cursor-pointer hover:underline">Ver todos</span>
            <div className="flex gap-1">
              <button className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grilla con Banner Vertical Izquierdo + 4 Tarjetas Blancas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Banner Vertical Izquierdo Promo */}
          <div className="md:col-span-3 bg-[#111827] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs border border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-[#00c853] uppercase tracking-wider block font-mono">
                XIAOMI SERIES
              </span>
              <h3 className="text-xl font-black mt-1">
                Redmi Note 13 Pro+ 5G
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Cámara 200MP OIS • Pantalla Curva 120Hz AMOLED • Carga 120W HyperCharge.
              </p>
            </div>

            <div className="py-4">
              <img 
                src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=350&q=80" 
                alt="Xiaomi"
                className="w-full h-44 object-contain rounded-xl"
              />
            </div>

            <button
              onClick={() => {
                const rn13 = PRODUCTOS_CATALOGO.find(p => p.id === "1450781");
                if (rn13) addToCart(rn13);
                setIsCartOpen(true);
              }}
              className="w-full py-2.5 rounded-full bg-[#00c853] hover:bg-[#00b34a] text-white text-xs font-extrabold text-center block shadow transition cursor-pointer active:scale-95"
            >
              AGREGAR AL CARRITO &gt;
            </button>
          </div>

          {/* 3 Tarjetas de Producto en Fondo Blanco (Formato Idéntico a Atacado Connect) */}
          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartphones.slice(0, 3).map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-[#00c853] transition shadow-xs group relative"
              >
                {/* Botón Favorito Arriba a la Derecha */}
                <button 
                  onClick={() => alert(`Favorito: ${prod.nombre}`)}
                  className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                </button>

                {/* Imagen del Producto en Fondo Blanco */}
                <div className="h-44 flex items-center justify-center p-2 mb-2">
                  <img
                    src={prod.img}
                    alt={prod.nombre}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                  />
                </div>

                {/* Información de Producto */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                    {prod.nombre}
                  </h4>
                  
                  <div className="text-[10px] text-slate-500 font-medium">
                    {prod.categoria} / <span className="text-[#00c853] font-bold">{prod.marca}</span>
                  </div>

                  {/* Precios: USD Grande en Verde y Guaraní Abajo */}
                  <div className="pt-2">
                    <div className="text-lg font-black text-[#00c853] font-mono leading-none">
                      U$ {prod.precioUsd.toFixed(2)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 font-mono mt-1">
                      G$ {prod.precioPyg.toLocaleString("es-PY")}
                    </div>
                  </div>
                </div>

                {/* Pie de Tarjeta: SKU con botón copiar + Botón Verde de Carrito */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => copiarSku(prod.id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-800 transition cursor-pointer"
                    title="Copiar código Atacado Connect"
                  >
                    <span>{prod.id}</span>
                    {copiedId === prod.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => addToCart(prod)}
                    className="w-8 h-8 rounded-lg bg-[#00c853] hover:bg-[#00b34a] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
                    title="Agregar al Carrito"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================================
          4. SECCIÓN GAMES & CONSOLAS PS5 / NINTENDO (IMAGEN 3 DEL USUARIO)
      ============================================================================== */}
      <section id="games" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
        
        {/* Barra de Título Verde */}
        <div className="bg-[#00c853] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Gamepad2 className="w-4 h-4" />
            <span>Games & Consolas (PS5 / Nintendo Switch OLED)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="cursor-pointer hover:underline">Ver todos</span>
            <div className="flex gap-1">
              <button className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carrusel / Grilla de 4 Tarjetas Blancas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-[#00c853] transition shadow-xs group relative"
            >
              <button className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition">
                <Heart className="w-4 h-4" />
              </button>

              <div className="h-44 flex items-center justify-center p-2 mb-2">
                <img
                  src={prod.img}
                  alt={prod.nombre}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                  {prod.nombre}
                </h4>
                
                <div className="text-[10px] text-slate-500 font-medium">
                  {prod.categoria} / <span className="text-[#00c853] font-bold">{prod.marca}</span>
                </div>

                <div className="pt-2">
                  <div className="text-lg font-black text-[#00c853] font-mono leading-none">
                    U$ {prod.precioUsd.toFixed(2)}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 font-mono mt-1">
                    G$ {prod.precioPyg.toLocaleString("es-PY")}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => copiarSku(prod.id)}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-800 transition"
                  title="Copiar código Atacado Connect"
                >
                  <span>{prod.id}</span>
                  {copiedId === prod.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => addToCart(prod)}
                  className="w-8 h-8 rounded-lg bg-[#00c853] hover:bg-[#00b34a] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
                  title="Agregar al Carrito"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================================
          5. SECCIÓN SMART TVS 32" Y 43" (ELECTRÓNICOS)
      ============================================================================== */}
      <section id="electronicos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
        
        <div className="bg-[#00c853] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Tv className="w-4 h-4" />
            <span>Smart TVs 32" y 43" (Google TV & 4K UHD)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="cursor-pointer hover:underline">Ver todos</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {televisores.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-[#00c853] transition shadow-xs group relative"
            >
              <button 
                onClick={() => alert(`Favorito: ${prod.nombre}`)}
                className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition cursor-pointer"
              >
                <Heart className="w-4 h-4" />
              </button>

              <div className="h-44 flex items-center justify-center p-2 mb-2">
                <img
                  src={prod.img}
                  alt={prod.nombre}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                  {prod.nombre}
                </h4>
                
                <div className="text-[10px] text-slate-500 font-medium">
                  {prod.categoria} / <span className="text-[#00c853] font-bold">{prod.marca}</span>
                </div>

                <div className="pt-2">
                  <div className="text-lg font-black text-[#00c853] font-mono leading-none">
                    U$ {prod.precioUsd.toFixed(2)}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 font-mono mt-1">
                    G$ {prod.precioPyg.toLocaleString("es-PY")}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => copiarSku(prod.id)}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-800 transition cursor-pointer"
                  title="Copiar código Atacado Connect"
                >
                  <span>{prod.id}</span>
                  {copiedId === prod.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => addToCart(prod)}
                  className="w-8 h-8 rounded-lg bg-[#00c853] hover:bg-[#00b34a] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
                  title="Agregar al Carrito"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================================
          6. SECCIÓN INFORMATIVA DE CONFIANZA Y LOGÍSTICA TSI EN PARAGUAY
      ============================================================================== */}
      <section className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 mt-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="p-2.5 rounded-xl bg-[#00c853]/10 text-[#00c853] shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Transportadora TSI Oficial</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Despacho en camión diario a las 13:00 PM desde Ciudad del Este. Cobertura en Asunción, Encarnación, Cnel. Oviedo y todo el país.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="p-2.5 rounded-xl bg-[#00c853]/10 text-[#00c853] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Cajas Selladas con Precinto</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Verificación física en tienda del precinto original de fábrica + precinto de seguridad holográfico con garantía de encendido de 48 hs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="p-2.5 rounded-xl bg-[#00c853]/10 text-[#00c853] shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Pago Seguro SIPAP Continental</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Transferencia bancaria directa a cuenta jurídica con RUC 4196328-8 en Banco Continental. Conciliación automática 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
          SECCIÓN DE CONTACTO & COTIZACIONES DIRECTAS (SISTEMA LAVAYA!)
      ============================================================================== */}
      <section id="contacto" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <ContactForm />
      </section>

      {/* ==============================================================================
          7. FOOTER INSTITUCIONAL COMPLETO
      ============================================================================== */}
      <footer className="bg-[#12161F] text-slate-400 py-10 px-4 sm:px-6 lg:px-8 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          <div className="space-y-3">
            <NexoLogo theme="dark" size="sm" />
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Concierge comercial en Ciudad del Este. Abastecimiento oficial con 5% de descuento en Atacado Connect y entrega a domicilio vía TSI.
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Ubicación y RUC</h5>
            <p className="text-slate-300 font-semibold">Ciudad del Este, Alto Paraná</p>
            <p>Avenida Amado Benítez Gamarra</p>
            <p className="font-mono text-emerald-400 font-bold">RUC: 4196328-8</p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Horario Operativo</h5>
            <p>Lunes a Sábado: 07:00 a 16:00 hs</p>
            <p className="text-slate-300">Despachos diarios a las 13:00 hs por TSI</p>
            <p className="text-emerald-400 font-medium">Recepción y acreditación SIPAP 24/7</p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Transporte & Alianzas</h5>
            <p>Agencia Oficial de Despacho: <strong>Transportadora San Ignacio (TSI)</strong></p>
            <p>Entidad Financiera: <strong>Banco Continental S.A.E.C.A.</strong></p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p className="flex items-center gap-1.5 text-slate-500">
            <span>© 2026 NEXO Concierge Comercial & Transporte • En alianza con Atacado Connect CDE.</span>
            {/* Acceso operativo camuflado imperceptible donde nadie tocaría */}
            <Link 
              href="/admin" 
              className="text-slate-800 hover:text-slate-600 transition inline-block p-0.5 opacity-20 hover:opacity-100" 
              title="Sistema"
            >
              <Lock className="w-2.5 h-2.5" />
            </Link>
          </p>
          <div className="flex gap-4">
            <Link href="/checkout" className="text-slate-400 hover:text-white">Checkout Seguro</Link>
            <button 
              onClick={() => customer ? setIsProfileOpen(true) : setIsAuthModalOpen(true)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {customer ? `Mi Cuenta (${customer.nombre.split(" ")[0]})` : "Iniciar Sesión"}
            </button>
          </div>
        </div>
      </footer>

      {/* Drawer del Carrito */}
      <CartDrawer />

      {/* Modal de Autenticación / Registro de Ticket */}
      <AuthModal />

      {/* Drawer de Perfil de Cliente, Compras Anteriores y Cambio de Seña */}
      <ProfileDrawer />

      {/* Notificación Toast Flotante */}
      {notificacion && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificacion}</span>
        </div>
      )}
    </div>
  );
}
