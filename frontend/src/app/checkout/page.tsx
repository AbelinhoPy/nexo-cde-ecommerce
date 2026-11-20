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
  Edit2,
  AlertTriangle,
  Info
} from "lucide-react";
import { NexoLogo } from "@/components/NexoLogo";
import { TermsModal } from "@/components/TermsModal";
import { SipapInstructions } from "@/components/SipapInstructions";
import { AuthModal } from "@/components/AuthModal";
import { useCart } from "@/lib/CartContext";

const DEPARTAMENTOS_PARAGUAY = [
  "Central",
  "Asunción (Distrito Capital)",
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
    fleteDestinoPyg,
    setFleteDestinoPyg,
    cupon, 
    descuentoPyg, 
    totalPagarPyg, 
    customer, 
    setIsAuthModalOpen, 
    registerCustomer,
    clearCart 
  } = useCart();

  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [modalTerminosAbierto, setModalTerminosAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [editandoTicket, setEditandoTicket] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [avisoTarifa, setAvisoTarifa] = useState<string | null>(null);
  
  // Destinos TSI dinámicos
  const [destinosDisponibles, setDestinosDisponibles] = useState<any[]>([]);
  const [cargandoDestinos, setCargandoDestinos] = useState(false);
  const [errorDestinos, setErrorDestinos] = useState<string | null>(null);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState<any | null>(null);
  const [tarifaPendiente, setTarifaPendiente] = useState(false);
  const [fueraDeCobertura, setFueraDeCobertura] = useState(false);

  const [ordenGenerada, setOrdenGenerada] = useState<{
    codigo: string;
    totalPyg: number;
    fletePyg: number;
  } | null>(null);

  // Datos del ticket de envío
  const [cliente, setCliente] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    email: "",
    password: "",
    departamento: "",
    ciudad: "",
    direccion: "",
    modalidad: "DOMICILIO",
    agenciaTsi: "",
  });

  useEffect(() => {
    if (customer) {
      setCliente({
        nombre: customer.nombre || "",
        ci: customer.ci || "",
        telefono: customer.telefono || "",
        email: customer.email || "",
        password: "",
        departamento: customer.departamento || "",
        ciudad: customer.ciudad || "",
        direccion: customer.direccion || "",
        modalidad: "DOMICILIO",
        agenciaTsi: "",
      });
      if (customer.departamento) {
        cargarDestinosPorDepartamento(customer.departamento, customer.ciudad);
      }
    }
  }, [customer]);

  // Cargar localidades habilitadas al seleccionar departamento
  const cargarDestinosPorDepartamento = async (depto: string, ciudadPrevia = "") => {
    if (!depto) return;
    setCargandoDestinos(true);
    setFueraDeCobertura(false);
    setErrorDestinos(null);
    setDestinosDisponibles([]);
    try {
      const res = await fetch(`/api/geo/destinos?departamento=${encodeURIComponent(depto)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.destinos)) {
        setDestinosDisponibles(data.destinos);
        const habilitados = data.destinos.filter((d: any) => d.coberturaHabilitada);
        if (data.destinos.length === 0 || habilitados.length === 0) {
          setFueraDeCobertura(true);
          setDestinoSeleccionado(null);
          setFleteDestinoPyg(null);
        } else if (ciudadPrevia) {
          const match = data.destinos.find((d: any) => d.ciudad.toLowerCase() === ciudadPrevia.toLowerCase());
          if (match) {
            aplicarDestino(match);
          }
        }
      } else {
        setErrorDestinos(data.error || "No pudimos consultar la cobertura TSI. Volvé a intentar.");
        setDestinoSeleccionado(null);
        setFleteDestinoPyg(null);
      }
    } catch (e) {
      console.error("Error cargando destinos TSI:", e);
      setErrorDestinos("Error de conexión al consultar la cobertura TSI. Volvé a intentar.");
      setDestinoSeleccionado(null);
      setFleteDestinoPyg(null);
    } finally {
      setCargandoDestinos(false);
    }
  };

  const aplicarDestino = (destino: any, modalidadDeseada?: string) => {
    setDestinoSeleccionado(destino);
    if (!destino.coberturaHabilitada) {
      setFueraDeCobertura(true);
      setTarifaPendiente(false);
      setFleteDestinoPyg(null);
      return;
    }
    setFueraDeCobertura(false);

    if (destino.requiereCotizacion || destino.fleteRegularPyg === null) {
      setTarifaPendiente(true);
      setFleteDestinoPyg(null);
      return;
    }

    setTarifaPendiente(false);

    // Si el destino es solo AGENCIA, forzar modalidad a AGENCIA
    const modalidadEfectiva = destino.modalidad === "AGENCIA" ? "AGENCIA" : (modalidadDeseada || cliente.modalidad || "DOMICILIO");

    const tienePesado = cart.some((it) => it.tipoFlete === "PESADO");
    const costo = tienePesado ? destino.fletePesadoPyg : destino.fleteRegularPyg;
    setFleteDestinoPyg(costo);
    setCliente(prev => ({
      ...prev,
      modalidad: modalidadEfectiva,
      agenciaTsi: destino.agenciaNombre || "",
    }));
  };

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoDep = e.target.value;
    setCliente(prev => ({
      ...prev,
      departamento: nuevoDep,
      ciudad: "",
      agenciaTsi: "",
    }));
    setDestinoSeleccionado(null);
    setTarifaPendiente(false);
    setFueraDeCobertura(false);
    setFleteDestinoPyg(null);
    setErrorMensaje(null);
    setErrorDestinos(null);
    cargarDestinosPorDepartamento(nuevoDep);
  };

  const handleCiudadChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const nuevaCiudad = e.target.value;
    setCliente(prev => ({ ...prev, ciudad: nuevaCiudad }));
    setDestinoSeleccionado(null);
    setTarifaPendiente(false);
    setFueraDeCobertura(false);
    setFleteDestinoPyg(null);
    setErrorMensaje(null);

    const destino = destinosDisponibles.find(
      d => d.ciudad.toLowerCase() === nuevaCiudad.toLowerCase()
    );

    if (destino) {
      aplicarDestino(destino);
    }
  };

  // Recalcular cotización de flete automáticamente si cambia el contenido del carrito
  useEffect(() => {
    if (cart.length === 0) {
      setFleteDestinoPyg(null);
    } else if (destinoSeleccionado) {
      aplicarDestino(destinoSeleccionado, cliente.modalidad);
    }
  }, [cart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCliente({
      ...cliente,
      [e.target.name]: e.target.value,
    });
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setAvisoTarifa(null);

    if (cart.length === 0) {
      setErrorMensaje("El carrito está vacío. Agregá al menos un producto desde el catálogo para continuar.");
      return;
    }

    if (!terminosAceptados) {
      setErrorMensaje("Es requisito obligatorio aceptar los Términos de Envío, Inspección previa en TSI y Garantía.");
      return;
    }

    if (!cliente.nombre || !cliente.ci || !cliente.telefono || !cliente.departamento || !cliente.ciudad || !cliente.direccion) {
      setErrorMensaje("Por favor completá los datos requeridos para la guía de remisión TSI (nombre, CI, teléfono, departamento, ciudad y dirección).");
      return;
    }

    if (fueraDeCobertura) {
      setErrorMensaje("⚠️ El destino seleccionado no está habilitado para envíos por transportadora TSI.");
      return;
    }

    if (tarifaPendiente) {
      setErrorMensaje("⚠️ Envío pendiente de cotización para este destino.");
      return;
    }

    const depLower = (cliente.departamento || "").toLowerCase().trim();
    const ciudadLower = (cliente.ciudad || "").toLowerCase().trim();
    if (
      depLower.includes("alto paraná") || 
      depLower.includes("alto parana") || 
      ciudadLower.includes("ciudad del este") || 
      ciudadLower.includes("hernandarias") || 
      ciudadLower.includes("franco") || 
      ciudadLower.includes("minga")
    ) {
      setErrorMensaje("⚠️ Servicio Exclusivo para el Interior: NEXO CDE opera únicamente despachando por encomienda TSI a localidades de Asunción y el interior de Paraguay. No disponemos de entregas locales ni mostrador en Ciudad del Este.");
      return;
    }

    setCargando(true);

    try {
      // Si el cliente no está logueado pero dejó contraseña y email, crear cuenta
      if (!customer && cliente.email && cliente.password && cliente.password.length >= 6) {
        try {
          const regRes = await registerCustomer({
            nombre: cliente.nombre,
            ci: cliente.ci,
            telefono: cliente.telefono,
            email: cliente.email,
            password: cliente.password,
            departamento: cliente.departamento,
            ciudad: cliente.ciudad,
            direccion: cliente.direccion,
          });

          if (!regRes.success && regRes.error && regRes.error.toLowerCase().includes("ya existe")) {
            console.log("Usuario ya existente, continuando con checkout");
          }
        } catch (regErr) {
          console.warn("Aviso en registro opcional:", regErr);
        }
      }

      // Items de compra exactos del carrito
      const itemsPayload = cart.map(it => ({
        productoId: it.id,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioPyg: it.precioPyg,
        tipoFlete: it.tipoFlete,
      }));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          items: itemsPayload,
          productoId: itemsPayload[0]?.productoId,
          tipoFlete: itemsPayload[0]?.tipoFlete,
          montoProductosPyg: subtotalPyg,
          fleteEsperadoPyg: fleteDestinoPyg,
          cuponCodigo: cupon?.codigo || null,
          descuentoCuponPyg: descuentoPyg,
          terminosAceptados: true,
        }),
      });

      const resData = await response.json();

      if (response.status === 409 || resData.tarifaActualizada) {
        // La tarifa del servidor cambió respecto a la cotización previa del cliente
        if (typeof resData.nuevoFletePyg === "number") {
          setFleteDestinoPyg(resData.nuevoFletePyg);
        }
        setAvisoTarifa(resData.error || "La tarifa de flete se ha actualizado en el servidor. Verificá el nuevo total y volvé a presionar Confirmar.");
        // El carrito se mantiene intacto para que pueda reconfirmar
      } else if (response.ok && resData.success) {
        setOrdenGenerada({
          codigo: resData.codigoPedido,
          totalPyg: resData.totalPagarPyg,
          fletePyg: resData.fletePyg,
        });
        clearCart();
      } else {
        setErrorMensaje(resData.error || "No se pudo registrar la orden. Por favor revisá los datos o reintentá.");
        // El carrito se mantiene intacto para que pueda corregir
      }
    } catch (err) {
      console.error("Error en checkout:", err);
      setErrorMensaje("No pudimos verificar el envío o conectar con el servidor. Volvé a intentar.");
    } finally {
      setCargando(false);
    }
  };

  const ciudadesHabilitadas = destinosDisponibles.filter(d => d.coberturaHabilitada);

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
              
              {/* Banner de Identificación y Registro para Despacho TSI */}
              {!customer ? (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#00c853] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Identificación para Despacho TSI</h3>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        ¿Ya compraste antes en NEXO? Inicia sesión para autocompletar tu ticket guardado. Si es tu primera compra, completa tus datos abajo para coordinar tu envío.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-4 py-2 bg-[#00c853] hover:bg-[#00b34a] text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Ya tengo cuenta • Iniciar Sesión
                    </button>
                    <span className="text-[11px] text-slate-400">o completa el ticket abajo</span>
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

              {/* Formulario editable */}
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
                        Nombre y Apellido del Destinatario *
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
                          Cédula (CI o RUC) *
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
                          Teléfono Móvil / WhatsApp *
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
                        Correo Electrónico (opcional para tracking)
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="carlos@correo.com (opcional)"
                        value={cliente.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Podés dejarlo vacío si preferís gestionar tu pedido únicamente por WhatsApp y CI.
                      </p>
                    </div>

                    {!customer && cliente.email && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Contraseña de Cuenta (opcional)
                        </label>
                        <input
                          type="password"
                          name="password"
                          minLength={6}
                          placeholder="Mínimo 6 caracteres para acceder al perfil"
                          value={cliente.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    )}

                    {/* SELECTOR DE DEPARTAMENTO Y LOCALIDAD TSI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Departamento de Destino *
                        </label>
                        <select
                          name="departamento"
                          required
                          value={cliente.departamento}
                          onChange={handleDepartamentoChange}
                          className={`w-full px-2 py-2 rounded-xl border text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none ${
                            !cliente.departamento ? "text-slate-400 border-slate-300" : "text-slate-900 border-slate-300 font-semibold"
                          }`}
                        >
                          <option value="" disabled>
                            -- Selecciona tu Departamento --
                          </option>
                          {DEPARTAMENTOS_PARAGUAY.map((dep) => (
                            <option key={dep} value={dep} className="text-slate-900">
                              {dep}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Localidad o Agencia TSI *
                        </label>
                        {cargandoDestinos ? (
                          <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                            Consultando cobertura TSI...
                          </div>
                        ) : (
                          <select
                            name="ciudad"
                            required
                            disabled={!cliente.departamento || fueraDeCobertura}
                            value={cliente.ciudad}
                            onChange={handleCiudadChange}
                            className={`w-full px-2 py-2 rounded-xl border text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none ${
                              !cliente.ciudad ? "text-slate-400 border-slate-300" : "text-slate-900 border-slate-300 font-semibold"
                            }`}
                          >
                            <option value="">
                              {!cliente.departamento 
                                ? "-- Primero elige un departamento --" 
                                : fueraDeCobertura
                                ? "-- Sin cobertura directa TSI --"
                                : "-- Selecciona tu Localidad o Agencia --"}
                            </option>
                            {ciudadesHabilitadas.map((dest) => (
                              <option key={dest.ciudad} value={dest.ciudad}>
                                {dest.ciudad} {dest.requiereCotizacion ? "(Requiere cotización previa)" : ""}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* ERROR DE CONEXIÓN O CONSULTA DE DESTINOS */}
                    {errorDestinos && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{errorDestinos}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => cargarDestinosPorDepartamento(cliente.departamento, cliente.ciudad)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer transition shadow-xs"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                    {fueraDeCobertura && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Destino fuera de cobertura directa TSI</p>
                          <p className="text-[11px] text-rose-700">
                            Esta localidad no cuenta con servicio activo directo de Transportadora TSI desde Ciudad del Este. El pedido no puede ser procesado para esta dirección.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ALERTA: ENVÍO PENDIENTE DE COTIZACIÓN */}
                    {tarifaPendiente && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">Envío pendiente de cotización para este destino</p>
                          <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                            Transportadora TSI cubre esta zona especial (ej. Chaco interior o trayectos combinados) bajo cotización por peso volumétrico. No se puede confirmar el pedido sin tener un importe válido asignado.
                          </p>
                          <a
                            href={`https://wa.me/595983000000?text=${encodeURIComponent(`Hola Abel, quiero cotizar flete TSI para ${cliente.ciudad} (${cliente.departamento})`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 font-bold text-amber-900 underline hover:text-black"
                          >
                            📲 Contactar por WhatsApp para cotizar flete →
                          </a>
                        </div>
                      </div>
                    )}

                    {/* SELECCIÓN DE MODALIDAD (DOMICILIO O RETIRO EN AGENCIA TSI) */}
                    {destinoSeleccionado && !fueraDeCobertura && !tarifaPendiente && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-slate-800">
                          Modalidad de Entrega TSI
                        </label>
                        {destinoSeleccionado.modalidad === "AGENCIA" ? (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Solo Retiro en Agencia TSI disponible</p>
                              <p className="text-[11px] text-amber-800 leading-snug">
                                Para esta localidad, Transportadora TSI opera exclusivamente entregas en su agencia oficial de ventanilla.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition ${
                              cliente.modalidad === "DOMICILIO"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}>
                              <input
                                type="radio"
                                name="modalidad"
                                value="DOMICILIO"
                                checked={cliente.modalidad === "DOMICILIO"}
                                onChange={() => {
                                  setCliente(prev => ({ ...prev, modalidad: "DOMICILIO" }));
                                  aplicarDestino(destinoSeleccionado, "DOMICILIO");
                                }}
                                className="text-emerald-600"
                              />
                              <span>Entrega a Domicilio</span>
                            </label>

                            <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition ${
                              cliente.modalidad === "AGENCIA"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}>
                              <input
                                type="radio"
                                name="modalidad"
                                value="AGENCIA"
                                checked={cliente.modalidad === "AGENCIA"}
                                onChange={() => {
                                  setCliente(prev => ({ ...prev, modalidad: "AGENCIA" }));
                                  aplicarDestino(destinoSeleccionado, "AGENCIA");
                                }}
                                className="text-emerald-600"
                              />
                              <span>Retiro en Agencia TSI</span>
                            </label>
                          </div>
                        )}

                        {destinoSeleccionado.agenciaNombre && (
                          <p className="text-[11px] text-slate-500">
                            🏢 <strong>Agencia cabecera:</strong> {destinoSeleccionado.agenciaNombre} ({destinoSeleccionado.tiempoEstimado || "24-48 hs"})
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {cliente.modalidad === "AGENCIA" ? "Indicaciones para Retiro en Agencia TSI" : "Dirección Exacta de Entrega *"}
                      </label>
                      <textarea
                        rows={2}
                        name="direccion"
                        required
                        placeholder={
                          cliente.modalidad === "AGENCIA"
                            ? "ej. 'Retirar en Agencia TSI de la ciudad indicada' (o referencia de quién retira)"
                            : "ej. Av. Mariscal López 1240 casi San Martín (describir referencias para el chofer de TSI)"
                        }
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

              {/* Avisos de Error o Tarifa Actualizada del Servidor */}
              {errorMensaje && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Error en la orden</p>
                    <p className="mt-0.5 leading-relaxed">{errorMensaje}</p>
                  </div>
                </div>
              )}

              {avisoTarifa && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Tarifa actualizada</p>
                    <p className="mt-0.5 leading-relaxed">{avisoTarifa}</p>
                  </div>
                </div>
              )}

              {/* Botón de Confirmación con Validaciones */}
              <button
                type="button"
                onClick={handleCrearPedido}
                disabled={
                  !terminosAceptados ||
                  cargando ||
                  cargandoDestinos ||
                  tarifaPendiente ||
                  fueraDeCobertura ||
                  !cliente.departamento ||
                  !cliente.ciudad ||
                  fleteDestinoPyg === null ||
                  cart.length === 0 ||
                  Boolean(errorMensaje) ||
                  Boolean(errorDestinos)
                }
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  terminosAceptados &&
                  !cargando &&
                  !cargandoDestinos &&
                  !tarifaPendiente &&
                  !fueraDeCobertura &&
                  cliente.departamento &&
                  cliente.ciudad &&
                  fleteDestinoPyg !== null &&
                  cart.length > 0 &&
                  !errorMensaje &&
                  !errorDestinos
                    ? "bg-[#00c853] hover:bg-[#00b34a] text-slate-950 font-black"
                    : "bg-slate-400 cursor-not-allowed opacity-75"
                }`}
              >
                {cargando ? (
                  "Registrando Pedido en Neon..."
                ) : cargandoDestinos ? (
                  "Consultando cobertura TSI..."
                ) : fueraDeCobertura ? (
                  "❌ Destino fuera de cobertura TSI"
                ) : tarifaPendiente ? (
                  "⚠️ Envío pendiente de cotización para este destino"
                ) : !cliente.departamento ? (
                  "Seleccioná tu departamento de destino"
                ) : !cliente.ciudad || fleteDestinoPyg === null ? (
                  "Calculá tu envío según destino"
                ) : cart.length === 0 ? (
                  "Tu carrito está vacío"
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
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 text-center">
                    <p className="font-bold text-slate-700">Tu carrito está vacío</p>
                    <p className="text-[11px] text-slate-500">Agregá productos desde el catálogo para continuar con tu pedido.</p>
                    <Link href="/" className="inline-block mt-1 font-bold text-emerald-700 underline hover:text-emerald-800 text-xs">
                      Ir al catálogo &rarr;
                    </Link>
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
                      ₲ {(cart.length > 0 ? subtotalPyg : 0).toLocaleString("es-PY")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-400" />
                      Flete Encomienda TSI
                    </span>
                    {tarifaPendiente ? (
                      <span className="text-amber-600 font-bold text-[11px]">
                        Pendiente de cotización
                      </span>
                    ) : !cliente.ciudad || fleteDestinoPyg === null ? (
                      <span className="text-emerald-700 font-bold text-[11px]">
                        Calculá tu envío según destino
                      </span>
                    ) : (
                      <span className="font-mono font-semibold text-slate-800">
                        ₲ {fletePyg.toLocaleString("es-PY")}
                      </span>
                    )}
                  </div>

                  {descuentoPyg > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Descuento Promocional</span>
                      <span className="font-mono">- ₲ {descuentoPyg.toLocaleString("es-PY")}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-bold">
                    <span className="text-sm">Total a Transferir</span>
                    <span className="text-lg font-black text-[#00c853] font-mono">
                      {cargandoDestinos ? (
                        <span className="text-slate-400 text-xs font-semibold animate-pulse">Consultando flete TSI...</span>
                      ) : fueraDeCobertura ? (
                        <span className="text-rose-600 text-xs font-bold">Destino fuera de cobertura</span>
                      ) : tarifaPendiente ? (
                        <span className="text-amber-600 text-xs font-bold">Cotización de flete requerida</span>
                      ) : !cliente.ciudad || fleteDestinoPyg === null ? (
                        <span className="text-slate-400 text-xs font-semibold">Pendiente de cotización de flete</span>
                      ) : (
                        `₲ ${(cart.length > 0 ? (subtotalPyg + fleteDestinoPyg - descuentoPyg) : 0).toLocaleString("es-PY")}`
                      )}
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
