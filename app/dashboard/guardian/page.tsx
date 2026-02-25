"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  CalendarDays,
  CreditCard,
  QrCode,
  MapPin,
  Clock,
  Trophy,
  Swords,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Newspaper,
  User,
  ArrowUpRight,
  FileExclamationPoint,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
export const ATTENDANCE_STATUS = {
  PRESENT: {
    label: "Presente",
    color: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  ABSENT: {
    label: "Ausente",
    color: "bg-red-100 text-red-700",
    icon: <AlertCircle size={14} />,
  },
  EXCUSED: {
    label: "Justificado",
    color: "bg-amber-100 text-amber-700",
    icon: <Clock size={14} />,
  },
  LATE: {
    label: "Atraso",
    color: "bg-indigo-100 text-indigo-700",
    icon: <Clock size={14} />,
  },
  PENDING: {
    label: "Pendiente",
    color: "bg-amber-100 text-amber-700",
    icon: <FileExclamationPoint size={14} />,
  },
};

// === GRAPHQL ===
const GET_GUARDIAN_HOME = gql`
  query GetGuardianHome {
    meGuardian {
      id
      fullName
      school {
        id
        mode
      }
      managedPlayers {
        id
        firstName
        lastName
        photoUrl
        active
        attendace {
          id
          status
          notes
          createdAt
          rating
          feedback
        }
        category {
          id
          name
        }
        financialStatus {
          status
          debtAmount
        }
        nextEvent {
          id
          title
          date
          type
          location
          isCitado
        }
      }
    }
  }
`;

export default function GuardianDashboardPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const { data, loading }: any = useQuery(GET_GUARDIAN_HOME, {
    fetchPolicy: "network-only",
    pollInterval: 30000,
  });

  const guardian = data?.meGuardian;
  const players = guardian?.managedPlayers || [];
  const schoolMode = guardian?.school?.mode || "COMMERCIAL";

  // Auto-seleccionar el primer jugador al cargar
  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const currentPlayer = players.find((p: any) => p.id === selectedPlayerId);
  const nextEvent = currentPlayer?.nextEvent;

  // Lógica de fechas
  let eventDateStr = "";
  let eventTimeStr = "";
  if (nextEvent?.date) {
    const d = new Date(nextEvent.date);
    eventDateStr = d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    eventTimeStr = d.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Lógica Financiera
  const financeStatus = currentPlayer?.financialStatus?.status;
  const hasDebt = financeStatus === "OVERDUE";

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-[#312E81] w-10 h-10" />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* 1. HEADER & PLAYER SELECTOR */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Hola, {guardian?.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm">
              Aquí tienes el resumen de tu familia.
            </p>
          </div>
          {/* Botón de acción rápida global (Opcional) */}
          <button className="hidden md:flex items-center gap-2 text-sm font-bold text-[#312E81] hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
            <User size={18} /> Mi Perfil
          </button>
        </div>

        {/* SELECTOR DE JUGADORES (Tabs Superiores) */}
        {players.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-100">
            {players.map((player: any) => {
              const isSelected = player.id === selectedPlayerId;
              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`
                                group flex items-center gap-3 px-1 py-2 pr-4 rounded-t-xl border-b-2 transition-all min-w-[140px]
                                ${
                                  isSelected
                                    ? "border-[#312E81] bg-gradient-to-b from-indigo-50/50 to-transparent"
                                    : "border-transparent hover:bg-gray-50 text-gray-500"
                                }
                            `}
                >
                  <div
                    className={`
                                w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all
                                ${isSelected ? "border-[#312E81] shadow-md scale-105" : "border-gray-200 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}
                            `}
                  >
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {player.firstName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-left leading-tight">
                    <p
                      className={`text-sm font-bold ${isSelected ? "text-[#312E81]" : "text-gray-600"}`}
                    >
                      {player.firstName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[80px]">
                      {player.category?.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-100 flex items-center gap-2">
            <AlertCircle size={16} /> No tienes jugadores asociados. Contacta al
            director.
          </div>
        )}
      </header>

      {/* 2. CONTENIDO PRINCIPAL */}
      {currentPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* COLUMNA IZQUIERDA (Info Deportiva) */}
          <div className="lg:col-span-2 space-y-6">
            {/* PRÓXIMO EVENTO */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-8 rounded-full bg-[#312E81]"></span>
                  <h3 className="text-lg font-bold text-gray-900">
                    Próxima Actividad
                  </h3>
                </div>
                {nextEvent ? (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${nextEvent.type === "MATCH" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    {nextEvent.type === "MATCH" ? (
                      <Trophy size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {nextEvent.type === "MATCH" ? "Partido" : "Entrenamiento"}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                    Sin Agenda
                  </span>
                )}
              </div>

              {nextEvent ? (
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${nextEvent.type === "MATCH" ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"}`}
                    >
                      {nextEvent.type === "MATCH" ? (
                        <Swords size={32} />
                      ) : (
                        <CalendarDays size={32} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
                        {nextEvent.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1 text-gray-900">
                          <CalendarDays size={16} className="text-[#312E81]" />{" "}
                          {eventDateStr}
                        </span>
                        <span className="hidden md:inline text-gray-300">
                          |
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} className="text-[#312E81]" />{" "}
                          {eventTimeStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 border border-gray-100">
                    <MapPin
                      className="text-gray-400 mt-0.5 shrink-0"
                      size={18}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        Ubicación
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {nextEvent.location || "Cancha Principal"}
                      </p>
                    </div>
                    <a
                      href="#"
                      className="ml-auto text-xs font-bold text-[#312E81] hover:underline flex items-center gap-1"
                    >
                      Ver Mapa <ArrowUpRight size={12} />
                    </a>
                  </div>

                  {/* Citación Badge */}
                  {nextEvent.type === "MATCH" && nextEvent.isCitado && (
                    <div className="absolute top-0 right-0 mt-6 mr-6 hidden md:flex flex-col items-center animate-pulse">
                      <span className="text-2xl">⚽</span>
                      <span className="text-[10px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                        CITADO
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 opacity-60">
                  <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No hay eventos programados próximamente.
                  </p>
                </div>
              )}

              {/* Background Decoration */}
              <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                <Trophy size={200} />
              </div>
            </section>

            {/* NOVEDADES */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Newspaper size={18} className="text-[#312E81]" />
                <h3 className="font-bold text-gray-800">Tablón de Novedades</h3>
              </div>
              <div className="grid gap-3">
                {[1].map((i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#312E81] shrink-0 group-hover:scale-110 transition-transform">
                      <Newspaper size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#312E81] transition-colors">
                        Información Importante
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        Recordar llevar botella de agua individual a los
                        entrenamientos...
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-[#312E81]"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* SECCIÓN DE ASISTENCIA */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#312E81]">
                    <CalendarDays size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Historial de Asistencia
                  </h3>
                </div>
                {/* Resumen rápido opcional */}
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                    Promedio
                  </p>
                  <p className="text-xl font-black text-[#312E81]">
                    {currentPlayer.attendace?.length > 0
                      ? Math.round(
                          (currentPlayer.attendace.filter(
                            (a: any) => a.status === "PRESENT",
                          ).length /
                            currentPlayer.attendace.length) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Fecha y Sesión
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">
                        Evaluación
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentPlayer.attendace?.length > 0 ? (
                      currentPlayer.attendace.slice(0, 5).map((record: any) => {
                        const statusInfo =
                          ATTENDANCE_STATUS[
                            record.status as keyof typeof ATTENDANCE_STATUS
                          ] || ATTENDANCE_STATUS.PRESENT;
                        const date = new Date(record.createdAt);

                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900 capitalize">
                                {date.toLocaleDateString("es-CL", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </p>
                              <p className="text-[10px] text-gray-500 font-medium">
                                Sesión #{record.sessionId || "---"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${statusInfo.color}`}
                              >
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              {record.rating ? (
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Trophy
                                      key={i}
                                      size={12}
                                      className={
                                        i < record.rating
                                          ? "text-amber-400 fill-amber-400"
                                          : "text-gray-200"
                                      }
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">
                                  Sin nota
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-[#312E81]">
                                <ChevronRight size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <CalendarDays
                              size={40}
                              className="mb-2 text-gray-300"
                            />
                            <p className="text-sm font-medium text-gray-500">
                              No hay registros de asistencia este mes.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {currentPlayer.attendace?.length > 5 && (
                <div className="p-4 bg-gray-50/30 border-t border-gray-50 text-center">
                  <button className="text-xs font-bold text-[#312E81] hover:underline uppercase tracking-widest">
                    Ver historial completo
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA (Accesos & Finanzas) */}
          <div className="space-y-6">
            {/* 1. STATUS FINANCIERO */}
            {schoolMode === "COMMERCIAL" && (
              <div
                className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden ${hasDebt ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${hasDebt ? "text-red-800" : "text-emerald-800"}`}
                    >
                      Estado Mensualidad
                    </p>
                    {hasDebt ? (
                      <AlertCircle className="text-red-500" size={20} />
                    ) : (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    )}
                  </div>
                  <p
                    className={`text-2xl font-black mb-4 ${hasDebt ? "text-red-900" : "text-emerald-900"}`}
                  >
                    {hasDebt ? "Pago Pendiente" : "Al día"}
                  </p>

                  {hasDebt ? (
                    <Link
                      href={`/dashboard/guardian/payments?player=${selectedPlayerId}`}
                      className="block w-full bg-red-600 hover:bg-red-700 text-white text-center text-sm font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                    >
                      Regularizar Ahora
                    </Link>
                  ) : (
                    <p className="text-xs text-emerald-700 opacity-80">
                      ¡Gracias por tu compromiso! Próximo vencimiento: 05/Nov.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 2. ACCESOS RÁPIDOS (Grid) */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                href={`/dashboard/guardian/carnet?player=${selectedPlayerId}`}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-50 text-[#312E81] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode size={24} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-gray-800">
                    Carnet Digital
                  </span>
                  <span className="text-[10px] text-gray-400">Acceso QR</span>
                </div>
              </Link>

              {schoolMode === "COMMERCIAL" && (
                <Link
                  href={`/dashboard/guardian/payments?player=${selectedPlayerId}`}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-3 hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800">
                      Pagos
                    </span>
                    <span className="text-[10px] text-gray-400">Historial</span>
                  </div>
                </Link>
              )}
            </div>

            {/* 3. TIENDA BANNER */}
            {schoolMode === "COMMERCIAL" && (
              <div className="bg-gradient-to-br from-[#111827] to-[#312E81] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg group cursor-pointer">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-1">Tienda Oficial</h4>
                  <p className="text-xs text-gray-300 mb-4">
                    Equípate con los colores del club.
                  </p>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white group-hover:text-[#312E81] transition-colors">
                    Ver Catálogo
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-30 rotate-12 group-hover:scale-110 transition-transform">
                  <img
                    src="/jersey-placeholder.png"
                    alt=""
                    className="w-24 h-24 object-contain"
                  />
                  {/* Fallback Icon */}
                  <Trophy size={80} className="text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
