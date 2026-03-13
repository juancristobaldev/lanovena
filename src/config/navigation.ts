// src/config/navigation.tssss
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
  BarChart3,
  Filter,
  Receipt,
  Building2,
  BookOpen,
  ClipboardCheck,
  Send,
  LifeBuoy,
  UserCog,
} from "lucide-react";

// Tipos de roles basados en tu Prisma Schema y Docs
export type UserRole = "SUPERADMIN" | "DIRECTOR" | "COACH" | "GUARDIAN";

export const MENU_ITEMS = {
  SUPERADMIN: [
    {
      title: "Visión General",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Estadísticas & Data",
      href: "/dashboard/admin/estadistics",
      icon: BarChart3,
    },
    { title: "Embudo CRM", href: "/dashboard/admin/crm", icon: Filter },
    {
      title: "Facturación SII",
      href: "/dashboard/admin/billing",
      icon: Receipt,
    },

    // Clientes (Tenants)
    {
      title: "Macro Entidades",
      href: "/dashboard/admin/clients/institutionals",
      icon: Building2,
    },
    {
      title: "Escuelas Base",
      href: "/dashboard/admin/clients/schools",
      icon: ShieldCheck,
    },

    // Medios / Contenidos
    {
      title: "Biblioteca Maestra",
      href: "/dashboard/admin/medias/library",
      icon: BookOpen,
    },
    {
      title: "Banco de Tests",
      href: "/dashboard/admin/medias/tests",
      icon: ClipboardCheck,
    },

    // Operaciones
    {
      title: "Monitor Ligas",
      href: "/dashboard/admin/operations/leagues",
      icon: Trophy,
    },
    {
      title: "Avisos (Push)",
      href: "/dashboard/admin/operations/comunications",
      icon: Send,
    },
    {
      title: "Soporte Técnico",
      href: "/dashboard/admin/operations/support",
      icon: LifeBuoy,
    },

    // Sistema
    {
      title: "Mi Equipo",
      href: "/dashboard/admin/system/teams",
      icon: UserCog,
    },
    {
      title: "Ajustes Sistema",
      href: "/dashboard/admin/system/settings",
      icon: Settings,
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
    {
      title: "Noticias",
      href: "/dashboard/coach/notices",
      icon: Newspaper,
    },
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
      title: "Noticias",
      href: "/dashboard/director/notices",
      icon: Newspaper,
    },
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
