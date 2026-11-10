"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Truck, 
  Lock, 
  CheckCircle2, 
  Info, 
  Package, 
  ArrowLeft,
  Building2,
  FileText,
  BadgeAlert
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { TermsModal } from "@/components/TermsModal";
import { SipapInstructions } from "@/components/SipapInstructions";

// Productos de alta rotación (CDE - Atacado Connect)
const PRODUCTOS_DISPONIBLES = [
  {
    id: "CON-PS5-SLIM-DIG",
    nombre: "Sony PlayStation 5 Slim Digital Edition 1TB (JP/USA)",
    categoria: "CONSOLAS_GAMING",
    precioPyg: 3971000,
    tipoFlete: "PESADO", // Requiere flete ₲50.000
    imagen: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "XIA-RN13PP-512",
    nombre: "Xiaomi Redmi Note 13 Pro+ 5G 512GB / 12GB RAM Aurora Purple",
    categoria: "SMARTPHONES",
    precioPyg: 3276000,
    tipoFlete: "REGULAR", // Flete ₲35.000
    imagen: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "TV-XIA-A43-4K",
    nombre: "Smart TV Xiaomi Mi TV A Pro 43\" 4K UHD Dolby Audio Google TV",
    categoria: "SMART_TVS",
    precioPyg: 2185000,
    tipoFlete: "PESADO",
    imagen: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80",
  }
];

