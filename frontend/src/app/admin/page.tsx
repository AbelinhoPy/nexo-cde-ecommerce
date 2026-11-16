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
  X,
  Mail,
  RotateCcw,
  MapPin,
  Plus,
  Edit,
  Save,
  CheckCircle2
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";

export default function AdminDashboardPage() {
  const [tabActiva, setTabActiva] = useState<"agenda" | "guias" | "destinos" | "concierge" | "metricas">("agenda");
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
  const [pedidosAdmin, setPedidosAdmin] = useState<any[]>([]);

  // Destinos TSI
  const [destinosTsi, setDestinosTsi] = useState<any[]>([]);
  const [filtroDepto, setFiltroDepto] = useState<string>("");
  const [modalDestino, setModalDestino] = useState<any | null>(null);
  const [guardandoDestino, setGuardandoDestino] = useState(false);

  // Fotos de comprobantes TSI por pedido
  const [fotosMap, setFotosMap] = useState<Record<string, string>>({});
  const [guiasInputMap, setGuiasInputMap] = useState<Record<string, string>>({});
  const [fotoModalAdmin, setFotoModalAdmin] = useState<string | null>(null);

  const [mensajeGuiaStatus, setMensajeGuiaStatus] = useState<string | null>(null);
  const [operacionStatus, setOperacionStatus] = useState<string | null>(null);

  // Carga inicial
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
        cargarDestinosAdmin(pinAProbar.trim());
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
      if (data.success && data.pedidos) {
        setPedidosAdmin(data.pedidos);
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

  const cargarDestinosAdmin = async (pinActivo = adminPin) => {
    try {
      const res = await fetch("/api/admin/destinos", {
        headers: { "x-admin-pin": pinActivo }
      });
      const data = await res.json();
      if (data.success && data.destinos) {
        setDestinosTsi(data.destinos);
      }
    } catch (e) {
      console.error("Error cargando destinos TSI:", e);
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

  // Transición de estado del pedido
  const cambiarEstadoPedido = async (codigo: string, nuevoEstado: string, guiaExtra?: string, fotoExtra?: string) => {
    setCargando(true);
    setOperacionStatus(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": adminPin
        },
        body: JSON.stringify({
          codigoPedido: codigo,
          nuevoEstado,
          numeroGuiaTsi: guiaExtra,
          fotoGuiaTsi: fotoExtra
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOperacionStatus(`✓ Pedido #${codigo} actualizado a «${nuevoEstado}».`);
        await cargarPedidosAdmin();
      } else {
        alert(data.error || "No se pudo actualizar el estado del pedido.");
      }
    } catch (err) {
      alert("Error de comunicación con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Reintento de envío de correo de aviso al administrador
  const reintentarAvisoAdmin = async (codigo: string) => {
    setCargando(true);
    setOperacionStatus(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": adminPin
        },
        body: JSON.stringify({
          action: "retry-email",
          codigoPedido: codigo
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOperacionStatus(`✓ Aviso por correo reenviado exitosamente para #${codigo}.`);
        await cargarPedidosAdmin();
      } else {
        alert(data.error || "Error al reenviar el aviso.");
      }
    } catch (err) {
      alert("Error de conexión al reenviar aviso.");
    } finally {
      setCargando(false);
    }
  };

  // Guardar o actualizar destino TSI
  const handleGuardarDestino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDestino) return;
    setGuardandoDestino(true);

    try {
      const res = await fetch("/api/admin/destinos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": adminPin,
        },
        body: JSON.stringify(modalDestino),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModalDestino(null);
        await cargarDestinosAdmin();
        setOperacionStatus("✓ Destino y tarifas TSI actualizados exitosamente.");
      } else {
        alert(data.error || "Error al guardar destino.");
      }
    } catch {
      alert("Error de comunicación.");
    } finally {
      setGuardandoDestino(false);
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
              Acceso restringido para control de despacho TSI, conciliación SIPAP y tarifas.
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
                PIN por defecto: <span className="font-mono text-slate-400">4196</span>
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
              className="w-full bg-[#00c853] hover:bg-[#00b34a] disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
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

  const destinosFiltrados = filtroDepto
    ? destinosTsi.filter(d => d.departamento.toLowerCase() === filtroDepto.toLowerCase())
    : destinosTsi;

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
            <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 flex-wrap gap-1">
              <button
                onClick={() => setTabActiva("agenda")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "agenda"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Agenda Compras
              </button>

              <button
                onClick={() => setTabActiva("guias")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "guias"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                Despacho & Guías ({pedidosAdmin.length})
              </button>

              <button
                onClick={() => setTabActiva("destinos")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "destinos"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Destinos & Tarifas TSI ({destinosTsi.length})
              </button>

              <button
                onClick={() => setTabActiva("concierge")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "concierge"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Concierge ({solicitudesConcierge.length})
              </button>

              <button
                onClick={() => setTabActiva("metricas")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === "metricas"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Métricas
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

        {operacionStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
            <span className="font-semibold">{operacionStatus}</span>
            <button onClick={() => setOperacionStatus(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: AGENDA DE COMPRAS DEL DÍA */}
        {tabActiva === "agenda" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-r from-indigo-900/60 to-slate-800 p-6 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold block">
                  Caja Requerida para Connect Partner (Mañana)
                </span>
                <div className="text-3xl font-black text-white font-mono mt-0.5">
                  US$ {totalUsdTienda.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Precios calculados con el 5% de descuento mayorista sobre costo de lista.
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTROL DE DESPACHO & ESTADOS TSI (5 FASES) */}
        {tabActiva === "guias" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    Control de Flujo de Pedidos & Despachos TSI
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Flujo oficial: Pendiente de pago → Pagado → Preparando envío → Enviado (Guía + Foto obligatoria) → Entregado.
                  </p>
                </div>
                <button
                  onClick={() => cargarPedidosAdmin()}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Actualizar Pedidos
                </button>
              </div>

              {pedidosAdmin.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No hay pedidos registrados en la base de datos por el momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Código & Aviso</th>
                        <th className="py-3 px-3">Cliente & Contacto</th>
                        <th className="py-3 px-3">Destino & Modalidad</th>
                        <th className="py-3 px-3 text-right">Total (PYG)</th>
                        <th className="py-3 px-3 text-center">Estado Actual</th>
                        <th className="py-3 px-3">Guía TSI & Foto</th>
                        <th className="py-3 px-3 text-center">Acción de Flujo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {pedidosAdmin.map((ped) => {
                        const estado = String(ped.estado || "").toUpperCase();
                        const fotoActiva = fotosMap[ped.codigo] || ped.fotoGuiaTsi;
                        const guiaActiva = guiasInputMap[ped.codigo] !== undefined ? guiasInputMap[ped.codigo] : (ped.guia || "");

                        return (
                          <tr key={ped.id || ped.codigo} className="hover:bg-slate-750/50 transition">
                            {/* Código y Aviso Admin */}
                            <td className="py-3 px-3 align-top font-mono">
                              <span className="font-bold text-white block text-xs">#{ped.codigo}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {new Date(ped.createdAt).toLocaleDateString("es-PY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>

                              {/* Trazabilidad de Correo al Admin (Requisito 1) */}
                              <div className="mt-1.5">
                                {ped.notificacionAdminEnviada ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    <CheckCircle className="w-2.5 h-2.5" /> Aviso enviado
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Aviso pendiente
                                    </span>
                                    <button
                                      onClick={() => reintentarAvisoAdmin(ped.codigo)}
                                      disabled={cargando}
                                      className="block text-[10px] text-indigo-300 hover:text-white underline font-semibold cursor-pointer"
                                    >
                                      Reintentar aviso
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Cliente */}
                            <td className="py-3 px-3 align-top">
                              <div className="font-bold text-white">{ped.cliente}</div>
                              <div className="text-slate-400 font-mono text-[11px]">CI: {ped.ci || "—"}</div>
                              <div className="text-emerald-400 font-mono text-[11px]">{ped.telefono}</div>
                              {ped.email && <div className="text-slate-400 text-[10px] truncate max-w-[130px]">{ped.email}</div>}
                            </td>

                            {/* Destino */}
                            <td className="py-3 px-3 align-top">
                              <div className="font-semibold text-slate-200">
                                {ped.ciudad}, {ped.departamento}
                              </div>
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                                {ped.modalidad === "AGENCIA" ? "Retiro en Agencia" : "A Domicilio"}
                              </span>
                              <div className="text-slate-400 text-[11px] italic truncate max-w-[160px] mt-0.5">
                                {ped.direccion}
                              </div>
                            </td>

                            {/* Total & Flete */}
                            <td className="py-3 px-3 align-top text-right font-mono">
                              <div className="font-bold text-white text-xs">
                                ₲ {ped.totalPyg?.toLocaleString("es-PY")}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Flete: ₲ {ped.fletePyg?.toLocaleString("es-PY")}
                              </div>
                            </td>

                            {/* Estado Actual */}
                            <td className="py-3 px-3 align-top text-center">
                              {estado === "PENDIENTE" && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Pendiente Pago
                                </span>
                              )}
                              {estado === "PAGADO" && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Pagado SIPAP
                                </span>
                              )}
                              {estado === "PREPARANDO_ENVIO" && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Preparando Envío
                                </span>
                              )}
                              {(estado === "ENVIADO" || estado === "DESPACHADO_TSI") && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Enviado por TSI
                                </span>
                              )}
                              {estado === "ENTREGADO" && (
                                <div className="space-y-0.5">
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40">
                                    ✓ Entregado
                                  </span>
                                  {ped.fechaConfirmacionEntrega && (
                                    <span className="block text-[9px] text-slate-400">
                                      Confirmado {new Date(ped.fechaConfirmacionEntrega).toLocaleDateString("es-PY")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Guía y Foto Comprobante */}
                            <td className="py-3 px-3 align-top space-y-1.5">
                              {/* Campo de Guía */}
                              {ped.guia ? (
                                <span className="block px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono font-bold text-white text-xs text-center">
                                  {ped.guia}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="N° Guía TSI..."
                                  value={guiaActiva}
                                  onChange={(e) => setGuiasInputMap({ ...guiasInputMap, [ped.codigo]: e.target.value })}
                                  className="w-32 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                              )}

                              {/* Foto de comprobante */}
                              {ped.fotoGuiaTsi ? (
                                <button
                                  type="button"
                                  onClick={() => setFotoModalAdmin(ped.fotoGuiaTsi)}
                                  className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] hover:bg-emerald-900/60 transition cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Ver Comprobante</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <label className="cursor-pointer flex-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-[11px] flex items-center justify-center gap-1 text-slate-300 transition">
                                    <Camera className="w-3 h-3 text-emerald-400" />
                                    <span>{fotosMap[ped.codigo] ? "✓ Foto Lista" : "Foto TSI"}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => handleFotoSelect(ped.codigo, e)}
                                    />
                                  </label>
                                  {fotosMap[ped.codigo] && (
                                    <button
                                      onClick={() => setFotosMap(prev => {
                                        const next = { ...prev };
                                        delete next[ped.codigo];
                                        return next;
                                      })}
                                      className="p-1 text-rose-400 hover:bg-rose-950/50 rounded"
                                      title="Quitar"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Acciones de Transición de Flujo */}
                            <td className="py-3 px-3 align-top text-center space-y-1">
                              {estado === "PENDIENTE" && (
                                <button
                                  onClick={() => cambiarEstadoPedido(ped.codigo, "PAGADO")}
                                  disabled={cargando}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition shadow cursor-pointer"
                                >
                                  ✓ Confirmar Pago
                                </button>
                              )}

                              {estado === "PAGADO" && (
                                <button
                                  onClick={() => cambiarEstadoPedido(ped.codigo, "PREPARANDO_ENVIO")}
                                  disabled={cargando}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition shadow cursor-pointer"
                                >
                                  📦 Preparar Envío
                                </button>
                              )}

                              {(estado === "PREPARANDO_ENVIO" || (!ped.guia && estado === "PAGADO")) && (
                                <div className="space-y-1">
                                  <button
                                    onClick={() => {
                                      if (!guiaActiva.trim()) {
                                        alert("Ingresa el número de guía TSI.");
                                        return;
                                      }
                                      if (!fotoActiva) {
                                        alert("Es obligatorio adjuntar la foto del comprobante físico para marcar como Enviado.");
                                        return;
                                      }
                                      cambiarEstadoPedido(ped.codigo, "ENVIADO", guiaActiva, fotoActiva);
                                    }}
                                    disabled={cargando || !guiaActiva.trim() || !fotoActiva}
                                    className={`w-full px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition shadow flex items-center justify-center gap-1 ${
                                      guiaActiva.trim() && fotoActiva
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                        : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                                    }`}
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Marcar Enviado</span>
                                  </button>
                                  {(!guiaActiva.trim() || !fotoActiva) && (
                                    <span className="text-[9px] text-amber-400 block">
                                      Guía y foto requeridas
                                    </span>
                                  )}
                                </div>
                              )}

                              {(estado === "ENVIADO" || estado === "DESPACHADO_TSI") && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-emerald-400 font-semibold block">
                                    En camino TSI
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿Marcar manualmente el pedido #${ped.codigo} como entregado?`)) {
                                        cambiarEstadoPedido(ped.codigo, "ENTREGADO");
                                      }
                                    }}
                                    disabled={cargando}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                                  >
                                    Confirmar Entrega
                                  </button>
                                </div>
                              )}

                              {estado === "ENTREGADO" && (
                                <span className="text-[11px] text-emerald-400 font-bold">
                                  ✓ Completado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DESTINOS Y TARIFAS TSI (EDITABLE) */}
        {tabActiva === "destinos" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Destinos Habilitados y Tarifas TSI Paraguay
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fuente oficial: <strong>Tarifario Corporativo Transportadora TSI - Noviembre 2026</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={filtroDepto}
                    onChange={(e) => setFiltroDepto(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                  >
                    <option value="">Todos los departamentos ({destinosTsi.length})</option>
                    {Array.from(new Set(destinosTsi.map(d => d.departamento))).map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setModalDestino({
                      departamento: "Central",
                      ciudad: "",
                      agenciaNombre: "",
                      modalidad: "DOMICILIO_Y_AGENCIA",
                      fleteRegularPyg: 35000,
                      fletePesadoPyg: 50000,
                      coberturaHabilitada: true,
                      tiempoEstimado: "24 a 48 hs",
                      observaciones: ""
                    })}
                    className="px-3.5 py-1.5 rounded-lg bg-[#00c853] hover:bg-[#00b34a] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Destino TSI</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Departamento</th>
                      <th className="py-3 px-3">Ciudad / Localidad</th>
                      <th className="py-3 px-3">Agencia Cabecera</th>
                      <th className="py-3 px-3">Modalidad</th>
                      <th className="py-3 px-3 text-right">Flete Regular</th>
                      <th className="py-3 px-3 text-right">Flete Pesado</th>
                      <th className="py-3 px-3 text-center">Cobertura</th>
                      <th className="py-3 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {destinosFiltrados.map((d) => (
                      <tr key={d.id || `${d.departamento}-${d.ciudad}`} className="hover:bg-slate-750/50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-300">
                          {d.departamento}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {d.ciudad}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {d.agencia_nombre || d.agenciaNombre || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">
                            {d.modalidad === "DOMICILIO_Y_AGENCIA" ? "Ambos" : d.modalidad === "AGENCIA" ? "Agencia" : "Domicilio"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {d.flete_regular_pyg !== null && d.flete_regular_pyg !== undefined ? (
                            <span className="text-emerald-400">₲ {Number(d.flete_regular_pyg).toLocaleString("es-PY")}</span>
                          ) : (
                            <span className="text-amber-400 text-[10px] font-bold">A cotizar</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {d.flete_pesado_pyg !== null && d.flete_pesado_pyg !== undefined ? (
                            <span className="text-emerald-400">₲ {Number(d.flete_pesado_pyg).toLocaleString("es-PY")}</span>
                          ) : (
                            <span className="text-amber-400 text-[10px] font-bold">A cotizar</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {d.cobertura_habilitada || d.coberturaHabilitada ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              Habilitado
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              Sin cobertura
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setModalDestino({
                              id: d.id,
                              departamento: d.departamento,
                              ciudad: d.ciudad,
                              agenciaNombre: d.agencia_nombre || d.agenciaNombre || "",
                              modalidad: d.modalidad || "DOMICILIO_Y_AGENCIA",
                              fleteRegularPyg: d.flete_regular_pyg ?? "",
                              fletePesadoPyg: d.flete_pesado_pyg ?? "",
                              coberturaHabilitada: Boolean(d.cobertura_habilitada ?? d.coberturaHabilitada),
                              tiempoEstimado: d.tiempo_estimado || d.tiempoEstimado || "24 a 48 hs",
                              observaciones: d.observaciones || ""
                            })}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Editar destino"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOLICITUDES CONCIERGE */}
        {tabActiva === "concierge" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Solicitudes Concierge CDE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Artículos solicitados por clientes fuera del catálogo web.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {solicitudesConcierge.length} Solicitudes
                </span>
              </div>

              {solicitudesConcierge.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No hay solicitudes de productos especiales pendientes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Teléfono</th>
                        <th className="py-3 px-4">Producto Solicitado</th>
                        <th className="py-3 px-4">Ciudad</th>
                        <th className="py-3 px-4 text-center">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {solicitudesConcierge.map((sol) => (
                        <tr key={sol.id} className="hover:bg-slate-750/50 transition">
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(sol.created_at).toLocaleDateString("es-PY")}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {sol.nombre}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400">
                            {sol.telefono}
                          </td>
                          <td className="py-3 px-4 text-slate-200">
                            {sol.producto_solicitado}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {sol.ciudad_destino || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <a
                              href={`https://wa.me/${sol.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${sol.nombre}, te saluda Abel de NEXO CDE. Recibí tu solicitud para: "${sol.producto_solicitado}". Te paso la cotización mayorista:`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Contactar</span>
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

        {/* TAB 5: MÉTRICAS FINANCIERAS */}
        {tabActiva === "metricas" && metricas && (
          <div className="space-y-6 animate-fadeIn">
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
                  Costo de Mercadería Pagado
                </span>
                <span className="text-2xl font-black text-slate-300 font-mono mt-1 block">
                  ₲ {metricas.resumen.costoMercaderiaPyg.toLocaleString("es-PY")}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  US$ {metricas.resumen.costoMercaderiaUsd.toFixed(2)} pagados en CDE
                </span>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">
                  Ganancia Neta Consolidada
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  ₲ {metricas.resumen.gananciaNetaPyg.toLocaleString("es-PY")}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                  Margen neto real: {metricas.resumen.margenNetoPromedioPct}%
                </span>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">
                  Flete Convenio TSI
                </span>
                <span className="text-2xl font-black text-indigo-300 font-mono mt-1 block">
                  ₲ {metricas.resumen.costoEstimadoTsiPyg.toLocaleString("es-PY")}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Convenio corporativo de despacho
                </span>
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

      {/* MODAL EDITAR / CREAR DESTINO TSI */}
      {modalDestino && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {modalDestino.id ? `Editar Destino: ${modalDestino.ciudad}` : "Nuevo Destino TSI"}
              </h3>
              <button
                onClick={() => setModalDestino(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDestino} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Departamento</label>
                  <input
                    type="text"
                    required
                    value={modalDestino.departamento}
                    onChange={(e) => setModalDestino({ ...modalDestino, departamento: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ciudad / Localidad</label>
                  <input
                    type="text"
                    required
                    value={modalDestino.ciudad}
                    onChange={(e) => setModalDestino({ ...modalDestino, ciudad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Agencia Cabecera TSI</label>
                <input
                  type="text"
                  placeholder="ej. Agencia TSI Encarnación (Zona Terminal)"
                  value={modalDestino.agenciaNombre || ""}
                  onChange={(e) => setModalDestino({ ...modalDestino, agenciaNombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Flete Regular (PYG)</label>
                  <input
                    type="number"
                    placeholder="Dejar vacío para cotización"
                    value={modalDestino.fleteRegularPyg}
                    onChange={(e) => setModalDestino({ ...modalDestino, fleteRegularPyg: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Flete Pesado / TV (PYG)</label>
                  <input
                    type="number"
                    placeholder="Dejar vacío para cotización"
                    value={modalDestino.fletePesadoPyg}
                    onChange={(e) => setModalDestino({ ...modalDestino, fletePesadoPyg: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Modalidad</label>
                  <select
                    value={modalDestino.modalidad}
                    onChange={(e) => setModalDestino({ ...modalDestino, modalidad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value="DOMICILIO_Y_AGENCIA">Domicilio y Agencia</option>
                    <option value="AGENCIA">Solo Retiro en Agencia</option>
                    <option value="DOMICILIO">Solo Domicilio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tiempo Estimado</label>
                  <input
                    type="text"
                    value={modalDestino.tiempoEstimado}
                    onChange={(e) => setModalDestino({ ...modalDestino, tiempoEstimado: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={modalDestino.coberturaHabilitada}
                    onChange={(e) => setModalDestino({ ...modalDestino, coberturaHabilitada: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>Cobertura Habilitada para Compra en Tienda</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalDestino(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoDestino}
                  className="px-4 py-2 rounded-lg bg-[#00c853] hover:bg-[#00b34a] text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardandoDestino ? "Guardando..." : "Guardar Destino TSI"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
