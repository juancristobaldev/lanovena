"use client";

import { gql } from "@apollo/client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  History,
  Clock,
  ChevronRight,
  CalendarCheck,
  NotebookPen,
  Trophy,
  MapPin,
  Plane,
  Home,
  Dumbbell,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";

// --- GRAPHQL QUERY ACTUALIZADA ---
export const GET_ALL_COACH_EVENTS = gql`
  query GetAllCoachEvents {
    meCoach {
      id
      coachProfile {
        categories {
          id
          name
          # 1. Traemos Entrenamientos
          sessions {
            id
            date
            notes
          }
          # 2. Traemos Partidos (Con sus campos específicos)
          matches {
            id
            date
            rivalName
            isHome
            location
            notes
          }
        }
      }
    }
  }
`;

// --- TYPES ---
type EventType = "TRAINING" | "MATCH";

interface EventItem {
  id: string;
  type: EventType;
  date: string;
  categoryName: string;
  notes?: string;
  // Campos específicos de Match
  rivalName?: string;
  isHome?: boolean;
  location?: string;
}

interface CoachData {
  meCoach: {
    coachProfile: {
      categories: {
        id: string;
        name: string;
        sessions: { id: string; date: string; notes?: string }[];
        matches: {
          id: string;
          date: string;
          rivalName: string;
          isHome: boolean;
          location: string;
          notes?: string;
        }[];
      }[];
    };
  };
}

