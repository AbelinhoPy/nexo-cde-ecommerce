"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Send, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { useCart } from "@/lib/CartContext";

interface ConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function ConciergeModal({ isOpen, onClose, initialQuery = "" }: ConciergeModalProps) {
  const { customer, mostrarNotificacion } = useCart();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [producto, setProducto] = useState("");
  const [linkRef, setLinkRef] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [notas, setNotas] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setProducto(initialQuery);
    }
    if (customer) {
      setNombre(customer.nombre || "");
      setTelefono(customer.telefono || "");
      setEmail(customer.email || "");
      setCiudad(customer.ciudad || "");
    }
  }, [initialQuery, customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !producto.trim()) {
      setErrorMsg("Por favor completa tu nombre, teléfono y el producto que buscas.");
      return;
    }

    setEnviando(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/concierge/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          telefono,
          email,
          productoSolicitado: producto,
          linkReferencia: linkRef,
          ciudadDestino: ciudad,
          notas
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEnviadoExito(true);
        mostrarNotificacion("✓ Solicitud de cotización enviada a Abel en Ciudad del Este");
      } else {
        setErrorMsg(data.error || "No se pudo enviar la solicitud. Intenta nuevamente.");
      }
    } catch (err) {
      setErrorMsg("Error de conexión al enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative space-y-4">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              Servicio Concierge CDE
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
              ¿No encontrás lo que buscás?
            </h3>
            <p className="text-xs text-slate-500">
              Te lo conseguimos en Ciudad del Este al precio mayorista más bajo con flete TSI.
            </p>
          </div>
        </div>

        {enviadoExito ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-emerald-900">
              ¡Solicitud Recibida con Éxito!
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Abel de <strong>NEXO CDE</strong> verificará el stock en Atacado Connect y te enviará la cotización mayorista a tu WhatsApp en los próximos minutos.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Entendido, ¡Gracias!
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ¿Qué producto necesitas? *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. MacBook Pro M3 Pro, RTX 4080 Super, Perfume Creed..."
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link de referencia (opcional)
              </label>
              <input
                type="url"
                placeholder="https://atacadoconnect.com/... o nissei.com/..."
                value={linkRef}
                onChange={(e) => setLinkRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tu Nombre *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0983 000 000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad de Destino
                </label>
                <input
                  type="text"
                  placeholder="Asunción, Encarnación, Oviedo..."
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico (opcional)
                </label>
                <input
                  type="email"
                  placeholder="juan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detalles adicionales o color preferido
              </label>
              <textarea
                rows={2}
                placeholder="Indica color, capacidad o si tienes presupuesto límite..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-[#00c853] hover:bg-[#00b34a] text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{enviando ? "Enviando solicitud..." : "Solicitar Cotización por WhatsApp"}</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Sin compromiso de compra. Te respondemos con el precio exacto de ventanilla CDE.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
