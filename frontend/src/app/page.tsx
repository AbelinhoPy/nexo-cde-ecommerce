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
  Lock,
  Layers,
  Camera,
  Tablet,
  Watch,
  X
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { ContactForm } from "@/components/ContactForm";
import { useCart } from "@/lib/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { ConciergeModal } from "@/components/ConciergeModal";
import { PuenteAmistadModal } from "@/components/PuenteAmistadModal";
import { 
  PRODUCTOS_CATALOGO, 
  CATEGORIAS_LISTA, 
  COTIZACION_DOLAR_PYG, 
  ProductoCatalogo 
} from "@/lib/catalogData";

export default function StorefrontPage() {
  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isPuenteOpen, setIsPuenteOpen] = useState(false);
  const [geoAlertaCde, setGeoAlertaCde] = useState(false);

  // Verificación de geolocalización automática: Detectar si el visitante está en CDE / Alto Paraná
  React.useEffect(() => {
    fetch("/api/geo/check")
      .then(res => res.json())
      .then(data => {
        if (data?.esZonaCde) {
          setGeoAlertaCde(true);
        }
      })
      .catch(() => {});
  }, []);

  const { 
    addToCart, 
    totalItems, 
    setIsCartOpen, 
    setIsAuthModalOpen, 
    setIsProfileOpen, 
    customer, 
    mostrarNotificacion 
  } = useCart();

  const copiarSku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedId(sku);
    mostrarNotificacion(`✓ Código ${sku} copiado`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorito = (prod: ProductoCatalogo) => {
    setFavoritos(prev => {
      const exists = prev.includes(prod.id);
      const next = exists ? prev.filter(x => x !== prod.id) : [...prev, prod.id];
      mostrarNotificacion(
        exists 
          ? `Removido de favoritos` 
          : `❤️ "${prod.nombre.slice(0, 32)}..." guardado en favoritos`
      );
      return next;
    });
  };

  // Filtrado reactivo de catálogo (por búsqueda, categoría o favoritos)
  const productosFiltrados = PRODUCTOS_CATALOGO.filter(p => {
    if (categoriaActiva === "favoritos") {
      return favoritos.includes(p.id);
    }
    const matchCat = categoriaActiva === "todos" || p.categoria.toLowerCase() === categoriaActiva.toLowerCase();
    const query = busqueda.trim().toLowerCase();
    const matchBusqueda = !query || 
      p.nombre.toLowerCase().includes(query) ||
      p.marca.toLowerCase().includes(query) ||
      p.categoria.toLowerCase().includes(query) ||
      p.id.includes(query);
    return matchCat && matchBusqueda;
  });

  const smartphones = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Smartphones");
  const games = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Games");
  const informatica = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Informática");
  const electronicos = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Electrónicos");
  const drones = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Drones");
  const audio = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Audio");
  const belleza = PRODUCTOS_CATALOGO.filter(p => p.categoria === "Belleza & Cuidado");

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] antialiased font-sans flex flex-col">
      {/* ==============================================================================
          1. HEADER CONNECT PARTNER + NEXO CONCIERGE
      ============================================================================== */}
      
      {/* Alerta de Geolocalización si entra alguien desde CDE / Alto Paraná */}
      {geoAlertaCde && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold py-2.5 px-4 border-b border-amber-600 flex items-center justify-between shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-base">📍</span>
            <span>
              <strong>Ubicación detectada en Ciudad del Este / Alto Paraná:</strong> NEXO CDE opera exclusivamente como servicio de despacho y encomiendas vía Transportadora TSI para clientes de Asunción y el Interior del país. No disponemos de retiro presencial ni salón de ventas en CDE.
            </span>
          </div>
          <button 
            onClick={() => setGeoAlertaCde(false)} 
            className="text-slate-950/70 hover:text-slate-950 p-1 cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Verde con Horario de Corte y Garantía */}
      <div className="bg-[#00c853] text-white text-[11px] font-semibold py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-white" />
              <strong>Corte Diario: 12:00 PM</strong> • Pagos SIPAP confirmados antes de las 12:00 se despachan a las 13:00 hs por TSI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/90">
              Servicio exclusivo para envíos al Interior de Paraguay vía TSI
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
          
          {/* Logo Oficial NEXO / Connect Partner */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="hover:opacity-90 transition">
              <NexoLogo theme="light" size="md" />
            </Link>
          </div>

          {/* Gran Buscador Verde Ovalado */}
          <div className="flex-1 max-w-2xl">
            <div className="relative flex items-center bg-[#00c853] rounded-full p-1 pl-4 shadow-sm">
              <input
                type="text"
                placeholder="¿Qué buscas? (ej. PS5 Slim, Redmi Note 13, TV 43', DJI Mini, AirPods)..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (categoriaActiva !== "todos") setCategoriaActiva("todos");
                }}
                className="w-full bg-transparent text-white placeholder-white/80 text-xs sm:text-sm font-medium focus:outline-none"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="p-1 rounded-full text-white/80 hover:text-white mr-1 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => {
                  const el = document.getElementById("catalogo-principal");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#00c853] hover:bg-slate-100 transition shrink-0 cursor-pointer shadow-xs"
              >
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
                G$ {COTIZACION_DOLAR_PYG.toLocaleString("es-PY")}
              </span>
            </div>

            {/* Selector de Moneda */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700">
              <span className="mr-1.5">🇵🇾</span>
              <span>Guaraní</span>
            </div>

            {/* Iconos de Acción (Favoritos, Usuario, Carrito) */}
            <div className="flex items-center gap-2">
              {/* Botón de Favoritos Funcional */}
              <button 
                onClick={() => {
                  if (favoritos.length === 0) {
                    mostrarNotificacion("Tu lista de favoritos está vacía. Tocá el corazón en cualquier producto para guardarlo.");
                  } else {
                    setCategoriaActiva("favoritos");
                    mostrarNotificacion(`Mostrando tus ${favoritos.length} productos favoritos`);
                    const el = document.getElementById("catalogo-principal");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer relative ${
                  favoritos.length > 0 
                    ? "border-rose-300 text-rose-500 bg-rose-50" 
                    : "border-slate-200 text-slate-600 hover:text-rose-500"
                }`}
                title={favoritos.length > 0 ? `Ver ${favoritos.length} Favoritos` : "Favoritos"}
              >
                <Heart className={`w-4 h-4 ${favoritos.length > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
                {favoritos.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {favoritos.length}
                  </span>
                )}
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

        {/* Submenú de Categorías con Botones Activos + Botón Cámara en Vivo */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs py-2 gap-3">
            <nav className="flex items-center gap-2 overflow-x-auto text-slate-700 font-semibold no-scrollbar py-1">
              {CATEGORIAS_LISTA.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoriaActiva(cat.id);
                    setBusqueda("");
                    const el = document.getElementById("catalogo-principal");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    categoriaActiva === cat.id
                      ? "bg-[#00c853] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{cat.nombre}</span>
                </button>
              ))}
            </nav>

            {/* Botón Cámara en Vivo del Puente de la Amistad */}
            <button
              onClick={() => setIsPuenteOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition shrink-0 cursor-pointer animate-pulse"
              title="Ver tráfico y cámaras de aduana en el Puente de la Amistad"
            >
              <Video className="w-3.5 h-3.5" />
              <span>CÁMARA EN VIVO DEL PUENTE</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==============================================================================
          2. BANNER PRINCIPAL Y SECCIÓN LATERAL PROMO (CONNECT PARTNER OFICIAL)
      ============================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Banner Principal Grande (9 cols) */}
          <div className="lg:col-span-9 bg-[#111827] rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[300px] sm:min-h-[320px] shadow-sm border border-slate-800">
            <div className="p-6 sm:p-10 max-w-lg z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00c853] text-white">
                <Truck className="w-3 h-3" />
                <span>Exclusivo para Envíos al Interior vía TSI</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight leading-tight">
                Comprá en Ciudad del Este <br />
                <span className="text-[#00c853]">al precio mayorista real</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Catálogo curado con los 100 productos de mayor rotación en Connect Partner CDE. Sin sobreprecios inflados de Asunción y con flete plano TSI a todo el interior del país.
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
                <button
                  onClick={() => setIsConciergeOpen(true)}
                  className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>¿Buscás otro producto? Pedilo aquí</span>
                </button>
              </div>
            </div>

            <div className="relative md:absolute md:right-0 md:top-0 md:bottom-0 w-full md:w-1/2 h-56 md:h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80"
                alt="PlayStation 5 y Gaming CDE"
                className="w-full h-full object-cover object-center opacity-90 hover:scale-102 transition duration-500"
              />
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/40 to-transparent"></div>
            </div>
          </div>

          {/* Banner Lateral Derecho (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl relative overflow-hidden shadow-sm border border-slate-200 group min-h-[300px] flex flex-col justify-end bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80"
              alt="Drones & Gaming CDE"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            <div className="relative z-10 p-5 space-y-2 text-white">
              <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#00c853] text-white">
                DRONES & GAMING
              </span>
              <h3 className="text-base font-black leading-snug">
                STOCK FÍSICO EN CONNECT PARTNER
              </h3>
              <p className="text-[11px] text-slate-300">
                Flete plano TSI: ₲35.000 (regular) y ₲50.000 (consolas y TVs).
              </p>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const drone = PRODUCTOS_CATALOGO.find(p => p.id === "1448671");
                    if (drone) addToCart(drone);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer"
                >
                  <span>Ver Oferta DJI Mini 4K</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Logística y Garantía TSI (Reemplazo visual moderno y armónico) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5 hover:border-emerald-500 transition group">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Flete Plano TSI</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                ₲ 35.000 (móviles/audio) y ₲ 50.000 (consolas/TVs). Envío asegurado a todo el interior.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5 hover:border-blue-500 transition group">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Corte 12:00 PM</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Pagos confirmados antes de las 12:00 salen hoy mismo a las 13:00 hs desde CDE.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5 hover:border-purple-500 transition group">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Boleta Sellada en Perfil</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Te subimos la foto real de la guía sellada en ventanilla TSI con número de rastreo.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5 hover:border-emerald-500 transition group">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">SIPAP Continental</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Cuenta oficial RUC 4196328-8 • Abel Núñez. Facturación legal y 100% trazable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
          3. CATÁLOGO PRINCIPAL Y RESULTADOS DE BÚSQUEDA DINÁMICA
      ============================================================================== */}
      <section id="catalogo-principal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
        
        {/* Barra de Título Verde con Selector de Categoría / Búsqueda */}
        <div className="bg-[#00c853] text-white px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Package className="w-4 h-4" />
            <span>
              {busqueda
                ? `Resultados para "${busqueda}" (${productosFiltrados.length})`
                : categoriaActiva === "favoritos"
                ? `Mis Productos Favoritos (${productosFiltrados.length})`
                : categoriaActiva === "todos"
                ? `Catálogo Top 100 Mayorista CDE (${PRODUCTOS_CATALOGO.length} productos)`
                : `${categoriaActiva} (${productosFiltrados.length} productos)`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {categoriaActiva !== "todos" && (
              <button
                onClick={() => {
                  setCategoriaActiva("todos");
                  setBusqueda("");
                }}
                className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-semibold transition cursor-pointer"
              >
                Ver todos (100)
              </button>
            )}

            <button
              onClick={() => setIsConciergeOpen(true)}
              className="px-3 py-1 rounded bg-white text-slate-900 font-bold hover:bg-slate-100 transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Pedir por Encargo</span>
            </button>
          </div>
        </div>

        {/* SI NO HAY RESULTADOS EN LA BÚSQUEDA: TARJETA CONCIERGE PROMINENTE */}
        {productosFiltrados.length === 0 ? (
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm my-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                No encontramos &ldquo;{busqueda}&rdquo; en el catálogo rápido
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ¡Pero no te preocupes! En Ciudad del Este tenemos acceso directo a más de 50.000 artículos en <strong>distribuidores mayoristas y tiendas de frontera</strong>.
              </p>
              <p className="text-xs text-emerald-700 font-semibold">
                Podemos buscarlo hoy mismo y pasarte el precio mayorista con flete TSI a tu localidad.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsConciergeOpen(true)}
                className="px-8 py-3.5 bg-[#00c853] hover:bg-[#00b34a] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Pedir &ldquo;{busqueda || "Producto"}&rdquo; por Encargo (Concierge CDE)</span>
              </button>
            </div>
          </div>
        ) : (
          /* GRILLA DE PRODUCTOS RESPONSIVA */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productosFiltrados.map((prod) => {
              const esFav = favoritos.includes(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-[#00c853] transition shadow-xs group relative"
                >
                  {/* Botón Favorito Funcional */}
                  <button 
                    onClick={() => toggleFavorito(prod)}
                    className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition cursor-pointer z-10"
                    title={esFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                  >
                    <Heart className={`w-4 h-4 ${esFav ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>

                  {/* Imagen y Datos del Producto con Enlace al Detalle en Nueva Pestaña */}
                  <Link 
                    href={`/producto/${prod.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block group/link"
                    title={`Ver especificaciones completas de ${prod.nombre} (abre en nueva pestaña)`}
                  >
                    <div className="h-44 flex items-center justify-center p-2 mb-2 relative">
                      <img
                        src={prod.img}
                        alt={prod.nombre}
                        className="max-h-full max-w-full object-contain group-hover/link:scale-105 transition duration-200"
                      />
                      {prod.precioRetailReferencia && (
                        <div className="absolute top-1 left-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          Ahorro Frontera
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover/link:text-[#00c853] transition flex items-start justify-between gap-1">
                        <span>{prod.nombre}</span>
                        <span className="text-[10px] text-slate-400 group-hover/link:text-[#00c853] shrink-0 font-normal">↗</span>
                      </h4>
                      
                      <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                        <span>{prod.categoria} / <strong className="text-[#00c853]">{prod.marca}</strong></span>
                        <span className="text-[9px] font-mono text-slate-400">Stock: {prod.stock}</span>
                      </div>

                      {/* Comparativa con Retail / Asunción (si existe) */}
                      {prod.precioRetailReferencia && (
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 line-through">
                            Asunción: ₲ {prod.precioRetailReferencia.toLocaleString("es-PY")}
                          </span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-1 rounded">
                            -₲ {(prod.precioRetailReferencia - prod.precioPyg).toLocaleString("es-PY")}
                          </span>
                        </div>
                      )}

                      {/* Precios: USD Grande en Verde y Guaraní Abajo */}
                      <div className="pt-1.5">
                        <div className="text-lg font-black text-[#00c853] font-mono leading-none">
                          U$ {prod.precioUsd.toFixed(2)}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 font-mono mt-1">
                          G$ {prod.precioPyg.toLocaleString("es-PY")}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Pie de Tarjeta: SKU con botón copiar + Botón Verde de Carrito */}
                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => copiarSku(prod.id)}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-800 transition cursor-pointer"
                      title="Copiar código del producto"
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
              );
            })}
          </div>
        )}

        {/* Tarjeta inferior permanente para solicitar productos especiales */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              <span>Concierge CDE Personalizado</span>
            </div>
            <h3 className="text-base font-black">
              ¿No encontrás la variante o el producto que buscás?
            </h3>
            <p className="text-xs text-slate-300">
              Te lo conseguimos en Ciudad del Este al precio de ventanilla mayorista. Escríbenos y te pasamos la cotización en minutos.
            </p>
          </div>

          <button
            onClick={() => setIsConciergeOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00b34a] text-white font-bold text-xs uppercase tracking-wider transition shadow cursor-pointer shrink-0"
          >
            Hacer Pedido por Encargo
          </button>
        </div>
      </section>

      {/* ==============================================================================
          4. SECCIÓN INFORMATIVA DE CONFIANZA Y LOGÍSTICA TSI EN PARAGUAY
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
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Comprobante Físico en tu Perfil</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Al despachar tu encomienda, subimos a tu perfil la foto del documento físico sellado y firmado por TSI para tu total tranquilidad.
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
                Transferencia bancaria directa a Banco Continental a nombre de Abel Nuñez Martinez (RUC 4196328-8).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
          5. FORMULARIO DE CONTACTO / CONSULTAS DIRECTAS
      ============================================================================== */}
      <section id="contacto" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <ContactForm />
      </section>

      {/* ==============================================================================
          6. FOOTER CON DATOS REALES DE CIUDAD DEL ESTE Y BOTÓN ADMIN CAMUFLADO
      ============================================================================== */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <NexoLogo theme="dark" size="sm" />
              <p className="text-slate-400 text-xs leading-relaxed">
                Intermediación mayorista y concierge comercial en Ciudad del Este. Compras directas de stock físico con flete plano garantizado por Transportadora TSI.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Categorías Populares
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button 
                    onClick={() => { setCategoriaActiva("Smartphones"); const el = document.getElementById("catalogo-principal"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Smartphones Xiaomi & iPhone
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setCategoriaActiva("Games"); const el = document.getElementById("catalogo-principal"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Consolas PlayStation 5 & Switch
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setCategoriaActiva("Informática"); const el = document.getElementById("catalogo-principal"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Notebooks & Tarjetas RTX
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setCategoriaActiva("Drones"); const el = document.getElementById("catalogo-principal"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Drones DJI Mini & Osmo Pocket
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setCategoriaActiva("Belleza & Cuidado"); const el = document.getElementById("catalogo-principal"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Perfumería Importada Original
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Ubicación & RUC
              </h4>
              <p className="text-slate-300">
                Avenida Amado Benítez Gamarra<br />
                Ciudad del Este, Alto Paraná, Paraguay<br />
                <strong>RUC:</strong> 4196328-8
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Despachos desde Agencia TSI Monseñor Rodríguez.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Atención & Horarios
              </h4>
              <p className="text-slate-300">
                Lunes a Sábado: 07:00 a 16:00 hs<br />
                Corte de Encomiendas: 12:00 PM<br />
                Salida de Camiones: 13:00 PM
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsConciergeOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pedir Cotización Especial</span>
                </button>
              </div>
            </div>
          </div>

          {/* Copyright y Acceso Operativo Discreto */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>© 2026 NEXO CDE Concierge Comercial. Todos los derechos reservados.</span>
              
              {/* Botón operativo camuflado en un candadito casi imperceptible */}
              <Link
                href="/admin"
                className="opacity-20 hover:opacity-100 transition p-1 text-slate-400 hover:text-white"
                title="Acceso Operativo"
              >
                <Lock className="w-2.5 h-2.5" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <span>Despachos vía Transportadora TSI</span>
              <span>•</span>
              <span>Pagos 100% SIPAP Continental</span>
            </div>
          </div>
        </div>
      </footer>

      {/* COMPONENTES MODALES Y DRAWERS */}
      <CartDrawer />
      <AuthModal />
      <ProfileDrawer />
      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        initialQuery={busqueda}
      />
      <PuenteAmistadModal
        isOpen={isPuenteOpen}
        onClose={() => setIsPuenteOpen(false)}
      />
    </div>
  );
}
