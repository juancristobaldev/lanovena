"use client";

import { gql } from "@apollo/client";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
// Importamos los iconos de Lucide
import {
  User,
  Bell,
  Clock,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  ChevronRight,
  Shield,
  Sprout,
  LandPlot,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";

// --- GRAPHQL QUERY ---
export const GET_COACH_DASHBOARD = gql`
  query GetCoachDashboard {
    meCoach {
      id
      fullName
      coachProfile {
        id
        categories {
          id
          name
          type # FORMATIVA o SELECTIVA
          sessions {
            id
            date
            category {
              name
            }
          }
        }
      }
    }
  }
`;

// --- TYPES ---
interface Session {
  id: string;
  date: string;
  category: {
    name: string;
  };
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  type: "FORMATIVA" | "SELECTIVA";
  sessions: Session[];
}

interface CoachData {
  meCoach: {
    id: string;
    fullName: string;
    coachProfile: {
      id: string;
      categories: Category[];
    };
  };
}

// --- COMPONENT ---
export default function CoachDashboard() {
  const { data, loading, error } = useQuery<CoachData>(GET_COACH_DASHBOARD, {
    fetchPolicy: "network-only",
  });

  // Lógica inteligente para determinar la "Próxima Sesión"
  const nextSession = useMemo(() => {
    if (!data?.meCoach?.coachProfile?.categories) return null;

    const allSessions: Session[] = [];
    const now = new Date();
    // Mantenemos visible la sesión actual hasta 1 hora después de iniciada
    now.setHours(now.getHours() - 1);

    data.meCoach.coachProfile.categories.forEach((cat) => {
      cat.sessions.forEach((sess) => {
        allSessions.push({ ...sess, categoryName: cat.name });
      });
    });

    const upcoming = allSessions
      .filter((s) => new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [data]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState />;

  const coachName = data?.meCoach?.fullName.split(" ")[0] || "Profe";
  const categories = data?.meCoach?.coachProfile?.categories || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      {/* HEADER: Identidad La Novena */}
      <header className="bg-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-sm mb-6 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <h1 className="text-2xl font-bold text-[#312E81]">
              Hola, {coachName}{" "}
              <span className="animate-pulse inline-block">👋</span>
            </h1>
          </div>

          <div className="relative">
            <button className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-[#312E81] hover:bg-indigo-100 transition-colors active:scale-95">
              <Bell className="w-5 h-5" />
            </button>
            {/* Indicador de notificación (ejemplo visual) */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></span>
          </div>
        </div>
      </header>

      <div className="px-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. HERO CARD: PRÓXIMA ACTIVIDAD */}
        <section>
          <div className="flex justify-between items-end mb-3 px-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Tu Pizarra Hoy
            </h2>
            {nextSession && isToday(new Date(nextSession.date)) && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                EN CURSO
              </span>
            )}
          </div>

          {nextSession ? (
            <Link href={`/dashboard/coach/session/${nextSession.id}`}>
              <div className="group relative bg-gradient-to-br from-[#312E81] to-[#4F46E5] rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 active:scale-[0.98] transition-all overflow-hidden">
                {/* Background Decor (Identity) */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-[0.08] rounded-full blur-3xl group-hover:opacity-[0.12] transition-opacity"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-[#10B981] opacity-20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 shadow-sm inline-flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-100" />
                      {isToday(new Date(nextSession.date))
                        ? "HOY"
                        : isTomorrow(new Date(nextSession.date))
                          ? "MAÑANA"
                          : format(new Date(nextSession.date), "dd MMM", {
                              locale: es,
                            })}
                    </div>
                    {/* Icono temático */}
                    <LandPlot
                      className="w-7 h-7 text-emerald-300 opacity-90"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight leading-tight mb-2">
                      {nextSession.categoryName}
                    </h3>
                    <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
                      <Clock className="w-4 h-4 text-emerald-300" />
                      <span className="tabular-nums">
                        {format(new Date(nextSession.date), "HH:mm")} hrs
                      </span>
                      <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                      <span>Entrenamiento</span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide group-hover:text-white transition-colors">
                      Ir al panel de sesión
                    </span>
                    <div className="bg-white text-[#312E81] rounded-full p-2 shadow-sm group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            // Empty State
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <CalendarDays className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-gray-800 font-bold text-lg">Día Libre</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-[200px]">
                No tienes sesiones programadas para las próximas horas.
              </p>
            </div>
          )}
        </section>

        {/* 2. ATAJOS RÁPIDOS (Grid UX) */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Botón 1: Agenda */}
            <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:bg-gray-50 active:scale-[0.98] transition-all group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <CalendarDays className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-[#312E81]">
                Ver Agenda
              </span>
            </button>

            {/* Botón 2: Asistencia Rápida */}
            <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:bg-gray-50 active:scale-[0.98] transition-all group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <ClipboardCheck className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-emerald-700">
                Asistencia Masiva
              </span>
            </button>
          </div>
        </section>

        {/* 3. MIS CATEGORÍAS */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Mis Planteles
          </h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <Link
                href={`/dashboard/coach/category/${cat.id}`}
                key={cat.id}
                className="block group"
              >
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-[0.99] transition-transform hover:shadow-md">
                  <div className="flex items-center gap-4">
                    {/* Icono dinámico según tipo de categoría (Formativa/Selectiva) */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                        cat.type === "SELECTIVA"
                          ? "bg-[#312E81] text-white"
                          : "bg-[#10B981] text-white"
                      }`}
                    >
                      {cat.type === "SELECTIVA" ? (
                        <Shield className="w-6 h-6" strokeWidth={1.5} />
                      ) : (
                        <Sprout className="w-6 h-6" strokeWidth={1.5} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-800 leading-tight text-base group-hover:text-[#312E81] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wide flex items-center gap-1">
                        {cat.type === "SELECTIVA"
                          ? "🏆 Competencia"
                          : "🌱 Formativa"}
                      </p>
                    </div>
                  </div>

                  <div className="text-gray-300 group-hover:text-[#312E81] transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}

            {categories.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
                <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">
                  No tienes categorías asignadas.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Componentes de Carga (Skeleton) ---
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-3 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      <div className="space-y-8">
        <div className="h-56 bg-gray-200 rounded-3xl animate-pulse shadow-sm"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <LandPlot className="w-8 h-8" />
      </div>
      <h3 className="text-[#312E81] font-bold text-lg">Error de conexión</h3>
      <p className="text-gray-400 text-sm mt-1 mb-6">
        No pudimos cargar tu pizarra táctica.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-[#312E81] text-white text-sm font-bold rounded-full shadow-lg active:scale-95 transition-transform"
      >
        Reintentar
      </button>
    </div>
  );
}
