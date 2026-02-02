// src/config/plans.ts

export type PlanType =
  | "SEMILLERO"
  | "PROFESIONAL"
  | "ALTO_RENDIMIENTO"
  | "GOLD"
  | "INSTITUTIONAL";

export interface PlanLimit {
  value: number | "Ilimitado";
  label: string;
}

export interface Plan {
  id: PlanType;
  name: string;
  tagline: string; // Bajada comercial del doc
  priceMonthly: number;
  priceYearly: number; // Calculado como (Mensual * 10) o precio fijo del doc
  currency: string;
  isPopular: boolean;
  buttonText: string;
  limits: {
    schools: number;
    categories: number | "Ilimitadas";
    players: number | "Ilimitados";
    coaches: number | "Ilimitados";
    directors: number;
  };
  features: {
    included: boolean;
    text: string;
  }[];
  styles: {
    card: string;
    button: string;
    badge?: string;
  };
}

export const PLANS: Plan[] = [
  {
    id: "SEMILLERO",
    name: "Semillero",
    tagline: "Para escuelas nuevas o talleres municipales pequeños.",
    priceMonthly: 35000,
    priceYearly: 350000, // Documentación: $350.000 anual
    currency: "$",
    isPopular: false,
    buttonText: "Comenzar Básico",
    limits: {
      schools: 1,
      categories: 6,
      players: 80, // Documentación: Hasta 80 jugadores (algunas partes dicen 90, usamos 80 por consistencia)
      coaches: 3,
      directors: 1,
    },
    features: [
      { text: "Gestión Esencial", included: true },
      { text: "Control de Asistencia", included: true },
      { text: "App Apoderados (Básica)", included: true },
      { text: "Tienda Oficial", included: false },
      { text: "Biblioteca Global Premium", included: false },
    ],
    styles: {
      card: "bg-white border-gray-200 hover:border-gray-300",
      button: "bg-gray-900 text-white hover:bg-gray-800",
    },
  },
  {
    id: "PROFESIONAL",
    name: "Profesional",
    tagline: "El estándar para academias establecidas.",
    priceMonthly: 50000,
    priceYearly: 500000, // Documentación: $500.000 anual
    currency: "$",
    isPopular: true, // "El plan más vendido" según doc
    buttonText: "Elegir Profesional",
    limits: {
      schools: 1,
      categories: 12,
      players: 250,
      coaches: 10,
      directors: 2, // Tú + Secretaria
    },
    features: [
      { text: "Todo lo del plan Semillero", included: true },
      { text: "Acceso a Biblioteca Global", included: true },
      { text: "Tienda Online & Stock", included: true },
      { text: "Finanzas Avanzadas", included: true },
      { text: "Cobranza Automatizada", included: true },
    ],
    styles: {
      card: "bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-xl scale-105 z-10",
      button: "bg-[#312E81] text-white hover:bg-indigo-900",
      badge: "bg-[#10B981] text-white",
    },
  },
  {
    id: "ALTO_RENDIMIENTO",
    name: "Alto Rendimiento",
    tagline: "Máxima capacidad para clubes grandes.",
    priceMonthly: 80000,
    priceYearly: 800000,
    currency: "$",
    isPopular: false,
    buttonText: "Contactar Ventas",
    limits: {
      schools: 1,
      categories: "Ilimitadas",
      players: "Ilimitados", // Soporta 500+
      coaches: "Ilimitados",
      directors: 4,
    },
    features: [
      { text: "Sin límites de usuarios", included: true },
      { text: "Soporte VIP (WhatsApp Directo)", included: true },
      { text: "Reportes Financieros Exportables", included: true },
      { text: "Evaluaciones de Rendimiento Pro", included: true },
      { text: "Auditoría de Accesos", included: true },
    ],
    styles: {
      card: "bg-gradient-to-b from-slate-900 to-slate-800 text-white border-slate-700",
      button: "bg-[#10B981] text-white hover:bg-emerald-600",
    },
  },
];

export const SPECIAL_PLANS = {
  GOLD: {
    name: "Gold / Network",
    description: "Para franquicias y filiales (ej: Colo-Colo).",
    priceNote: "$40.000 por sede extra",
    features: [
      'Dashboard Centralizado ("Vista de Águila")',
      "Mover jugadores entre sedes",
      "Caja única",
    ],
  },
  INSTITUTIONAL: {
    name: "Institucional & Gobierno",
    description: "Para Municipalidades y Corporaciones de Deporte.",
    priceNote: "Vía Licitación / Convenio",
    features: [
      "Gratuidad para apoderados (Sin módulo de cobro)",
      "Reportes de Impacto Social",
      "Justificación de Fondos",
    ],
  },
};
