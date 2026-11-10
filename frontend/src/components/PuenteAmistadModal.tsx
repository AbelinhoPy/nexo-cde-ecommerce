"use client";

import React from "react";
import { X, Video, Truck, Clock, ShieldCheck, ExternalLink, Activity } from "lucide-react";

interface PuenteAmistadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PuenteAmistadModal({ isOpen, onClose }: PuenteAmistadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative space-y-4">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
            <Video className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                EN VIVO • CIUDAD DEL ESTE
              </span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight mt-1">
              Cámara en Vivo: Puente de la Amistad (CDE ↔ Foz)
            </h3>
            <p className="text-xs text-slate-400">
              Tráfico fronterizo y monitoreo de aduana en tiempo real.
            </p>
          </div>
        </div>

        {/* Video / Stream Feed Box */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
          <iframe
            src="https://www.youtube.com/embed/live_stream?channel=UC8Z6L3n0Wq0J7C1bE5A&autoplay=1&mute=1"
            title="Puente de la Amistad En Vivo"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/* Overlay informativo en la esquina */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Paso Aduanero: FLUIDO</span>
          </div>
        </div>

        {/* Estado Operativo NEXO & TSI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-400" /> Despachos TSI
            </span>
            <span className="text-xs font-bold text-white block">Salidas Diarias</span>
            <span className="text-[10px] text-emerald-400 font-medium">13:00 hs puntual</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Corte de Pedidos
            </span>
            <span className="text-xs font-bold text-white block">12:00 PM Mediodía</span>
            <span className="text-[10px] text-slate-400 font-medium">Despacho en el día</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> Aduana & Flete
            </span>
            <span className="text-xs font-bold text-white block">Flete Nacional</span>
            <span className="text-[10px] text-blue-400 font-medium">100% legal y asegurado</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
          <span>Transportadora TSI San Ignacio • Av. Monseñor Rodríguez, CDE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
}
