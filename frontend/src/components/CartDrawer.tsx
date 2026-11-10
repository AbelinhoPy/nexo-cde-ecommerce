"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Info 
} from "lucide-react";
import { useCart } from "@/lib/CartContext";

export function CartDrawer() {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    totalItems, 
    subtotalPyg, 
    subtotalUsd, 
    fletePyg, 
    descuentoPyg, 
    totalPagarPyg, 
    cupon, 
    aplicarCupon, 
    removerCupon, 
    isCartOpen, 
    setIsCartOpen,
    customer,
    setIsAuthModalOpen
  } = useCart();

  const [codigoCuponInput, setCodigoCuponInput] = useState("");
  const [cargandoCupon, setCargandoCupon] = useState(false);
  const [errorCupon, setErrorCupon] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleAplicarCupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoCuponInput.trim()) return;
    setCargandoCupon(true);
    setErrorCupon(null);

    const res = await aplicarCupon(codigoCuponInput);
    if (!res.success) {
      setErrorCupon(res.mensaje);
    } else {
      setCodigoCuponInput("");
    }
    setCargandoCupon(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00c853]/10 text-[#00c853] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Tu Carrito Mayorista</h2>
                <span className="text-xs text-slate-500 font-medium">
                  {totalItems} {totalItems === 1 ? "artículo seleccionado" : "artículos seleccionados"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Explora los productos de Connect Partner y agrégalos con 5% de descuento mayorista.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-[#00c853] hover:bg-[#00b34a] text-white text-xs font-bold rounded-lg transition"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition"
                >
                  {/* Imagen */}
                  <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img 
                      src={item.img} 
                      alt={item.nombre} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  </div>

                  {/* Info y Controles */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                        {item.nombre}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-0.5"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-xs font-bold text-[#00c853] font-mono block">
                          U$ {item.precioUsd.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ₲ {(item.precioPyg * item.cantidad).toLocaleString("es-PY")}
                        </span>
                      </div>

                      {/* Controles de Cantidad */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold font-mono text-slate-800">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con Resumen Financiero y Cupón */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-4">
              {/* Sección de Cupón de Descuento */}
              <div className="space-y-2">
                {cupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">{cupon.codigo}:</span> {cupon.descripcion}
                        <span className="block font-mono font-bold text-emerald-600">
                          - ₲ {cupon.descuentoPyg.toLocaleString("es-PY")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={removerCupon}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline ml-2"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAplicarCupon} className="space-y-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={codigoCuponInput}
                          onChange={(e) => setCodigoCuponInput(e.target.value.toUpperCase())}
                          placeholder="Código de cupón (ej. BIENVENIDA, CDE5)"
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="submit"
                        disabled={cargandoCupon || !codigoCuponInput.trim()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition disabled:opacity-50"
                      >
                        {cargandoCupon ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {errorCupon && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{errorCupon}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Desglose de Totales */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/80 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal Mercadería</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₲ {subtotalPyg.toLocaleString("es-PY")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    Flete Plano TSI
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₲ {fletePyg.toLocaleString("es-PY")}
                  </span>
                </div>

                {descuentoPyg > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuento aplicado</span>
                    <span className="font-mono">- ₲ {descuentoPyg.toLocaleString("es-PY")}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                  <span className="text-sm font-black uppercase tracking-tight">Total a Pagar</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#00c853] font-mono block">
                      ₲ {totalPagarPyg.toLocaleString("es-PY")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Aprox. U$ {(subtotalUsd + (fletePyg / 7640)).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Checkout con Control de Login */}
              {customer ? (
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-[#00c853] hover:bg-[#00b34a] text-white font-black py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <span>Continuar con mi Ticket de Envío</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[#00c853]" />
                  <span>Inicia Sesión para Confirmar Compra</span>
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 leading-tight">
                🔒 Despacho garantizado por TSI. Pago seguro vía SIPAP Banco Continental antes de las 12:00 PM.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