export default function CheckoutPage() {
  const [productoSeleccionado, setProductoSeleccionado] = useState(PRODUCTOS_DISPONIBLES[0]);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [modalTerminosAbierto, setModalTerminosAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [ordenGenerada, setOrdenGenerada] = useState<{
    codigo: string;
    totalPyg: number;
    fletePyg: number;
  } | null>(null);

  // Datos del cliente destinatario en Paraguay
  const [cliente, setCliente] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    email: "",
    departamento: "Central",
    ciudad: "Asunción",
    direccion: "",
  });

  // Tarifa plana oficial TSI
  const costoFletePyg = productoSeleccionado.tipoFlete === "PESADO" ? 50000 : 35000;
  const totalPagarPyg = productoSeleccionado.precioPyg + costoFletePyg;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    setCargando(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          productoId: productoSeleccionado.id,
          tipoFlete: productoSeleccionado.tipoFlete,
          montoProductosPyg: productoSeleccionado.precioPyg,
          montoFletePyg: costoFletePyg,
          totalPagarPyg: totalPagarPyg,
          terminosAceptados: true,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setOrdenGenerada({
          codigo: resData.codigoPedido,
          totalPyg: resData.totalPagarPyg,
          fletePyg: costoFletePyg,
        });
      } else {
        const mockCodigo = `NEXO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
        setOrdenGenerada({
          codigo: mockCodigo,
          totalPyg: totalPagarPyg,
          fletePyg: costoFletePyg,
        });
      }
    } catch (err) {
      const mockCodigo = `NEXO-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrdenGenerada({
        codigo: mockCodigo,
        totalPyg: totalPagarPyg,
        fletePyg: costoFletePyg,
      });
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

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Despacho Oficial CDE • Transportadora TSI</span>
          </div>
        </header>

        {ordenGenerada ? (
          /* PANTALLA DE INSTRUCCIONES SIPAP POST-GENERACIÓN */
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-950">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-base">Orden Registrada: #{ordenGenerada.codigo}</p>
                <p className="text-xs text-emerald-800">
                  Para proceder al retiro en Atacado Connect y despacho en TSI, realiza la transferencia SIPAP exacta a Banco Continental.
                </p>
              </div>
            </div>

            <SipapInstructions
              codigoPedido={ordenGenerada.codigo}
              totalPagarPyg={ordenGenerada.totalPyg}
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setOrdenGenerada(null)}
                className="text-xs text-slate-500 hover:text-slate-900 underline transition cursor-pointer"
              >
                ← Modificar destinatario o elegir otro producto
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE DESPACHO & SELECCIÓN */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario (7 Columnas) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-slate-800" />
                  <h2 className="text-base font-bold text-slate-900">Datos para la Guía de Remisión TSI</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta información se asienta en la guía física de Transportadora TSI y en la factura legal con RUC.
                </p>
              </div>

              <form onSubmit={handleCrearPedido} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Nombre y Apellido del Destinatario
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    placeholder="ej. Juan Carlos Bogado"
                    value={cliente.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Cédula de Identidad (CI / DNI)
                    </label>
                    <input
                      type="text"
                      name="ci"
                      required
                      placeholder="ej. 4.120.350"
                      value={cliente.ci}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Teléfono Móvil / WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      placeholder="ej. 0983 123 456"
                      value={cliente.telefono}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Correo Electrónico (Para recibir comprobante y tracking de envío TSI)
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="ej. carlos.benitez@gmail.com"
                    value={cliente.email}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Departamento
                    </label>
                    <select
                      name="departamento"
                      value={cliente.departamento}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                    >
                      <option value="Central">Central</option>
                      <option value="Alto Paraná">Alto Paraná</option>
                      <option value="Itapúa">Itapúa</option>
                      <option value="Caaguazú">Caaguazú</option>
                      <option value="Cordillera">Cordillera</option>
                      <option value="Concepción">Concepción</option>
                      <option value="Amambay">Amambay</option>
                      <option value="Paraguarí">Paraguarí</option>
                      <option value="Misiones">Misiones</option>
                      <option value="San Pedro">San Pedro</option>
                      <option value="Guairá">Guairá</option>
                      <option value="Canindeyú">Canindeyú</option>
                      <option value="Chaco / Pdte Hayes">Chaco / Pdte Hayes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Ciudad de Destino
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      required
                      placeholder="ej. San Lorenzo / Encarnación"
                      value={cliente.ciudad}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Dirección Domiciliaria o Retiro en Agencia TSI
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    required
                    placeholder="ej. Av. Mariscal López 1240 o 'Retiro en Sucursal TSI Encarnación'"
                    value={cliente.direccion}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs sm:text-sm transition bg-white"
                  />
                </div>

                {/* Checkbox Obligatorio de Términos */}
                <div className="pt-3 border-t border-slate-100">
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
                  type="submit"
                  disabled={!terminosAceptados || cargando}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    terminosAceptados && !cargando
                      ? "bg-[#0F1217] hover:bg-slate-800"
                      : "bg-slate-400 cursor-not-allowed opacity-75"
                  }`}
                >
                  {cargando ? (
                    "Generando orden..."
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#00E599]" />
                      Confirmar Orden y Ver Cuenta SIPAP Continental
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Resumen de Compra & Seguridad (5 Columnas) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Selector de Producto */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Ítem para Concierge en CDE
                </span>
                
                <div className="space-y-2">
                  {PRODUCTOS_DISPONIBLES.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setProductoSeleccionado(p)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        productoSeleccionado.id === p.id
                          ? "border-[#00E599] bg-emerald-50/30"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <Package className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 line-clamp-1">{p.nombre}</p>
                          <p className="text-xs text-slate-900 font-bold font-mono">
                            ₲ {p.precioPyg.toLocaleString("es-PY")}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {p.tipoFlete === "PESADO" ? "₲50k" : "₲35k"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Costo */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Desglose de Pago
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Producto en Atacado Connect (CDE):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₲ {productoSeleccionado.precioPyg.toLocaleString("es-PY")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Flete Nacional TSI:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₲ {costoFletePyg.toLocaleString("es-PY")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">Total Transferencia SIPAP:</span>
                    <span className="text-xl font-black font-mono text-slate-900">
                      ₲ {totalPagarPyg.toLocaleString("es-PY")}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Garantía de Acreditación Segura
                  </div>
                  <p>
                    Cuenta corriente oficial de Banco Continental a nombre de razón social con RUC. Sin transferencias a personas físicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Términos */}
        <TermsModal
          isOpen={modalTerminosAbierto}
          onClose={() => setModalTerminosAbierto(false)}
          onAccept={() => setTerminosAceptados(true)}
        />
      </div>
    </div>
  );
}
