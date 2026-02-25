"use client";

import React, { useState, useMemo, useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import Link from "next/link";
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
  CheckCircle2,
  School,
  ChevronDown,
  Loader2,
  Plus,
  Trash2, // <-- Agregado el icono de papelera
} from "lucide-react";
import { useUser } from "@/src/providers/me";
import { useAlert } from "@/src/providers/alert"; // <-- Importamos useAlert

// --- GRAPHQL QUERIES & MUTATIONS ---
const GET_CALENDAR_OF_SCHOOL = gql`
  query GetCalendarOfSchool($schoolId: ID!) {
    getCalendarOfSchool(schoolId: $schoolId) {
      id
      categories {
        id
        name
        sessions {
          id
          status
          date
          notes
        }
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
`;

const DELETE_TRAINING = gql`
  mutation DeleteTrainingSession($id: String!) {
    removeTrainingSession(id: $id) {
      id
    }
  }
`;

const DELETE_MATCH = gql`
  mutation DeleteMatch($id: String!) {
    removeMatch(id: $id) {
      id
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
  status?: string;
  rivalName?: string;
  isHome?: boolean;
  location?: string;
}

interface CalendarData {
  getCalendarOfSchool: {
    id: string;
    categories: {
      id: string;
      name: string;
      sessions: {
        id: string;
        status: string;
        date: string;
        notes?: string;
      }[];
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
}

export default function DirectorCalendarPage() {
  const { user, loading: userLoading } = useUser();
  const { showAlert } = useAlert(); // <-- Inicializamos las alertas
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "HISTORY">(
    "UPCOMING",
  );

  // --- ESCUELAS (Lógica del Director) ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERIES Y MUTATIONS ---
  // Obtenemos refetch para actualizar la lista post-eliminación
  const { data, loading, error, refetch } = useQuery<CalendarData>(
    GET_CALENDAR_OF_SCHOOL,
    {
      variables: { schoolId: selectedSchoolId },
      skip: !selectedSchoolId,
      fetchPolicy: "cache-and-network",
    },
  );

  const [deleteTraining] = useMutation(DELETE_TRAINING);
  const [deleteMatch] = useMutation(DELETE_MATCH);

  // Procesamiento y Unificación de Datos
  const { upcoming, history } = useMemo(() => {
    if (!data?.getCalendarOfSchool?.categories)
      return { upcoming: [], history: [] };

    const allEvents: EventItem[] = [];

    data.getCalendarOfSchool.categories.forEach((cat) => {
      cat.sessions.forEach((sess) => {
        allEvents.push({
          id: sess.id,
          type: "TRAINING",
          date: sess.date,
          notes: sess.notes,
          status: sess.status,
          categoryName: cat.name,
        });
      });

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
    now.setHours(now.getHours() - 2);

    const upcomingEvents = allEvents
      .filter((e) => {
        if (e.type === "TRAINING" && e.status === "COMPLETED") return false;
        return new Date(e.date) >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const historyEvents = allEvents
      .filter((e) => {
        if (e.type === "TRAINING" && e.status === "COMPLETED") return true;
        return new Date(e.date) < now;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      upcoming: upcomingEvents,
      history: historyEvents,
    };
  }, [data]);

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );
  const currentList = activeTab === "UPCOMING" ? upcoming : history;

  // --- HANDLERS ---
  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    type: EventType,
  ) => {
    // Prevenimos que el click dispare la navegación del <Link>
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      if (type === "TRAINING") {
        await deleteTraining({ variables: { id } });
      } else {
        await deleteMatch({ variables: { id } });
      }

      showAlert("Evento eliminado correctamente", "success");
      refetch(); // Recargamos los datos para reflejar el cambio
    } catch (err: any) {
      console.error(err);
      showAlert(
        err.message || "Ocurrió un error al intentar eliminar el evento",
        "error",
      );
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando agenda...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in font-sans">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2 flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-[#10B981]" />
            Agenda General
          </h1>
          <p className="text-gray-500 text-lg">
            Revisa todos los eventos, entrenamientos y partidos del club.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {availableSchools.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 min-w-[240px] w-full sm:w-auto">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <School className="w-4 h-4 text-[#312E81]" />
              </div>
              <div className="relative flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Escuela Seleccionada
                </span>
                {availableSchools.length > 1 ? (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="bg-transparent font-bold text-[#312E81] text-sm outline-none w-full appearance-none cursor-pointer"
                  >
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-[#312E81] text-sm block truncate">
                    {currentSchool?.name}
                  </span>
                )}
              </div>
              {availableSchools.length > 1 && (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}

          <Link
            href="/dashboard/director/calendar/new"
            className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-95 w-full sm:w-auto"
          >
            <Plus strokeWidth={3} className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Actividad</span>
            <span className="sm:hidden">Crear</span>
          </Link>
        </div>
      </div>

      {/* 2. TABS DE NAVEGACIÓN */}
      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 flex max-w-md">
        <button
          onClick={() => setActiveTab("UPCOMING")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === "UPCOMING"
              ? "bg-[#10B981] text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Próximos ({upcoming.length})
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

      {/* 3. LISTA DE EVENTOS */}
      {loading ? (
        <LoadingList />
      ) : error ? (
        <div className="text-center py-12 px-6 bg-red-50 rounded-2xl border border-red-100">
          <h3 className="text-red-500 font-bold mb-2">Error de carga</h3>
          <p className="text-sm text-red-400 mb-4">
            No pudimos obtener la agenda de esta escuela.
          </p>
          <button
            onClick={() => refetch()}
            className="text-[#312E81] font-bold text-sm hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          {currentList.length > 0 ? (
            currentList.map((event) => {
              const eventDate = new Date(event.date);
              const isTodayEvent = isToday(eventDate);
              const isMatch = event.type === "MATCH";
              const isCompleted = event.status === "COMPLETED";

              return (
                <div
                  key={event.id}
                  className={`
                    bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-5 hover:shadow-md transition-all relative
                    ${isMatch ? "border-indigo-100 hover:border-indigo-300" : "border-emerald-100/50 hover:border-emerald-300"}
                    ${isCompleted ? "opacity-90 bg-gray-50/50" : ""} 
                  `}
                >
                  {/* FECHA */}
                  <div
                    className={`
                      flex flex-col items-center justify-center w-16 h-16 rounded-xl shrink-0 border transition-colors
                      ${
                        isMatch
                          ? activeTab === "UPCOMING"
                            ? "bg-indigo-50 border-indigo-100 text-[#312E81]"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                          : activeTab === "UPCOMING"
                            ? "bg-emerald-50 border-emerald-100 text-[#10B981]"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                      }
                    `}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {format(eventDate, "MMM", { locale: es })}
                    </span>
                    <span className="text-2xl font-black leading-none mt-0.5">
                      {format(eventDate, "dd")}
                    </span>
                  </div>

                  {/* INFO CENTRAL */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isTodayEvent &&
                        activeTab === "UPCOMING" &&
                        !isCompleted && (
                          <span className="bg-[#10B981] text-white text-[9px] px-2 py-0.5 rounded-md font-bold tracking-wide animate-pulse">
                            HOY
                          </span>
                        )}

                      {isCompleted && (
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide flex items-center gap-1">
                          <CheckCircle2 size={12} /> FINALIZADO
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1
                          ${
                            isMatch
                              ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                              : "text-gray-500 bg-gray-50 border-gray-200"
                          }
                        `}
                      >
                        {isMatch ? (
                          <Trophy size={10} />
                        ) : (
                          <Dumbbell size={10} />
                        )}
                        {isMatch ? "Partido" : "Entrenamiento"}
                      </span>

                      <span className="text-xs font-bold text-gray-400 truncate bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {event.categoryName}
                      </span>
                    </div>

                    <h3
                      className={`font-bold text-base md:text-lg truncate mb-1.5 pr-8 ${isMatch ? "text-[#312E81]" : "text-gray-900"}`}
                    >
                      {isMatch ? `vs ${event.rivalName}` : "Sesión Técnica"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5 font-medium bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {format(eventDate, "HH:mm")}
                      </div>

                      {isMatch ? (
                        <>
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${event.isHome ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                          >
                            {event.isHome ? (
                              <Home size={12} />
                            ) : (
                              <Plane size={12} />
                            )}
                            {event.isHome ? "Local" : "Visita"}
                          </div>
                          {event.location && !event.isHome && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <MapPin size={14} />
                              <span className="truncate max-w-[150px]">
                                {event.location}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        event.notes && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <NotebookPen className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">
                              {event.notes}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN (Derecha) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, event.id, event.type)}
                      className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors z-10"
                      title="Eliminar evento"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 px-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm text-gray-300">
                <CalendarCheck className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-1">
                Sin eventos{" "}
                {activeTab === "UPCOMING" ? "pendientes" : "pasados"}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm">
                {activeTab === "UPCOMING"
                  ? "No hay entrenamientos ni partidos agendados próximamente para las series de esta escuela."
                  : "No hay registros antiguos en el historial para mostrar."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- UTILS COMPONENTS ---
function LoadingList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white h-[104px] rounded-2xl animate-pulse shadow-sm border border-gray-100 p-5"
        >
          <div className="flex gap-5 h-full items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-gray-100 rounded w-1/4"></div>
              <div className="h-5 bg-gray-100 rounded w-2/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
