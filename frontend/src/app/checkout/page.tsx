"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Truck, 
  Lock, 
  CheckCircle2, 
  Package, 
  ArrowLeft,
  Building2, 
  User, 
  CreditCard, 
  Phone, 
  MapPin, 
  Tag, 
  ShoppingBag,
  ExternalLink,
  Edit2
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { TermsModal } from "@/components/TermsModal";
import { SipapInstructions } from "@/components/SipapInstructions";
import { AuthModal } from "@/components/AuthModal";
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

export default function CheckoutPage() {
  const { 
    cart, 
    subtotalPyg, 
    subtotalUsd, 
    fletePyg, 
    cupon, 
    descuentoPyg, 
    totalPagarPyg, 
    customer, 
    setIsAuthModalOpen, 
    clearCart 
  } = useCart();

  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [modalTerminosAbierto, setModalTerminosAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [editandoTicket, setEditandoTicket] = useState(false);
  
  const [ordenGenerada, setOrdenGenerada] = useState<{
    codigo: string;
    totalPyg: number;
    fletePyg: number;
  } | null>(null);

  // Datos del ticket de envío (prellenados si customer existe)
  const [cliente, setCliente] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    email: "",
    departamento: "Central",
    ciudad: "Asunción",
    direccion: "",
  });

  useEffect(() => {
    if (customer) {
      setCliente({
        nombre: customer.nombre || "",
        ci: customer.ci || "",
        telefono: customer.telefono || "",
        email: customer.email || "",
        departamento: customer.departamento || "Central",
        ciudad: customer.ciudad || "Asunción",
        direccion: customer.direccion || "",
      });
    }
  }, [customer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCliente({
      ...cliente,
      [e.target.name]: e.target.value,
    });
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminosAceptados) {
      alert("Es requisito obligatorio aceptar los Términos de Envío, Inspección previa en TSI y Garantía.");
      return;
    }

    if (!cliente.nombre || !cliente.ci || !cliente.telefono || !cliente.direccion) {
      alert("Por favor completa los datos de tu ticket de envío para la guía de TSI.");
      return;
    }

    setCargando(true);

    try {
      // Si el carrito está vacío (ej. acceso directo), armar item de respaldo
      const itemsPayload = cart.length > 0
        ? cart.map(it => ({
            productoId: it.id,
            nombre: it.nombre,
            cantidad: it.cantidad,
            precioPyg: it.precioPyg,
            tipoFlete: it.tipoFlete,
          }))
        : [
            {
              productoId: "CON-PS5-SLIM-DIG",
              nombre: "Sony PlayStation 5 Slim Digital 1TB",
              cantidad: 1,
              precioPyg: 3971000,
              tipoFlete: "PESADO" as const,
            }
          ];

      const montoProd = cart.length > 0 ? subtotalPyg : 3971000;
      const fleteFinal = cart.length > 0 ? fletePyg : 50000;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          items: itemsPayload,
          productoId: itemsPayload[0]?.productoId,
          tipoFlete: itemsPayload[0]?.tipoFlete,
          montoProductosPyg: montoProd,
          cuponCodigo: cupon?.codigo || null,
          descuentoCuponPyg: descuentoPyg,
          terminosAceptados: true,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setOrdenGenerada({
          codigo: resData.codigoPedido,
          totalPyg: resData.totalPagarPyg,
          fletePyg: resData.fletePyg,
        });
        clearCart();
      } else {
        alert(resData.error || "No se pudo registrar la orden.");
      }
    } catch (err) {
      alert("Error de conexión al procesar la orden.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-5xl mx-auto w-full space-y-6 flex-1">
        {/* Encabezado con Identidad NEXO */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold mb-2 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Catálogo Mayorista
            </Link>
            <NexoLogo theme="light" size="sm" />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200">
            <Building2 className="w-4 h-4 text-[#00c853]" />
            <span>Despacho Oficial CDE • Transportadora TSI</span>
          </div>
        </header>

        {ordenGenerada ? (
          /* PANTALLA DE INSTRUCCIONES SIPAP CONTINENTAL */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-950">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-base">Orden Registrada Exitosamente: #{ordenGenerada.codigo}</p>
                <p className="text-xs text-emerald-800">
                  Para proceder a la preparación de tu pedido en CDE y despacho en TSI, realiza la transferencia SIPAP exacta a Banco Continental antes de las 12:00 PM.
                </p>
              </div>
            </div>

            <SipapInstructions
              codigoPedido={ordenGenerada.codigo}
              totalPagarPyg={ordenGenerada.totalPyg}
            />

            <div className="flex justify-center pt-2">
              <Link
                href="/"
                className="text-xs text-slate-600 hover:text-slate-900 underline font-semibold transition"
              >
                ← Volver a la Tienda Principal
              </Link>
            </div>
          </div>
        ) : (
          /* PANTALLA DE CHECKOUT FORMAL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario / Ticket de Envío (7 Columnas) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
              
              {/* Banner de Inicio de Sesión si no está logueado */}
              {!customer ? (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">¿Ya tienes cuenta o compraste antes?</h3>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        Inicia sesión para usar tu ticket de envío guardado (CI, teléfono, dirección) y acumular tus compras anteriores.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-4 py-2 bg-[#00c853] hover:bg-[#00b34a] text-slate-950 font-bold rounded-lg text-xs transition"
                    >
                      Iniciar Sesión / Registrarme
                    </button>
                    <span className="text-[11px] text-slate-400">o completa tus datos abajo</span>
                  </div>
                </div>
              ) : (
                /* Ticket de Envío Guardado y Verificado */
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Ticket de Envío Verificado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditandoTicket(!editandoTicket)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 underline"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{editandoTicket ? "Cerrar edición" : "Editar destino"}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{cliente.nombre}</p>
                    <p className="font-mono text-slate-600">CI: {cliente.ci} • Tel: {cliente.telefono}</p>
                    <p className="text-slate-600">
                      Destino: <strong>{cliente.ciudad} ({cliente.departamento})</strong>
                    </p>
                    <p className="text-slate-500 italic">Dirección: {cliente.direccion}</p>
                  </div>
                </div>
              )}

              {/* Formulario editable (si no está logueado o si activó editar destino) */}
              {(!customer || editandoTicket) && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 pb-1">
                    <Truck className="w-4 h-4 text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Datos para la Guía de Remisión TSI
                    </h2>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre y Apellido del Destinatario
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        required
                        placeholder="ej. Juan Carlos Bogado"
                        value={cliente.nombre}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cédula (CI o RUC)
                        </label>
                        <input
                          type="text"
                          name="ci"
                          required
                          placeholder="ej. 3.845.920"
                          value={cliente.ci}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Teléfono Móvil / WhatsApp
                        </label>
                        <input
                          type="tel"
                          name="telefono"
                          required
                          placeholder="ej. 0983 123 456"
                          value={cliente.telefono}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Correo Electrónico (para comprobante y tracking)
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="carlos@correo.com"
                        value={cliente.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Departamento
                        </label>
                        <select
                          name="departamento"
                          value={cliente.departamento}
                          onChange={handleInputChange}
                          className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                          {DEPARTAMENTOS_PARAGUAY.map((dep) => (
                            <option key={dep} value={dep}>
                              {dep}
                            </option>
                          ))}
                        </select>
                        {cliente.departamento === "Alto Paraná" && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5 leading-tight">
                            ⚠️ Aviso: NEXO CDE opera exclusivamente mediante despacho por Transportadora TSI. No realizamos entregas presenciales dentro de CDE.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ciudad de Destino
                        </label>
                        <input
                          type="text"
                          name="ciudad"
                          required
                          placeholder="ej. Encarnación, Luque, Cnel. Oviedo"
                          value={cliente.ciudad}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dirección Exacta o Retiro en Agencia TSI
                      </label>
                      <textarea
                        rows={2}
                        name="direccion"
                        required
                        placeholder="ej. Av. Mariscal López 1240 o 'Retirar en Agencia TSI Asunción'"
                        value={cliente.direccion}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Checkbox Obligatorio de Términos */}
              <div className="pt-3 border-t border-slate-200">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terminos"
                    checked={terminosAceptados}
                    onChange={(e) => setTerminosAceptados(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="terminos" className="text-xs text-slate-700 leading-normal">
                    Acepto los{" "}
                    <button
                      type="button"
                      onClick={() => setModalTerminosAbierto(true)}
                      className="font-bold text-slate-900 underline hover:text-emerald-700"
                    >
                      Términos de Envío, Inspección en TSI y Garantía 48 hs
                    </button>
                    . Entiendo que debo inspeccionar el paquete antes de firmar con la transportadora.
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCrearPedido}
                disabled={!terminosAceptados || cargando}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  terminosAceptados && !cargando
                    ? "bg-[#00c853] hover:bg-[#00b34a] text-slate-950 font-black"
                    : "bg-slate-400 cursor-not-allowed opacity-75"
                }`}
              >
                {cargando ? (
                  "Registrando Pedido en Neon..."
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar Orden y Ver Cuenta SIPAP Continental</span>
                  </>
                )}
              </button>
            </div>

            {/* Resumen de Compra & Items (5 Columnas) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#00c853]" />
                    Ítems de Connect Partner ({cart.length})
                  </span>
                  <Link href="/" className="text-xs text-emerald-600 font-bold hover:underline">
                    Editar carrito
                  </Link>
                </div>

                {cart.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-bold">Ítem de prueba seleccionado:</p>
                    <p>Sony PlayStation 5 Slim Digital 1TB (JP/USA)</p>
                    <span className="font-mono text-emerald-600 font-bold">₲ 3.971.000</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto space-y-2">
                    {cart.map((it) => (
                      <div key={it.id} className="pt-2 flex items-center gap-3">
                        <img 
                          src={it.img} 
                          alt={it.nombre} 
                          className="w-12 h-12 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{it.nombre}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {it.cantidad}x ₲ {it.precioPyg.toLocaleString("es-PY")}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          ₲ {(it.precioPyg * it.cantidad).toLocaleString("es-PY")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cupón activo */}
                {cupon && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-800">
                    <span className="font-bold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Cupón: {cupon.codigo}
                    </span>
                    <span className="font-mono font-bold">
                      - ₲ {descuentoPyg.toLocaleString("es-PY")}
                    </span>
                  </div>
                )}

                {/* Desglose Económico */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span>Subtotal Productos</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₲ {(cart.length > 0 ? subtotalPyg : 3971000).toLocaleString("es-PY")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-400" />
                      Flete Plano TSI
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₲ {(cart.length > 0 ? fletePyg : 50000).toLocaleString("es-PY")}
                    </span>
                  </div>

                  {descuentoPyg > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Descuento Promocional</span>
                      <span className="font-mono">- ₲ {descuentoPyg.toLocaleString("es-PY")}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-bold">
                    <span className="text-sm">Total a Pagar</span>
                    <span className="text-lg font-black text-[#00c853] font-mono">
                      ₲ {(cart.length > 0 ? totalPagarPyg : 4021000).toLocaleString("es-PY")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card de Respaldo y Garantía */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Garantía y Liquidación Bancaria
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Operación respaldada por <strong>Banco Continental</strong> y <strong>Transportadora San Ignacio</strong>. Cuentas oficiales a nombre del titular con RUC 4196328-8.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <TermsModal
        isOpen={modalTerminosAbierto}
        onClose={() => setModalTerminosAbierto(false)}
        onAccept={() => setTerminosAceptados(true)}
      />

      <AuthModal />
    </div>
  );
}
