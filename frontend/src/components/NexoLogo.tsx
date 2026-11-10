"use client";

import React from "react";

interface NexoLogoProps {
  className?: string;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export const NexoLogo: React.FC<NexoLogoProps> = ({
  className = "",
  theme = "light",
  size = "md"
}) => {
  const isDark = theme === "dark";

  // Dimensiones según tamaño
  const heights = {
    sm: "h-8",
    md: "h-11",
    lg: "h-14"
  };

  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <div className={`flex items-center ${heights[size]}`}>
        <svg
          viewBox="0 0 340 76"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto"
        >
          <defs>
            {/* Gradiente metálico oscuro para N, E, O */}
            <linearGradient id="metalDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E3744" />
              <stop offset="40%" stopColor="#1B2129" />
              <stop offset="70%" stopColor="#12161D" />
              <stop offset="100%" stopColor="#2A3340" />
            </linearGradient>

            {/* Gradiente verde esmeralda brillante para la X */}
            <linearGradient id="emeraldX" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4EFEB3" />
              <stop offset="35%" stopColor="#00E599" />
              <stop offset="70%" stopColor="#05B375" />
              <stop offset="100%" stopColor="#036240" />
            </linearGradient>

            {/* Borde exterior metálico oscuro */}
            <linearGradient id="metalBorder" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4A5568" />
              <stop offset="50%" stopColor="#1A202C" />
              <stop offset="100%" stopColor="#2D3748" />
            </linearGradient>

            {/* Borde verde neón sutil para N, E, O */}
            <linearGradient id="greenRim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#00E599" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Filtro de relieve suave */}
            <filter id="bevel3d" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* LETRA N */}
          <g filter="url(#bevel3d)">
            <path
              d="M12 12 H36 L64 48 V12 H86 V64 H62 L34 28 V64 H12 Z"
              fill="url(#metalDark)"
              stroke="url(#greenRim)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>

          {/* LETRA E */}
          <g filter="url(#bevel3d)">
            <path
              d="M96 12 H154 V25 H120 V32 H148 V44 H120 V51 H156 V64 H96 Z"
              fill="url(#metalDark)"
              stroke="url(#greenRim)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>

          {/* LETRA X (Facetada, Verde Neón Esmeralda Tridimensional) */}
          <g filter="url(#bevel3d)">
            {/* Silueta exterior con relieve metálico oscuro */}
            <path
              d="M166 12 H190 L212 38 L234 12 H258 L226 48 L260 64 H236 L212 48 L188 64 H164 L198 48 Z"
              fill="#062218"
              stroke="#00E599"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Núcleo facetado esmeralda */}
            <path
              d="M170 14 H188 L212 38 L236 14 H254 L224 48 L256 62 H238 L212 48 L186 62 H168 L198 48 Z"
              fill="url(#emeraldX)"
              stroke="#A7F3D0"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Faceta de brillo superior */}
            <polygon points="172,16 212,38 252,16 236,16 212,32 188,16" fill="#86EFAC" opacity="0.6" />
          </g>

          {/* LETRA O */}
          <g filter="url(#bevel3d)">
            <path
              d="M272 12 H318 C328 12 334 18 334 28 V48 C334 58 328 64 318 64 H272 C262 64 256 58 256 48 V28 C256 18 262 12 272 12 Z M278 26 V50 C278 52 280 54 284 54 H306 C310 54 312 52 312 50 V26 C312 24 310 22 306 22 H284 C280 22 278 24 278 26 Z"
              fill="url(#metalDark)"
              stroke="url(#greenRim)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* SUBTÍTULO: CONCIERGE COMERCIAL & TRANSPORTE */}
      <div className="w-full mt-0.5 pl-0.5">
        <span
          className={`font-black tracking-[0.24em] text-[9px] sm:text-[10px] uppercase font-sans ${
            isDark ? "text-slate-300" : "text-slate-800"
          }`}
        >
          CONCIERGE COMERCIAL & TRANSPORTE
        </span>
      </div>
    </div>
  );
};
