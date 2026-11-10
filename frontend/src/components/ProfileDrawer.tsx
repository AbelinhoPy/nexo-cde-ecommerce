"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Package, 
  KeyRound, 
  LogOut, 
  Truck, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  CreditCard,
  Save,
  Camera,
  Eye,
  Download
} from "lucide-react";
import { useCart } from "@/lib/CartContext";

const DEPARTAMENTOS_PARAGUAY = [
  "Central",
  "Asunción (Distrito Capital)",
  "Alto Paraná",
  "Itapúa",
  "Caaguazú",
  "Cordillera",
  "San Pedro",
  "Concepción",
  "Paraguarí",
  "Guairá",
  "Canindeyú",
  "Amambay",
  "Misiones",
  "Ñeembucú",
  "Presidente Hayes",
  "Boquerón",
  "Alto Paraguay",
  "Caazapá",
];

export function ProfileDrawer() {
  const { 
    isProfileOpen, 
    setIsProfileOpen, 
    customer, 
    customerToken, 
    logoutCustomer, 
    refreshProfile,
    mostrarNotificacion 
  } = useCart();

  const [tab, setTab] = useState<"ticket" | "pedidos" | "password">("ticket");
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [fotoModalUrl, setFotoModalUrl] = useState<string | null>(null);

  // Estados de edición de ticket
  const [editTicket, setEditTicket] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    ciudad: "",
    departamento: "Central",
    direccion: "",
  });
  const [guardandoTicket, setGuardandoTicket] = useState(false);

  // Estados de cambio de contraseña
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [passStatus, setPassStatus] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setEditTicket({
        nombre: customer.nombre || "",
        ci: customer.ci || "",
        telefono: customer.telefono || "",
        ciudad: customer.ciudad || "Asunción",
        departamento: customer.departamento || "Central",
        direccion: customer.direccion || "",
      });
    }
  }, [customer]);

  useEffect(() => {
    if (isProfileOpen && customerToken && tab === "pedidos") {
      cargarPedidos();
    }
  }, [isProfileOpen, tab, customerToken]);

  const cargarPedidos = async () => {
    if (!customerToken) return;
    setCargandoPedidos(true);
    try {
      const res = await fetch("/api/customer/orders", {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPedidos(data.pedidos);
      }
    } catch (e) {
      console.error("Error al cargar pedidos:", e);
    } finally {
      setCargandoPedidos(false);
    }
  };

  const handleGuardarTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) return;
    setGuardandoTicket(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(editTicket),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        mostrarNotificacion("✓ Ticket de envío actualizado exitosamente");
        await refreshProfile();
      } else {
        alert(data.error || "Error al actualizar");
      }
    } catch {
      alert("Error de comunicación");
    } finally {
      setGuardandoTicket(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) return;
    setGuardandoPass(true);
    setPassStatus(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(passForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassStatus("✓ Contraseña actualizada correctamente.");
        setPassForm({ currentPassword: "", newPassword: "" });
        mostrarNotificacion("✓ Contraseña actualizada");
      } else {
        setPassStatus(`✗ ${data.error || "Error al cambiar contraseña"}`);
      }
    } catch {
      setPassStatus("✗ Error de comunicación");
    } finally {
      setGuardandoPass(false);
    }
  };

  if (!isProfileOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsProfileOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white text-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">{customer.nombre}</h2>
                <span className="text-xs text-slate-400 font-mono">{customer.email}</span>
              </div>
            </div>

            <button
              onClick={() => setIsProfileOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 px-2">
            <button
              onClick={() => setTab("ticket")}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition ${
                tab === "ticket"
                  ? "border-[#00c853] text-[#00c853]"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Ticket de Envío</span>
            </button>

            <button
              onClick={() => setTab("pedidos")}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition ${
                tab === "pedidos"
                  ? "border-[#00c853] text-[#00c853]"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Mis Compras ({pedidos.length})</span>
            </button>

            <button
              onClick={() => setTab("password")}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition ${
                tab === "password"
                  ? "border-[#00c853] text-[#00c853]"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cambiar Seña</span>
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* PESTAÑA 1: TICKET DE ENVÍO */}
            {tab === "ticket" && (
              <form onSubmit={handleGuardarTicket} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Ticket Oficial para Despacho TSI
                  </span>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Estos datos se asignan automáticamente a tus compras para coordinar la entrega con la Transportadora TSI y emitir el remito.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={editTicket.nombre}
                    onChange={(e) => setEditTicket({ ...editTicket, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cédula (CI o RUC)</label>
                    <input
                      type="text"
                      required
                      value={editTicket.ci}
                      onChange={(e) => setEditTicket({ ...editTicket, ci: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={editTicket.telefono}
                      onChange={(e) => setEditTicket({ ...editTicket, telefono: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                    <select
                      value={editTicket.departamento}
                      onChange={(e) => setEditTicket({ ...editTicket, departamento: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      {DEPARTAMENTOS_PARAGUAY.map((dep) => (
                        <option key={dep} value={dep}>
                          {dep}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad Destino</label>
                    <input
                      type="text"
                      required
                      value={editTicket.ciudad}
                      onChange={(e) => setEditTicket({ ...editTicket, ciudad: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección de Entrega o Agencia TSI
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editTicket.direccion}
                    onChange={(e) => setEditTicket({ ...editTicket, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoTicket}
                  className="w-full bg-[#00c853] hover:bg-[#00b34a] text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{guardandoTicket ? "Guardando..." : "Actualizar Ticket de Envío"}</span>
                </button>
              </form>
            )}

            {/* PESTAÑA 2: MIS COMPRAS ANTERIORES */}
            {tab === "pedidos" && (
              <div className="space-y-4">
                {cargandoPedidos ? (
                  <div className="text-center py-10 text-slate-400 text-xs">Cargando tus compras...</div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Aún no tienes compras registradas</p>
                    <p className="text-[11px] text-slate-400">
                      Cuando realices tu primer pedido en NEXO CDE aparecerá aquí con el número de guía TSI.
                    </p>
                  </div>
                ) : (
                  pedidos.map((ped) => (
                    <div 
                      key={ped.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            {ped.codigoPedido}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ped.createdAt).toLocaleDateString("es-PY", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Estado del Pedido */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ped.estado === "DESPACHADO_TSI"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : ped.estado === "PAGADO_VERIFICADO"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {ped.estado === "DESPACHADO_TSI"
                            ? "En Tránsito TSI"
                            : ped.estado === "PAGADO_VERIFICADO"
                            ? "Pago Conciliado"
                            : "Esperando SIPAP"}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-slate-200 text-xs">
                        {ped.items.map((it: any, i: number) => (
                          <div key={i} className="py-1.5 flex justify-between items-center text-slate-700">
                            <span>
                              {it.cantidad}x {it.nombre}
                            </span>
                            <span className="font-mono font-semibold">
                              ₲ {it.subtotalPyg.toLocaleString("es-PY")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Guía TSI de Rastreo */}
                      {ped.numeroGuiaTsi && (
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="text-[10px] text-slate-500 block">Guía de Remisión TSI</span>
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {ped.numeroGuiaTsi}
                              </span>
                            </div>
                          </div>

                          {ped.trackingUrl && (
                            <a
                              href={ped.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                            >
                              <span>Rastrear</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Comprobante Físico de Ventanilla TSI */}
                      {ped.fotoGuiaTsi && (
                        <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                              <Camera className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Comprobante Físico TSI</span>
                            </div>
                            <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              Sellado en CDE
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            Foto oficial tomada en ventanilla de Transportadora TSI con sello de recepción y firma.
                          </p>
                          <button
                            type="button"
                            onClick={() => setFotoModalUrl(ped.fotoGuiaTsi)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Foto del Documento Físico</span>
                          </button>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500">Total Liquidado</span>
                        <span className="font-mono font-bold text-sm text-[#00c853]">
                          ₲ {ped.totalPagarPyg.toLocaleString("es-PY")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PESTAÑA 3: CAMBIAR SEÑA (CONTRASEÑA) */}
            {tab === "password" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <span className="font-bold block text-slate-800 mb-1">Seguridad de la Cuenta</span>
                  <p className="text-[11px] leading-relaxed">
                    Actualiza tu contraseña ("seña") para proteger tu ticket de envío y tus compras anteriores.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Actual</label>
                  <input
                    type="password"
                    required
                    value={passForm.currentPassword}
                    onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                    placeholder="Tu contraseña actual"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {passStatus && (
                  <p className="text-xs font-semibold p-2.5 rounded-lg bg-slate-100 text-slate-800">
                    {passStatus}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={guardandoPass}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-xs"
                >
                  {guardandoPass ? "Actualizando..." : "Cambiar Contraseña"}
                </button>
              </form>
            )}
          </div>

          {/* Footer con Cerrar Sesión */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Sesión iniciada</span>
            <button
              onClick={logoutCustomer}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 py-1.5 px-3 rounded-lg hover:bg-rose-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX FOTO COMPROBANTE TSI */}
      {fotoModalUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFotoModalUrl(null)}
        >
          <div 
            className="bg-slate-900 text-white rounded-2xl max-w-2xl w-full p-4 border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Comprobante Físico de Despacho TSI</h3>
                  <span className="text-[10px] text-slate-400">Sellado en ventanilla de Transportadora San Ignacio (CDE)</span>
                </div>
              </div>
              <button
                onClick={() => setFotoModalUrl(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-2 flex items-center justify-center bg-black/40 rounded-xl min-h-[300px]">
              <img
                src={fotoModalUrl}
                alt="Comprobante Físico de Despacho TSI"
                className="max-h-[60vh] max-w-full rounded-lg shadow-lg object-contain border border-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">Guía oficial emitida para entrega en tu localidad</span>
              <a
                href={fotoModalUrl}
                download="comprobante_tsi_cde.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 text-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Documento
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
