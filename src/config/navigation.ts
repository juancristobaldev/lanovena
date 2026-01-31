// src/config/navigation.ts
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  Settings,
  ShieldCheck,
  Baby,
  Trophy,
  Megaphone,
  ShoppingBag,
  Balloon,
  GroupIcon,
} from "lucide-react";

// Tipos de roles basados en tu Prisma Schema y Docs
export type UserRole = "SUPERADMIN" | "DIRECTOR" | "COACH" | "GUARDIAN";

export const MENU_ITEMS = {
  SUPERADMIN: [
    {
      title: "Panel de Control",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Gestión de Escuelas",
      href: "/dashboard/admin/schools",
      icon: ShieldCheck,
    },
    {
      title: "Finanzas Globales",
      href: "/dashboard/admin/finance",
      icon: CreditCard,
    },
  ],
  DIRECTOR: [
    {
      title: "Mis Escuelas",
      href: "/dashboard/director",
      icon: LayoutDashboard,
    },
    {
      title: "Categorias",
      href: "/dashboard/director/categories",
      icon: GroupIcon,
    },
    {
      title: "Finanzas",
      href: "/dashboard/director/finance",
      icon: CreditCard,
    },
    { title: "Profesores", href: "/dashboard/director/coachs", icon: Users },

    {
      title: "Apoderados",
      href: "/dashboard/director/guardian",
      icon: Baby,
    },
    {
      title: "Jugadores",
      href: "/dashboard/director/players",
      icon: Balloon,
    },
    {
      title: "Configuración",
      href: "/dashboard/director/settings",
      icon: Settings,
    },
  ],
  COACH: [
    // Entrenador
    { title: "Mis Categorías", href: "/dashboard/coach", icon: Users },
    {
      title: "Planificación",
      href: "/dashboard/coach/planning",
      icon: CalendarDays,
    },
    {
      title: "Evaluaciones",
      href: "/dashboard/coach/evaluations",
      icon: Trophy,
    },
  ],
  GUARDIAN: [
    // Apoderado
    { title: "Mis Jugadores", href: "/dashboard/guardian", icon: Baby },
    {
      title: "Agenda & Partidos",
      href: "/dashboard/guardian/schedule",
      icon: CalendarDays,
    },
    {
      title: "Pagos / Credencial",
      href: "/dashboard/guardian/payments",
      icon: CreditCard,
    },
    {
      title: "Tienda Oficial",
      href: "/dashboard/guardian/store",
      icon: ShoppingBag,
    },
  ],
};
