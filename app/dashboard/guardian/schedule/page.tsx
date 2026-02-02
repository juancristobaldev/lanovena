"use client";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

export const GET_MY_PLAYERS_SCHEDULE = gql`
  query GetMyPlayersSchedule {
    meGuardian {
      id
      managedPlayers {
        id
        firstName
        lastName
        photoUrl
        category {
          id
          name
          # En una implementación real, aquí deberíamos pasar filtros de fecha (start, end)
          sessions {
            id
            date
            notes
          }
          matches {
            id
            date
            rivalName
            isHome
            location
          }
        }
      }
    }
  }
`;

import { format, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";

export type EventType = "MATCH" | "TRAINING";

export interface ScheduleEvent {
  id: string;
  type: EventType;
  date: string | Date;
  title: string;
  subtitle?: string;
  location?: string | null;
  isHome?: boolean; // Solo para partidos
}

interface EventCardProps {
  event: ScheduleEvent;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const isMatch = event.type === "MATCH";

  return (
    <div className="flex group mb-4">
      {/* Columna Fecha (Izquierda) */}
      <div className="w-16 flex flex-col items-center justify-start pt-1 mr-3 shrink-0">
        <span className="text-xs font-bold text-gray-400 uppercase">
          {format(eventDate, "EEE", { locale: es })}
        </span>
        <span
          className={`text-2xl font-black ${isMatch ? "text-[#312E81]" : "text-gray-700"}`}
        >
          {format(eventDate, "dd")}
        </span>
      </div>

      {/* Tarjeta Contenido */}
      <div
        className={`flex-1 rounded-2xl p-4 shadow-sm border transition-all relative overflow-hidden ${
          isMatch
            ? "bg-white border-indigo-100 shadow-indigo-100" // Estilo Partido
            : "bg-gray-50 border-gray-100" // Estilo Entrenamiento
        }`}
      >
        {/* Decoración lateral para partidos */}
        {isMatch && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#312E81]"></div>
        )}

        <div className="flex justify-between items-start mb-2">
          {/* Badge de Tipo */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              isMatch
                ? "bg-indigo-100 text-indigo-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isMatch ? "Partido Oficial" : "Entrenamiento"}
          </span>

          {/* Hora */}
          <div className="flex items-center text-xs font-bold text-gray-500 bg-white/50 px-2 rounded-md">
            🕒 {format(eventDate, "HH:mm")}
          </div>
        </div>

        {/* Título Principal */}
        <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
          {event.title}
        </h3>

        {/* Subtítulo (Rival o Notas) */}
        {event.subtitle && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
            {event.subtitle}
          </p>
        )}

        {/* Footer: Ubicación */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100/50">
          {event.location ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              <span>📍</span>
              <span className="truncate max-w-[150px]">{event.location}</span>
            </div>
          ) : (
            // Si no hay ubicación específica, asumimos cancha base
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>📍</span>
              <span>Cancha Escuela</span>
            </div>
          )}

          {/* Indicador Local/Visita (Solo Partidos) */}
          {isMatch && (
            <span className="text-xs font-bold text-[#312E81] ml-auto">
              {event.isHome ? "🏠 Local" : "✈️ Visita"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuardianSchedulePage() {
  const { data, loading, error }: any = useQuery(GET_MY_PLAYERS_SCHEDULE, {
    fetchPolicy: "cache-and-network",
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const players = data?.meGuardian?.managedPlayers || [];

  // Auto-seleccionar primer hijo
  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  // PROCESAMIENTO DE DATOS: Mezclar Sesiones y Partidos
  const events = useMemo(() => {
    if (!selectedPlayerId) return [];

    const currentPlayer = players.find((p: any) => p.id === selectedPlayerId);
    if (!currentPlayer?.category) return [];

    const category = currentPlayer.category;
    const now = new Date();
    // Retrocedemos 2 horas para no borrar eventos que acaban de empezar
    now.setHours(now.getHours() - 2);

    const rawEvents: ScheduleEvent[] = [];

    // 1. Procesar Entrenamientos
    category.sessions?.forEach((session: any) => {
      rawEvents.push({
        id: session.id,
        type: "TRAINING",
        date: session.date,
        title: "Entrenamiento",
        subtitle: session.notes || "Práctica regular",
      });
    });

    // 2. Procesar Partidos
    category.matches?.forEach((match: any) => {
      rawEvents.push({
        id: match.id,
        type: "MATCH",
        date: match.date,
        title: `vs ${match.rivalName}`, // "vs Colo-Colo"
        subtitle: match.isHome ? "Jugamos en casa" : "Partido de visita",
        location: match.location,
        isHome: match.isHome,
      });
    });

    // 3. Filtrar Pasados y Ordenar Cronológicamente
    return rawEvents
      .filter((e) => new Date(e.date) >= now) // Solo futuros
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [players, selectedPlayerId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 pt-8 pb-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-[#312E81]">Agenda</h1>
        <p className="text-gray-500 text-sm">Próximas actividades</p>

        {/* Selector de Hijos (Tipo Tabs) */}
        {players.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
            {players.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  selectedPlayerId === p.id
                    ? "bg-[#312E81] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.firstName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenido de la Agenda */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Renderizado agrupado (opcional) o lista simple */}
            {events.map((event, index) => {
              // Mostrar separador de mes si cambia respecto al anterior
              const showMonthHeader =
                index === 0 ||
                !isSameMonth(
                  new Date(event.date),
                  new Date(events[index - 1].date),
                );

              return (
                <div key={event.id}>
                  {showMonthHeader && (
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 mt-2 ml-16">
                      {format(new Date(event.date), "MMMM yyyy", {
                        locale: es,
                      })}
                    </h2>
                  )}
                  <EventCard event={event} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Subcomponentes de Estado (Inline para simplicidad) ---

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-12">
      <div className="h-8 w-32 bg-gray-200 rounded mb-8 animate-pulse"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 mb-6">
          <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0 animate-pulse"></div>
          <div className="flex-1 h-24 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <div className="text-red-500 text-5xl mb-4">📅</div>
      <h3 className="font-bold text-gray-800">Error de conexión</h3>
      <p className="text-gray-500 text-sm">No pudimos cargar el calendario.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-white p-6 rounded-full shadow-sm mb-4">
        <span className="text-4xl">😴</span>
      </div>
      <h3 className="font-bold text-[#312E81] text-lg">
        Sin actividades pronto
      </h3>
      <p className="text-gray-500 text-sm mt-2 max-w-[250px]">
        No hay entrenamientos ni partidos programados para los próximos días. ¡A
        descansar!
      </p>
    </div>
  );
}
