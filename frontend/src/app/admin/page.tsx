"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Package, 
  Truck, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Barcode, 
  Send, 
  ShieldCheck, 
  Layers, 
  Clock, 
  ArrowUpRight,
  ArrowLeft,
  Lock,
  KeyRound,
  LogOut,
  Camera,
  Eye,
  Sparkles,
  MessageSquare,
  X
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";

export default function AdminDashboardPage() {
  const [tabActiva, setTabActiva] = useState<"agenda" | "guias" | "concierge" | "metricas">("agenda");
  const [cargando, setCargando] = useState(false);

  // Estados de autenticación y PIN
  const [adminPin, setAdminPin] = useState<string>("");
  const [pinInput, setPinInput] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [verificandoPin, setVerificandoPin] = useState<boolean>(false);

  // Estados de datos
  const [agenda, setAgenda] = useState<any[]>([]);
  const [totalUsdTienda, setTotalUsdTienda] = useState(0);
  const [metricas, setMetricas] = useState<any>(null);
  const [solicitudesConcierge, setSolicitudesConcierge] = useState<any[]>([]);

  // Fotos de comprobantes TSI por pedido
  const [fotosMap, setFotosMap] = useState<Record<string, string>>({});
  const [fotoModalAdmin, setFotoModalAdmin] = useState<string | null>(null);

  // Estados para Registro de Guía TSI
  const [codigoPedidoInput, setCodigoPedidoInput] = useState("");
  const [numeroGuiaInput, setNumeroGuiaInput] = useState("");
  const [telefonoClienteInput, setTelefonoClienteInput] = useState("");
  const [mensajeGuiaStatus, setMensajeGuiaStatus] = useState<string | null>(null);

  // Pedidos listos para despacho (Mock demo inicial)
  const [pedidosPendientesDespacho, setPedidosPendientesDespacho] = useState<any[]>([
    {
      codigo: "CDE-20261109-9481",
      cliente: "Juan Carlos Bogado",
      telefono: "0983 123 456",
      destino: "Asunción",
      producto: "PlayStation 5 Slim 1TB",
      fletePyg: 50000,
      guia: ""
    },
    {
      codigo: "CDE-20261109-9482",
      cliente: "María Elena Portillo",
      telefono: "0971 889 012",
      destino: "Encarnación",
      producto: "Xiaomi Redmi Note 13 Pro+ 512GB",
      fletePyg: 35000,
      guia: ""
    },
    {
      codigo: "CDE-20261109-9494",
      cliente: "Rodrigo Benítez",
      telefono: "0981 445 221",
      destino: "Cnel. Oviedo",
      producto: "Smart TV Xiaomi Mi TV A Pro 43\"",
      fletePyg: 50000,
      guia: ""
    }
  ]);

  // Carga inicial: comprobar si ya hay PIN guardado en la sesión
  useEffect(() => {
    const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("nexo_admin_pin") : null;
    if (savedPin) {
      validarYEntrar(savedPin);
    }
  }, []);

  const validarYEntrar = async (pinAProbar: string) => {
    if (!pinAProbar.trim()) {
      setPinError("Por favor ingresa tu PIN.");
      return;
    }

    setVerificandoPin(true);
    setPinError(null);

    try {
      const res = await fetch("/api/admin/metrics", {
        headers: { "x-admin-pin": pinAProbar.trim() }
      });

      if (res.ok) {
        setAdminPin(pinAProbar.trim());
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("nexo_admin_pin", pinAProbar.trim());
        }
        cargarAgenda(pinAProbar.trim());
        cargarMetricas(pinAProbar.trim());
        cargarPedidosAdmin(pinAProbar.trim());
        cargarConcierge(pinAProbar.trim());
      } else {
        setIsAuthenticated(false);
        setPinError("PIN incorrecto. Revisa el valor configurado en ADMIN_ACCESS_PIN.");
      }
    } catch (e) {
      setPinError("Error de comunicación verificando credenciales.");
    } finally {
      setVerificandoPin(false);
    }
  };

  const handleCerrarSesion = () => {
    setIsAuthenticated(false);
    setAdminPin("");
    setPinInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("nexo_admin_pin");
    }
  };

  const cargarAgenda = async (pinActivo = adminPin) => {
    try {
      const res = await fetch("/api/admin/agenda", {
        headers: { "x-admin-pin": pinActivo }
      });
      const data = await res.json();
      if (data.success) {
        setAgenda(data.items);
        setTotalUsdTienda(data.total_usd_caja_tienda);
      }
    } catch (e) {
      console.error("Error cargando agenda:", e);
    }
  };

  const cargarMetricas = async (pinActivo = adminPin) => {
    try {
      const res = await fetch("/api/admin/metrics", {
        headers: { "x-admin-pin": pinActivo }
      });
      const data = await res.json();
      if (data.success) {
        setMetricas(data);
      }
    } catch (e) {
      console.error("Error cargando métricas:", e);
    }
  };

  const cargarPedidosAdmin = async (pinActivo = adminPin) => {
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { "x-admin-pin": pinActivo }
      });
      const data = await res.json();
      if (data.success && data.pedidos && data.pedidos.length > 0) {
        setPedidosPendientesDespacho(data.pedidos);
      }
    } catch (e) {
      console.error("Error cargando pedidos:", e);
    }
  };

  const cargarConcierge = async (pinActivo = adminPin) => {
    try {
      const res = await fetch("/api/admin/concierge", {
        headers: { "x-admin-pin": pinActivo }
      });
      const data = await res.json();
      if (data.success && data.solicitudes) {
        setSolicitudesConcierge(data.solicitudes);
      }
    } catch (e) {
      console.error("Error cargando concierge:", e);
    }
  };

  const handleFotoSelect = (codigo: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotosMap(prev => ({ ...prev, [codigo]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const registrarGuiaTsi = async (codigo: string, guia: string, telefono: string, cliente: string) => {
    if (!guia.trim()) {
      alert("Por favor ingrese o escanee el número de guía de TSI.");
      return;
    }

    setCargando(true);
    setMensajeGuiaStatus(null);

    try {
      const res = await fetch("/api/admin/tsi-guia", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": adminPin
        },
        body: JSON.stringify({
          codigoPedido: codigo,
          numeroGuiaTsi: guia,
          telefonoCliente: telefono,
          nombreCliente: cliente,
          fotoGuiaTsi: fotosMap[codigo] || null
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMensajeGuiaStatus(`✓ Guía ${guia.toUpperCase()} y comprobante físico vinculados a ${codigo}.`);
        setPedidosPendientesDespacho(prev =>
          prev.map(p => (p.codigo === codigo ? { ...p, guia: guia.toUpperCase(), fotoGuiaTsi: fotosMap[codigo] || p.fotoGuiaTsi } : p))
        );
        setCodigoPedidoInput("");
        setNumeroGuiaInput("");
      } else {
        alert(data.error || "Error vinculando la guía.");
      }
    } catch (err) {
      alert("Error de comunicación con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 antialiased p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-7 h-7" />
            </div>
            <NexoLogo theme="dark" size="sm" />
            <h1 className="text-xl font-black text-white tracking-tight">Panel Administrativo Privado</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acceso restringido para conciliación bancaria SIPAP, agenda de compras y métricas de ganancias netas.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              validarYEntrar(pinInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                PIN de Administrador (4 dígitos)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono text-white placeholder-slate-600 outline-none transition"
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                PIN por defecto: <span className="font-mono text-slate-400">4196</span> (o configurado en <code className="text-emerald-400">ADMIN_ACCESS_PIN</code>)
              </p>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              disabled={verificandoPin || !pinInput.trim()}
              className="w-full bg-[#00c853] hover:bg-[#00b34a] disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-sm"
            >
              {verificandoPin ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Desbloquear Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Tienda Pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Barra Superior de Control */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Tienda
              </Link>
              <span className="text-slate-600">|</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                Panel Operativo CDE
              </span>
            </div>
            <div className="pt-1">
              <NexoLogo theme="dark" size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Pestañas */}
            <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setTabActiva("agenda")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "agenda"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Package className="w-4 h-4" />
                Agenda de Compras
              </button>

              <button
                onClick={() => setTabActiva("guias")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "guias"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Barcode className="w-4 h-4" />
                Guías TSI
              </button>

              <button
                onClick={() => setTabActiva("concierge")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "concierge"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Solicitudes Concierge ({solicitudesConcierge.length})
              </button>

              <button
                onClick={() => setTabActiva("metricas")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "metricas"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Métricas Financieras
              </button>
            </div>

            <button
              onClick={handleCerrarSesion}
              title="Cerrar Sesión Segura"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* TAB 1: AGENDA DE COMPRAS DEL DÍA (CONNECT PARTNER) */}
        {tabActiva === "agenda" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Banner de Total Requerido en Tienda */}
            <div className="bg-gradient-to-r from-indigo-900/60 to-slate-800 p-6 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold block">
                  Caja Requerida para Connect Partner (Mañana)
                </span>
                <div className="text-3xl font-black text-white font-mono mt-0.5">
                  US$ {totalUsdTienda.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Precios calculados con el 5% de descuento de partner ya aplicado sobre costo de lista.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-right">
                  <span className="text-[10px] text-slate-400 block">Hora de Retiro Recomendada</span>
                  <span className="text-sm font-bold text-amber-400">09:00 AM - 11:00 AM</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-right">
                  <span className="text-[10px] text-slate-400 block">Hora Límite Despacho TSI</span>
                  <span className="text-sm font-bold text-emerald-400">13:00 PM (1:00 PM)</span>
                </div>
              </div>
            </div>

            {/* Tabla Consolidada de Productos a Comprar */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Lista Consolidada de Artículos por Proveedor
                </h3>
                <span className="text-xs text-slate-400">
                  {agenda.length} líneas de producto a comprar hoy
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Producto & SKU</th>
                      <th className="py-3 px-4 text-center">Cantidad</th>
                      <th className="py-3 px-4 text-right">Costo Neto Unit. (USD)</th>
                      <th className="py-3 px-4 text-right">Subtotal Requerido (USD)</th>
                      <th className="py-3 px-4">Pedidos Asociados</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {agenda.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-750/50 transition">
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{item.producto_nombre}</div>
                          <div className="text-slate-400 font-mono text-xs">{item.sku}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-400 font-mono text-base">
                          {item.cantidad_total_a_comprar}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          US$ {item.costo_unitario_neto_usd.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          US$ {item.total_usd_necesario_tienda.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-xs max-w-xs truncate">
                          {item.pedidos_asociados}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.comprado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle className="w-3.5 h-3.5" /> En Mano
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5" /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRO DE GUÍAS TSI Y NOTIFICACIÓN AL CLIENTE */}
        {tabActiva === "guias" && (
          <div className="space-y-6 animate-fadeIn">
            {mensajeGuiaStatus && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{mensajeGuiaStatus}</span>
              </div>
            )}

            {/* Listado de Pedidos Pendientes de Guía */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Despacho de Pedidos Liquidados (TSI Ciudad del Este)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Al escanear o registrar la guía de TSI, el sistema notifica de inmediato al WhatsApp del destinatario.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {pedidosPendientesDespacho.filter(p => !p.guia).length} Pendientes de Despacho
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Destinatario & Teléfono</th>
                      <th className="py-3 px-4">Destino</th>
                      <th className="py-3 px-4">Flete Cobrado</th>
                      <th className="py-3 px-4">Número de Guía TSI</th>
                      <th className="py-3 px-4">Comprobante Físico TSI</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {pedidosPendientesDespacho.map((pedido) => (
                      <tr key={pedido.codigo} className="hover:bg-slate-750/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {pedido.codigo}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{pedido.cliente}</div>
                          <div className="text-slate-400 text-xs">{pedido.telefono}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {pedido.ciudad ? `${pedido.ciudad}, ${pedido.departamento || ""}` : pedido.destino}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                          ₲ {pedido.fletePyg?.toLocaleString("es-PY")}
                        </td>
                        <td className="py-3.5 px-4">
                          {pedido.guia ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs">
                              {pedido.guia}
                            </span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Escanear Guía TSI..."
                              defaultValue={pedido.guia}
                              id={`input-${pedido.codigo}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-44"
                            />
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {pedido.fotoGuiaTsi ? (
                            <button
                              onClick={() => setFotoModalAdmin(pedido.fotoGuiaTsi)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs hover:bg-emerald-900/60 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Foto</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-xs flex items-center gap-1.5 text-slate-300 transition">
                                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{fotosMap[pedido.codigo] ? "✓ Foto Lista" : "📷 Foto TSI"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handleFotoSelect(pedido.codigo, e)}
                                />
                              </label>
                              {fotosMap[pedido.codigo] && (
                                <button
                                  onClick={() => setFotosMap(prev => {
                                    const next = { ...prev };
                                    delete next[pedido.codigo];
                                    return next;
                                  })}
                                  className="p-1 rounded text-rose-400 hover:bg-rose-950/50"
                                  title="Quitar foto"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {pedido.guia ? (
                            <span className="text-[11px] text-emerald-400 font-semibold">✓ Despachado</span>
                          ) : (
                            <button
                              onClick={() => {
                                const inputEl = document.getElementById(`input-${pedido.codigo}`) as HTMLInputElement;
                                if (inputEl) {
                                  registrarGuiaTsi(
                                    pedido.codigo,
                                    inputEl.value,
                                    pedido.telefono,
                                    pedido.cliente
                                  );
                                }
                              }}
                              disabled={cargando}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 mx-auto cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Despachar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOLICITUDES ESPECIALES CONCIERGE (ENCARGOS FUERA DE CATÁLOGO) */}
        {tabActiva === "concierge" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Solicitudes de Pedidos Especiales (Concierge CDE)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Artículos solicitados por clientes que no estaban en el catálogo web. Cotízalos con Connect Partner y contáctalos por WhatsApp.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {solicitudesConcierge.length} Solicitudes
                </span>
              </div>

              {solicitudesConcierge.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No hay solicitudes de productos especiales pendientes por el momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Teléfono WhatsApp</th>
                        <th className="py-3 px-4">Producto Solicitado</th>
                        <th className="py-3 px-4">Ciudad Destino</th>
                        <th className="py-3 px-4">Link / Referencia</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {solicitudesConcierge.map((sol) => (
                        <tr key={sol.id} className="hover:bg-slate-750/50 transition">
                          <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                            {new Date(sol.created_at).toLocaleDateString("es-PY")}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {sol.nombre}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                            {sol.telefono}
                          </td>
                          <td className="py-3.5 px-4 text-slate-200 font-medium">
                            {sol.producto_solicitado}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {sol.ciudad_destino || "No especificada"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-indigo-400 max-w-xs truncate">
                            {sol.link_referencia ? (
                              <a href={sol.link_referencia} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {sol.link_referencia}
                              </a>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <a
                              href={`https://wa.me/${sol.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${sol.nombre}, te saluda Abel de NEXO CDE. Recibí tu solicitud para conseguirte: "${sol.producto_solicitado}". Ya verifiqué stock en Ciudad del Este y te paso la cotización mayorista con flete TSI:`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Contactar WhatsApp
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MÉTRICAS FINANCIERAS Y GANANCIA NETA */}
        {tabActiva === "metricas" && metricas && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">
                  Total Recaudado (SIPAP)
                </span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  ₲ {metricas.resumen.totalRecaudadoPyg.toLocaleString("es-PY")}
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                  <ArrowUpRight className="w-3 h-3" /> {metricas.resumen.pedidosLiquidados} pedidos pagados
                </span>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">
                  Costo en Connect Partner
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
                  US$ {metricas.resumen.costoMercaderiaUsd.toLocaleString("en-US")}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  ₲ {metricas.resumen.costoMercaderiaPyg.toLocaleString("es-PY")} (neto -5%)
                </span>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">
                  Fletes TSI (Cobrado vs Real)
                </span>
                <span className="text-2xl font-black text-slate-200 font-mono mt-1 block">
                  ₲ {metricas.resumen.fletesCobradosPyg.toLocaleString("es-PY")}
                </span>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  Costo real: ₲ {metricas.resumen.fletesCostoRealTsiPyg.toLocaleString("es-PY")} (superávit flete)
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-800 p-5 rounded-2xl border border-emerald-500/40">
                <span className="text-xs text-emerald-400 font-bold uppercase block">
                  Ganancia Neta Consolidada
                </span>
                <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
                  ₲ {metricas.resumen.gananciaNetaPyg.toLocaleString("es-PY")}
                </span>
                <span className="text-[11px] text-emerald-400/90 font-bold block mt-1">
                  Margen Neto: {metricas.resumen.margenNetoPct}% sobre ventas
                </span>
              </div>
            </div>

            {/* Desglose Temporal y Cotizaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Desglose Día / Semana / Mes (7 cols) */}
              <div className="lg:col-span-7 bg-slate-800/60 p-6 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-bold text-white text-base">
                  Rendimiento Consolidado por Período
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-750">
                    <span className="text-xs text-slate-400 block font-medium">Hoy</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">
                      ₲ {metricas.desglose.hoy.gananciaNetaPyg.toLocaleString("es-PY")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {metricas.desglose.hoy.pedidos} pedidos liquidados
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-750">
                    <span className="text-xs text-slate-400 block font-medium">Esta Semana</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">
                      ₲ {metricas.desglose.estaSemana.gananciaNetaPyg.toLocaleString("es-PY")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {metricas.desglose.estaSemana.pedidos} pedidos liquidados
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-750">
                    <span className="text-xs text-slate-400 block font-medium">Este Mes</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">
                      ₲ {metricas.desglose.esteMes.gananciaNetaPyg.toLocaleString("es-PY")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {metricas.desglose.esteMes.pedidos} pedidos liquidados
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Fluctuación de Cotización CDE (5 cols) */}
              <div className="lg:col-span-5 bg-slate-800/60 p-6 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="font-bold text-white text-base">
                  Historial de Cotización CDE
                </h3>
                <p className="text-xs text-slate-400">
                  Pizarra venta mayorista CDE + colchón de seguridad (₲80-100).
                </p>

                <div className="space-y-2">
                  {metricas.historial_cotizacion.map((cot: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400 font-mono">{cot.fecha}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Pizarra: ₲{cot.pizarra_cde}</span>
                        <span className="text-amber-400">+{cot.colchon}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          = ₲{cot.efectiva}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL LIGHTBOX FOTO TSI ADMIN */}
      {fotoModalAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFotoModalAdmin(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Comprobante Físico de Ventanilla TSI (CDE)</h3>
              </div>
              <button
                onClick={() => setFotoModalAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-black/50 rounded-xl p-2 min-h-[300px]">
              <img
                src={fotoModalAdmin}
                alt="Comprobante TSI"
                className="max-h-[65vh] max-w-full rounded-lg object-contain shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