// --- COMPONENT ---
export default function SessionsRegistryPage() {
  const { data, loading, error } = useQuery<CoachData>(GET_ALL_COACH_EVENTS, {
    fetchPolicy: "cache-and-network",
  });

  const [activeTab, setActiveTab] = useState<"UPCOMING" | "HISTORY">(
    "UPCOMING",
  );

  // Procesamiento y Unificación de Datos
  const { upcoming, history } = useMemo(() => {
    if (!data?.meCoach?.coachProfile?.categories)
      return { upcoming: [], history: [] };

    const allEvents: EventItem[] = [];

    data.meCoach.coachProfile.categories.forEach((cat) => {
      // 1. Procesar Entrenamientos
      cat.sessions.forEach((sess) => {
        allEvents.push({
          id: sess.id,
          type: "TRAINING",
          date: sess.date,
          notes: sess.notes,
          categoryName: cat.name,
        });
      });

      // 2. Procesar Partidos
      cat.matches.forEach((match) => {
        allEvents.push({
          id: match.id,
          type: "MATCH",
          date: match.date,
          notes: match.notes,
          categoryName: cat.name,
          rivalName: match.rivalName,
          isHome: match.isHome,
          location: match.location,
        });
      });
    });

    const now = new Date();
    now.setHours(now.getHours() - 2); // Tolerancia de 2 horas

    return {
      upcoming: allEvents
        .filter((e) => new Date(e.date) >= now)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      history: allEvents
        .filter((e) => new Date(e.date) < now)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    };
  }, [data]);

  if (loading) return <LoadingList />;
  if (error) return <ErrorState />;

  const currentList = activeTab === "UPCOMING" ? upcoming : history;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* HEADER */}
      <div className="bg-[#312E81] pt-10 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Mi Agenda
            </h1>
            <p className="text-indigo-200 text-sm mt-1 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              Partidos y Entrenamientos
            </p>
          </div>
          <div className="bg-indigo-700/50 backdrop-blur-sm px-3 py-1 rounded-full border border-indigo-500/30">
            <span className="text-xs font-bold text-indigo-100">
              {upcoming.length} Pendientes
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-20">
        {/* TABS DE NAVEGACIÓN */}
        <div className="bg-white p-1.5 rounded-xl shadow-md border border-gray-100 flex mb-6">
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeTab === "UPCOMING"
                ? "bg-[#10B981] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Próximos
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeTab === "HISTORY"
                ? "bg-[#312E81] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
        </div>

        {/* LISTA DE EVENTOS */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentList.length > 0 ? (
            currentList.map((event) => {
              const eventDate = new Date(event.date);
              const isTodayEvent = isToday(eventDate);
              const isMatch = event.type === "MATCH";

              // Link dinámico según el tipo
              const linkHref = isMatch
                ? `/dashboard/coach/match/${event.id}`
                : `/dashboard/coach/session/${event.id}`;

              return (
                <Link key={event.id} href={linkHref}>
                  <div
                    className={` mt-4
                    bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 group active:scale-[0.98] transition-all
                    ${isMatch ? "border-indigo-100 hover:border-indigo-200" : "border-emerald-100/50 hover:border-emerald-200"}
                  `}
                  >
                    {/* FECHA (Columna Izquierda) */}
                    <div
                      className={`
                      flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 border transition-colors
                      ${
                        isMatch
                          ? activeTab === "UPCOMING"
                            ? "bg-indigo-50 border-indigo-100 text-[#312E81]"
                            : "bg-gray-50 text-gray-400"
                          : activeTab === "UPCOMING"
                            ? "bg-emerald-50 border-emerald-100 text-[#10B981]"
                            : "bg-gray-50 text-gray-400"
                      }
                    `}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {format(eventDate, "MMM", { locale: es })}
                      </span>
                      <span className="text-xl font-black leading-none mt-0.5">
                        {format(eventDate, "dd")}
                      </span>
                    </div>

                    {/* INFO CENTRAL */}
                    <div className="flex-1 min-w-0">
                      {/* Badge Superior */}
                      <div className="flex items-center gap-2 mb-1">
                        {isTodayEvent && activeTab === "UPCOMING" && (
                          <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wide animate-pulse">
                            HOY
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-1.5 rounded border uppercase tracking-wider flex items-center gap-1
                          ${
                            isMatch
                              ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                              : "text-gray-500 bg-gray-50 border-gray-100"
                          }
                        `}
                        >
                          {isMatch ? (
                            <Trophy size={8} />
                          ) : (
                            <Dumbbell size={8} />
                          )}
                          {isMatch ? "Partido" : "Práctica"}
                        </span>
                        <span className="text-xs text-gray-400 font-medium truncate">
                          | {event.categoryName}
                        </span>
                      </div>

                      {/* Título Principal */}
                      <h3
                        className={`font-bold truncate text-sm mb-1 ${isMatch ? "text-[#312E81]" : "text-gray-800"}`}
                      >
                        {isMatch
                          ? `vs ${event.rivalName}`
                          : "Entrenamiento Técnico"}
                      </h3>

                      {/* Info Secundaria */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {format(eventDate, "HH:mm")}
                        </div>

                        {isMatch ? (
                          // Info específica de partido
                          <>
                            <div
                              className={`flex items-center gap-1 px-1.5 rounded text-[10px] font-bold border ${event.isHome ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                            >
                              {event.isHome ? (
                                <Home size={10} />
                              ) : (
                                <Plane size={10} />
                              )}
                              {event.isHome ? "Local" : "Visita"}
                            </div>
                            {event.location && !event.isHome && (
                              <div className="flex items-center gap-1 max-w-[80px]">
                                <MapPin size={10} />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          // Info específica de entrenamiento
                          event.notes && (
                            <div className="flex items-center gap-1 max-w-[120px]">
                              <NotebookPen className="w-3.5 h-3.5" />
                              <span className="truncate">{event.notes}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* FLECHA ACCIÓN */}
                    <div className="text-gray-300 group-hover:text-indigo-400 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <CalendarCheck className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-gray-900 font-bold text-sm">
                Sin eventos{" "}
                {activeTab === "UPCOMING" ? "pendientes" : "pasados"}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {activeTab === "UPCOMING"
                  ? "Tu calendario está despejado por ahora."
                  : "No hay registros en el historial."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- UTILS COMPONENTS ---
function LoadingList() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="h-12 bg-white rounded-xl shadow-sm mb-6 w-full animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white h-24 rounded-2xl animate-pulse shadow-sm border border-gray-100 p-4"
          >
            <div className="flex gap-4 h-full">
              <div className="w-14 h-full bg-gray-100 rounded-xl"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-5 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h3 className="text-red-500 font-bold">Error de carga</h3>
      <p className="text-gray-400 text-sm mb-4">
        No pudimos obtener tu agenda.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-indigo-600 underline text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}
