/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexo: {
          dark: "#0F1217",       // Grafito profundo metálico
          carbon: "#181D24",     // Fondo tarjetas oscuras
          metal: "#242C37",      // Borde metálico
          border: "#E2E8F0",     // Borde claro institucional
          green: {
            light: "#34D399",    // Verde menta suave
            DEFAULT: "#00E599",  // Verde esmeralda neón icónico del logo
            glow: "#00FFAB",     // Brillo interno
            dark: "#059669",     // Verde oscuro base
            deep: "#044E37",     // Fondo contraste
          },
          slate: {
            50: "#F8FAFC",
            100: "#F1F5F9",
            200: "#E2E8F0",
            700: "#334155",
            800: "#1E293B",
            900: "#0F172A",
          }
        }
      },
      boxShadow: {
        'nexo': '0 4px 20px -2px rgba(0, 229, 153, 0.25)',
        'metal': '0 8px 30px rgba(15, 18, 23, 0.08)',
        'card-hover': '0 12px 30px -4px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
};
