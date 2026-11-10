"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Copy, Check, Clock, AlertCircle, Landmark, QrCode } from "lucide-react";

interface SipapInstructionsProps {
  codigoPedido: string;
  totalPagarPyg: number;
}

export const SipapInstructions: React.FC<SipapInstructionsProps> = ({
  codigoPedido,
  totalPagarPyg,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verQr, setVerQr] = useState<boolean>(true);

  const copiarAlPortapapeles = (texto: string, campo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedField(campo);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const datosBancarios = {
    banco: "Banco Continental",
    titular: "NUÑEZ MARTINEZ, ABEL IRENEO",
    ci: "4196328",
    ruc: "4196328-8",
    cuenta: "010015602601",
    tipo: "Cuenta en Guaraníes (PYG)",
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/50 space-y-6">
      {/* Título y Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Datos para Transferencia SIPAP / QR</h3>
            <p className="text-xs text-slate-300">Banco Continental • Acreditación directa</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Conciliación Automática Activa
        </span>
      </div>

      {/* Regla de Corte 12:00 PM */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex gap-3 text-amber-200">
        <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold text-amber-300">Regla de Corte Diario (12:00 PM):</span>
          <br />
          • Pagos acreditados antes de las 12:00 PM se compran y despachan <strong>mañana a las 13:00 hs por TSI</strong>.
          <br />
          • Pagos posteriores pasan al corte siguiente (Día X+2 a las 13:00 hs).
        </div>
      </div>

      {/* Grid: Datos Bancarios + QR Banco Continental */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Datos textuales con copia rápida (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          
          {/* Titular de Cuenta */}
          <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Titular de la Cuenta</span>
              <span className="font-bold text-white text-sm">{datosBancarios.titular}</span>
            </div>
            <button
              onClick={() => copiarAlPortapapeles(datosBancarios.titular, "titular")}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Copiar Titular"
            >
              {copiedField === "titular" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Entidad */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-0.5">Entidad Financiera</span>
              <span className="font-semibold text-white">{datosBancarios.banco}</span>
            </div>

            {/* Tipo de Cuenta */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-0.5">Moneda</span>
              <span className="font-semibold text-white">{datosBancarios.tipo}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Número de Documento / CI / RUC */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">C.I. / RUC</span>
                <span className="font-mono font-bold text-white">{datosBancarios.ci}</span>
              </div>
              <button
                onClick={() => copiarAlPortapapeles(datosBancarios.ci, "ci")}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Copiar Cédula"
              >
                {copiedField === "ci" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Número de Cuenta con botón de copia destacado */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold block mb-0.5">N° de Cuenta</span>
                <span className="font-mono font-black text-emerald-300 text-sm tracking-wide">{datosBancarios.cuenta}</span>
              </div>
              <button
                onClick={() => copiarAlPortapapeles(datosBancarios.cuenta, "cuenta")}
                className="p-1.5 hover:bg-emerald-900/60 rounded-lg text-emerald-300 hover:text-white transition cursor-pointer"
                title="Copiar N° de Cuenta"
              >
                {copiedField === "cuenta" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta con QR Escaneable Banco Continental (5 cols) */}
        <div className="md:col-span-5 bg-white text-slate-900 p-4 rounded-2xl shadow-md border border-slate-200 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>QR Banco Continental / SIPAP</span>
          </div>

          {/* Imagen del QR oficial subido por el usuario */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-center">
            <img
              src="/qr-continental.jpg"
              alt="QR Transferencia Banco Continental - Abel Núñez"
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Escaneá directamente desde tu app móvil de <strong>Banco Continental</strong> o cualquier app bancaria con soporte SIPAP QR.
          </p>
        </div>
      </div>

      {/* Monto Exacto y Concepto Obligatorio */}
      <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold block">
              Monto Exacto a Transferir
            </span>
            <span className="text-2xl font-black font-mono text-white">
              ₲ {totalPagarPyg.toLocaleString("es-PY")}
            </span>
          </div>
          <button
            onClick={() => copiarAlPortapapeles(totalPagarPyg.toString(), "monto")}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            {copiedField === "monto" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedField === "monto" ? "Monto Copiado" : "Copiar Monto"}
          </button>
        </div>

        <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-300 block">Concepto SIPAP Obligatorio:</span>
            <span className="font-mono font-bold text-amber-300">{codigoPedido}</span>
          </div>
          <button
            onClick={() => copiarAlPortapapeles(codigoPedido, "concepto")}
            className="p-1.5 hover:bg-emerald-800/50 rounded-lg text-emerald-300 hover:text-white transition cursor-pointer"
            title="Copiar Código de Pedido"
          >
            {copiedField === "concepto" ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5 italic">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        El bot bancario reconcilia tu orden automáticamente al verificar el monto e importe acreditado en Banco Continental.
      </p>
    </div>
  );
};
