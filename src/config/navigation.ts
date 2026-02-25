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
  GalleryHorizontal,
  DnaIcon,
  IdCard,
  Medal,
  BicepsFlexed,
  Calendar,
  ListCheck,
  Newspaper,
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
      title: "Mi equipo",
      href: "/dashboard/director/team",
      icon: Users,
    },
    {
      title: "Noticias",
      href: "/dashboard/director/notices",
      icon: Newspaper,
    },
    {
      title: "Calendario",
      href: "/dashboard/director/calendar",
      icon: Calendar,
    },
    {
      title: "Tareas",
      href: "/dashboard/director/tasks",
      icon: ListCheck,
    },
    {
      title: "Ejercicios",
      href: "/dashboard/director/exercises",
      icon: BicepsFlexed,
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
      title: "Planificar",
      href: "/dashboard/coach/session/new",
      icon: Medal,
    },
    //http://localhost:3000/dashboard/coach/team
    {
      title: "Mi Plantel",
      href: "/dashboard/coach/team",
      icon: Users,
    },

    {
      title: "Agenda & Partidos",
      href: "/dashboard/coach/session",
      icon: CalendarDays,
    },
    {
      title: "Pizarra táctica",
      href: "/dashboard/coach/tactical-board",
      icon: Trophy,
    },
    {
      title: "Evaluaciones",
      href: "/dashboard/coach/tests",
      icon: Trophy,
    },
  ],
  GUARDIAN: [
    // Apoderado
    { title: "Mis Jugadores", href: "/dashboard/guardian", icon: Baby },
    {
      title: "Identificaciones",
      href: "/dashboard/guardian/carnet",
      icon: IdCard,
    },
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
      title: "Galería",
      href: "/dashboard/guardian/gallery",
      icon: GalleryHorizontal,
    },
  ],
};
