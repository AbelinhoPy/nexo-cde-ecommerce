"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, MessageSquare, AlertCircle, Phone, Mail, Building2 } from "lucide-react";

interface ContactFormProps {
  onSuccess?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [tipo, setTipo] = useState<"consulta" | "cotizacion" | "sugerencia">("consulta");
  const [mensaje, setMensaje] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setEstado({ tipo: "error", texto: "Por favor escribe tu consulta." });
      return;
    }
    if (!contacto.trim()) {
      setEstado({ tipo: "error", texto: "Por favor déjanos tu correo o WhatsApp para poder responderte." });
      return;
    }

    setCargando(true);
    setEstado(null);

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          tipo,
          mensaje: mensaje.trim(),
          website: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No pudimos enviar tu mensaje.");
      }

      setEstado({
        tipo: "success",
        texto: "¡Mensaje recibido con éxito! Un concierge de NEXO en CDE te responderá en breve.",
      });
      setNombre("");
      setContacto("");
      setMensaje("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setEstado({
        tipo: "error",
        texto: err.message || "Error al enviar el mensaje.",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Información de Contacto Directo */}
        <div className="lg:col-span-5 space-y-4">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
            CANAL DIRECTO CDE
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            ¿Buscás un producto no listado o tenés dudas sobre el despacho?
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Escribinos directamente. Nuestro equipo en Ciudad del Este revisa stock presencial con Connect Partner y te cotiza cualquier artículo de electrónica con despacho garantizado por Transportadora TSI.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#00c853] shrink-0" />
              <span>Av. Amado Benítez Gamarra, Ciudad del Este, Paraguay</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00c853] shrink-0" />
              <span>RUC: <strong>4196328-8</strong> • Facturación Electrónica Legal</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario Limpio */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo oculto anti-spam */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {estado && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  estado.tipo === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-red-50 border border-red-200 text-red-900"
                }`}
              >
                {estado.tipo === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{estado.texto}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  placeholder="ej. Carlos Benítez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs sm:text-sm bg-slate-50 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Correo o WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. 0983 000 000 o correo@gmail.com"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs sm:text-sm bg-slate-50 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Tipo de Solicitud
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "consulta", label: "Consulta General" },
                  { id: "cotizacion", label: "Cotización Especial CDE" },
                  { id: "sugerencia", label: "Sugerencia de Producto" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tipo === t.id
                        ? "bg-[#00c853] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Mensaje o Producto que Buscas *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Escribe aquí tu consulta o el modelo exacto que necesitas que busquemos en CDE..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853] text-xs sm:text-sm bg-slate-50 focus:bg-white outline-none transition resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 px-4 rounded-xl bg-[#0F1217] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#00c853]" />
              <span>{cargando ? "Enviando consulta..." : "Enviar Mensaje a Concierge"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
