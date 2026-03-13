"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/src/providers/me";

// Iconos de Lucide
import {
  ChevronDown,
  Plus,
  School,
  CalendarDays,
  Users,
  CircleDollarSign,
  ClipboardList,
  Settings,
  ShieldAlert,
  GraduationCap,
  BellRing,
  Activity,
  CreditCard,
  UsersRound,
  LayoutDashboard,
  Baby,
} from "lucide-react";

// 1. DICCIONARIO DE RUTAS (Route Configuration)
// Esto evita decenas de if/else y mantiene el código escalable.
const ROUTE_CONFIG: Record<string, any> = {
  "/dashboard/director": {
    title: "Vista General",
    desc: "Métricas y resumen de tu escuela deportiva.",
    icon: LayoutDashboard,
    ctaText: null, // Sin botón primario aquí
    ctaLink: null,
  },
  guardian: {
    title: "Apoderados",
    desc: "Administra los apoderados de tus jugadores y escuelas.",
    icon: Baby,
    ctaText: "Nuevo Apoderado",
    ctaLink: "/dashboard/director/guardian/create",
  },
  calendar: {
    title: "Calendario",
    desc: "Revisa todos los eventos, entrenamientos y partidos del club.",
    icon: CalendarDays,
    ctaText: "Nueva Actividad",
    ctaLink: "/dashboard/director/calendar/new",
  },
  players: {
    title: "Padrón de Jugadores",
    desc: "Gestiona fichas médicas, datos y categorías de tus alumnos.",
    icon: Users,
    ctaText: "Nuevo Jugador",
    ctaLink: "/dashboard/director/players/create",
  },
  finance: {
    title: "Finanzas y Pagos",
    desc: "Control de recaudación, morosidad y mensualidades.",
    icon: CircleDollarSign,
    ctaText: "Registrar Pago",
    ctaLink: "/dashboard/director/finance/new",
  },
  tasks: {
    title: "Gestión de Tareas",
    desc: "Asigna tareas y evaluaciones a tu cuerpo técnico.",
    icon: ClipboardList,
    ctaText: "Crear Tarea",
    ctaLink: "/dashboard/director/tasks/new",
  },
  categories: {
    title: "Categorías",
    desc: "Administra las series y divisiones de tu escuela.",
    icon: GraduationCap,
    ctaText: null,
    ctaLink: null,
  },
  coachs: {
    // Nota: Gramaticalmente es 'coaches', pero respeto tu carpeta
    title: "Cuerpo Técnico",
    desc: "Administra los accesos y roles de tus profesores.",
    icon: ShieldAlert,
    ctaText: "Crear Entrenador",
    ctaLink: "/dashboard/director/coachs/create",
  },
  exercises: {
    title: "Biblioteca de Ejercicios",
    desc: "Metodologías y ejercicios estructurados para entrenamientos.",
    icon: Activity,
    ctaText: "Subir Ejercicio",
    ctaLink: "/dashboard/director/exercises/create",
  },
  team: {
    title: "Equipos Competitivos",
    desc: "Arma planteles oficiales para ligas y torneos.",
    icon: UsersRound,
    ctaText: null, // Sin botón primario aquí
    ctaLink: null,
  },
  notices: {
    title: "Avisos y Muro",
    desc: "Comunícate masivamente con los apoderados.",
    icon: BellRing,
    ctaText: "Publicar Aviso",
    ctaLink: "/dashboard/director/notices/new",
  },
  subscription: {
    title: "Mi Suscripción",
    desc: "Gestiona tu plan activo de La Novena y facturación.",
    icon: CreditCard,
    ctaText: "Mejorar Plan",
    ctaLink: "/dashboard/director/subscription/upgrade",
  },
  settings: {
    title: "Configuración",
    desc: "Ajustes generales, colores y datos de tu institución.",
    icon: Settings,
    ctaText: null,
    ctaLink: null,
  },
};

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useUser();
  const pathname = usePathname(); // Hook de Next.js para saber dónde estamos
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // 2. OBTENER METADATOS DE LA RUTA ACTUAL
  // Extraemos el segmento principal de la ruta (ej: de "/dashboard/director/calendar/new" extraemos "calendar")
  const currentSegment = pathname.split("/")[3];
  const currentMeta =
    currentSegment && ROUTE_CONFIG[currentSegment]
      ? ROUTE_CONFIG[currentSegment]
      : ROUTE_CONFIG["/dashboard/director"]; // Fallback a la vista general

  const PageIcon = currentMeta.icon;

  // Lógica de Escuelas (Sin cambios)
  const availableSchools = useMemo(() => {
    if (!user) return [];
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full">
      {/* HEADER DINÁMICO (Aislado del contenido) */}
      <header className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Título, Icono y Descripción Dinámicos */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-[#312E81] rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
              <PageIcon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {currentMeta.title}
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-0.5">
                {currentMeta.desc}
              </p>
            </div>
          </div>

          {/* Acciones (Selector + CTA) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
            {/* Selector de Escuelas */}
            {availableSchools.length > 0 && (
              <div className="relative group bg-slate-50 border border-slate-200 hover:border-[#312E81]/30 transition-colors shadow-sm rounded-xl px-4 py-2 flex items-center gap-3 min-w-[240px] w-full sm:w-auto focus-within:ring-2 focus-within:ring-[#312E81]/20">
                <School className="w-5 h-5 text-slate-400 group-hover:text-[#312E81] transition-colors" />
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                    Escuela Activa
                  </span>
                  {availableSchools.length > 1 ? (
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="bg-transparent font-bold text-slate-900 text-sm outline-none w-full appearance-none cursor-pointer truncate"
                    >
                      {availableSchools.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-slate-900 text-sm block truncate">
                      {currentSchool?.name}
                    </span>
                  )}
                </div>
                {availableSchools.length > 1 && (
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
                )}
              </div>
            )}

            {/* Botón CTA Dinámico (Solo renderiza si la ruta tiene ctaText) */}
            {currentMeta.ctaText && currentMeta.ctaLink && (
              <Link
                href={currentMeta.ctaLink}
                className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-95 w-full sm:w-auto outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
              >
                <Plus strokeWidth={3} className="w-5 h-5" />
                <span>{currentMeta.ctaText}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DE LA PÁGINA (Aislado) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}
