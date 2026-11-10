"use client";

import React, { useState } from "react";
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  CreditCard, 
  Phone, 
  MapPin, 
  Building, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck 
} from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { NexoLogo } from "./NexoLogo";

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

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginCustomer, registerCustomer } = useCart();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [loginForm, setLoginForm] = useState({
    identificador: "",
    password: "",
  });

  const [regForm, setRegForm] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    email: "",
    password: "",
    departamento: "Central",
    ciudad: "Asunción",
    direccion: "",
  });

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    const res = await loginCustomer(loginForm.identificador, loginForm.password);
    if (!res.success) {
      setErrorMsg(res.error || "Credenciales incorrectas.");
    }
    setCargando(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    const res = await registerCustomer(regForm);
    if (!res.success) {
      setErrorMsg(res.error || "Error al registrar la cuenta.");
    }
    setCargando(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={() => setIsAuthModalOpen(false)}
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-800 z-10 border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header con Logo */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-1">
            <NexoLogo theme="light" size="sm" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {tab === "login" ? "Ingresá a tu Cuenta" : "Creá tu Ticket de Envío"}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {tab === "login"
              ? "Accedé a tus compras anteriores, seguimiento de guías TSI y checkout directo."
              : "Tus datos quedan registrados para enviar el comprobante y coordinar con Transportadora TSI."}
          </p>

          {/* Selector de Pestaña */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs mx-auto mt-4">
            <button
              onClick={() => {
                setTab("login");
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === "login"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setTab("register");
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === "register"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Registrarme
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* FORMULARIO LOGIN */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico o N° de Cédula (CI)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginForm.identificador}
                  onChange={(e) => setLoginForm({ ...loginForm, identificador: e.target.value })}
                  placeholder="ej. juan@gmail.com o 4196328"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Contraseña</label>
                <span className="text-[11px] text-emerald-600 font-semibold cursor-pointer hover:underline">
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#00c853] hover:bg-[#00b34a] text-white font-bold py-3 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cargando ? (
                "Verificando..."
              ) : (
                <>
                  <span>Ingresar a mi Cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORMULARIO REGISTRO (TICKET DE ENVÍO) */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre y Apellido Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regForm.nombre}
                  onChange={(e) => setRegForm({ ...regForm, nombre: e.target.value })}
                  placeholder="ej. Juan Carlos Bogado"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  N° de Cédula (CI o RUC)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regForm.ci}
                    onChange={(e) => setRegForm({ ...regForm, ci: e.target.value })}
                    placeholder="ej. 3845920"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={regForm.telefono}
                    onChange={(e) => setRegForm({ ...regForm, telefono: e.target.value })}
                    placeholder="ej. 0983 123 456"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="tu@correo.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contraseña ("Seña")
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Ubicación de Entrega TSI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Departamento
                </label>
                <select
                  value={regForm.departamento}
                  onChange={(e) => setRegForm({ ...regForm, departamento: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {DEPARTAMENTOS_PARAGUAY.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ciudad de Destino
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regForm.ciudad}
                    onChange={(e) => setRegForm({ ...regForm, ciudad: e.target.value })}
                    placeholder="ej. Encarnación, Cnel. Oviedo"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Dirección Exacta o Sucursal TSI para Retiro
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regForm.direccion}
                  onChange={(e) => setRegForm({ ...regForm, direccion: e.target.value })}
                  placeholder="ej. Av. España c/ Brasilia N° 450 o Retirar en Agencia TSI"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00c853] shrink-0 mt-0.5" />
              <span>
                Tus datos de Cédula y Dirección se guardan de forma cifrada (AES-256) y se imprimen únicamente en la planilla de remisión de Transportadora TSI.
              </span>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#00c853] hover:bg-[#00b34a] text-white font-bold py-3 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cargando ? (
                "Guardando Ticket..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Cuenta y Guardar Ticket</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
