"use client";

import React from "react";
import { X, ShieldCheck, AlertTriangle, Truck, RotateCcw } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">Términos de Envío, Revisión y Garantía</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="px-6 py-6 overflow-y-auto space-y-5 text-sm text-gray-700 leading-relaxed">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium">
              Por favor lea cuidadosamente estas condiciones. Al operar como servicio de intermediación directa desde las tiendas mayoristas de Ciudad del Este (CDE), la transparencia y el cumplimiento de estos pasos garantizan su cobertura total.
            </p>
          </div>

          {/* Cláusula 1: Inspección de Flete */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>1. Responsabilidad de Flete e Inspección con TSI</span>
            </div>
            <p className="pl-6 text-gray-600">
              Todos los paquetes se despachan desde nuestra base operativa en Ciudad del Este con precinto de seguridad numerado vía <strong>Transportadora TSI</strong>. El cliente tiene la obligación estricta de <strong>inspeccionar visualmente el estado exterior de la caja o paquete antes de firmar la guía de entrega</strong>. Si el embalaje presenta signos de apertura, rotura o manipulación, debe asentarse de inmediato en la planilla de TSI y rechazar la recepción. No se aceptarán reclamos por golpes o faltantes imputables al transporte una vez firmada la guía sin observaciones.
            </p>
          </div>

          {/* Cláusula 2: Garantía de Fábrica */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Garantía de Fábrica (48 Horas DOA - Dead on Arrival)</span>
            </div>
            <p className="pl-6 text-gray-600">
              El comprador dispone de un plazo improrrogable de <strong>48 horas corridas</strong> a partir de la recepción efectiva del producto para verificar su correcto funcionamiento y encendido. En caso de falla de fábrica de origen (unidad que no enciende o defecto grave de hardware no atribuible a mala manipulación o sobretensión), el cliente deberá notificarlo a nuestro canal de soporte adjuntando <strong>video probatorio continuo</strong> del desempaque y primer intento de encendido.
            </p>
          </div>

          {/* Cláusula 3: Logística Inversa */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>3. Política de Logística Inversa y Cambio Físico</span>
            </div>
            <p className="pl-6 text-gray-600">
              Para canalizar el cambio físico con el distribuidor oficial en Ciudad del Este:
            </p>
            <ul className="list-disc pl-11 space-y-1 text-gray-600">
              <li>El cliente cubre el flete de reenvío de la unidad hasta la sucursal de TSI en Ciudad del Este.</li>
              <li>Nuestra plataforma asume al 100% la gestión presencial de cambio inmediato por una unidad nueva sellada en el mayorista local.</li>
              <li>Nuestra plataforma costea y asume íntegramente el flete de retorno de la nueva unidad hasta la ciudad de destino del cliente.</li>
            </ul>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Última actualización de términos: Noviembre 2026. Válido para toda la República del Paraguay.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow transition"
          >
            Aceptar Términos y Condiciones
          </button>
        </div>
      </div>
    </div>
  );
};
