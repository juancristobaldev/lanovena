import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // COLORES OFICIALES
        novena: {
          indigo: "#312E81", // Seriedad Institucional
          green: "#10B981", // Acción / Cancha
          light: "#F9FAFB", // Fondo moderno
        },
      },
    },
  },
  plugins: [],
};
export default config;
