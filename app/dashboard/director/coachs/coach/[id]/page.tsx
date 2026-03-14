"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

// --- 1. DEFINICIÓN DE LA QUERY GRAPHQL ---
const GET_COACH_BY_ID = gql`
  query GetCoachById($coachId: ID!) {
    coachById(coachId: $coachId) {
      id
      email
      fullName
      phone
      isActive
      createdAt

      coachProfile {
        id
        bio
        categories {
          id
          name
          type
          sessions {
            id
            status
            date
            notes
          }
          players {
            id
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;

export default function CoachProfilePage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params?.id as string;

  // --- 2. EJECUCIÓN DEL QUERY ---
  const { data, loading, error }: any = useQuery(GET_COACH_BY_ID, {
    variables: { coachId },
    skip: !coachId, // No ejecutar si no hay ID en la URL
  });

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-red-600">
        <i className="ph-bold ph-warning text-4xl mb-2"></i>
        <p>Error al cargar el perfil del entrenador: {error.message}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-600 underline"
        >
          Volver
        </button>
      </div>
    );
  }

  const coach = data?.coachById;
  if (!coach) return null;

  const profile = coach.coachProfile;
  const categories = profile?.categories || [];
  const allPlayers = categories.flatMap((cat: any) => cat.players || []);

  const playersByMonth: Record<string, number> = {};

  allPlayers.forEach((player: any) => {
    const date = new Date(player.createdAt);
    const month = date.getMonth(); // 0 - 11

    if (!playersByMonth[month]) {
      playersByMonth[month] = 0;
    }

    playersByMonth[month]++;
  });

  const monthLabels = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const playersPerMonth = monthLabels.map(
    (_, index) => playersByMonth[index] || 0,
  );

  const allSessions = categories
    .flatMap((cat: any) =>
      (cat.sessions || []).map((session: any) => ({
        ...session,
        categoryName: cat.name,
        categoryType: cat.type,
      })),
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  // --- 3. CONFIGURACIÓN DEL GRÁFICO ---
  const chartData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Nuevos Alumnos",
        data: playersPerMonth,
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { font: { size: 9 } },
      },
      y: { display: false, beginAtZero: true },
    },
  };

  // --- 4. RENDERIZADO DE LA VISTA ---
  return (
    <main className="flex-1 flex flex-col overflow-none relative">
      {/* Header Superior */}

      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-6 animate-[fadeIn_0.4s_ease-out_forwards]">
          {/* TARJETA PRINCIPAL DE PERFIL */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(coach.fullName)}&background=4F46E5&color=fff&size=200`}
                  alt={coach.fullName}
                  className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                />
                {coach.isActive && (
                  <span
                    className="absolute -bottom-2 -right-2 bg-green-500 border-2 border-white w-6 h-6 rounded-full flex items-center justify-center"
                    title="Activo"
                  >
                    <i className="ph-bold ph-check text-white text-[10px]"></i>
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {coach.fullName}
                    </h1>
                    <p className="text-indigo-600 font-medium text-sm flex items-center gap-1 mt-1">
                      <i className="ph-fill ph-whistle"></i> Entrenador
                    </p>
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/director/coachs/coach/${coachId}/edit`}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <i className="ph-bold ph-pencil-simple"></i> Editar Perfil
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Contacto
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                      <i className="ph ph-envelope-simple text-gray-400"></i>{" "}
                      {coach.email}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <i className="ph ph-phone text-gray-400"></i>{" "}
                      {coach.phone || "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Fecha de Ingreso
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <i className="ph ph-calendar-blank text-gray-400"></i>
                      {new Date(coach.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Biografía / Bio
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile?.bio || "Sin biografía registrada."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMNA IZQUIERDA (Categorías y Horarios) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Horario Específico / Sesiones de Entrenamiento */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Horario y Sesiones
                  </h3>
                </div>

                {allSessions.length > 0 ? (
                  <div className="space-y-3">
                    {allSessions.map((session: any) => {
                      const sessionDate = new Date(session.date);
                      const dayName = sessionDate.toLocaleDateString("es-ES", {
                        weekday: "long",
                      });
                      const time = sessionDate.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      // Configuración visual según el estado de la sesión
                      let statusClasses =
                        "bg-gray-100 text-gray-500 border-gray-200";
                      let statusText = session.status || "Desconocido";

                      // Adapta estos strings ('COMPLETED', 'SCHEDULED', etc.) a los de tu backend
                      if (
                        session.status === "COMPLETED" ||
                        session.status === "REALIZADA"
                      ) {
                        statusClasses =
                          "bg-green-50 text-green-600 border-green-100";
                        statusText = "Realizada";
                      } else if (
                        session.status === "SCHEDULED" ||
                        session.status === "PROGRAMADA"
                      ) {
                        statusClasses =
                          "bg-yellow-50 text-yellow-600 border-yellow-100";
                        statusText = "Programada";
                      } else if (
                        session.status === "CANCELLED" ||
                        session.status === "CANCELADA"
                      ) {
                        statusClasses = "bg-red-50 text-red-600 border-red-100";
                        statusText = "Cancelada";
                      }

                      return (
                        <div
                          key={session.id}
                          className="flex flex-col md:flex-row items-start md:items-center gap-4 p-3 border border-gray-100 rounded-xl bg-white transition-all hover:border-indigo-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-center min-w-[100px]">
                            <p className="text-xs font-bold uppercase tracking-wide">
                              {dayName}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">
                              {time} hrs
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {session.categoryName} •{" "}
                              {session.categoryType.toLowerCase()}
                            </p>
                            {session.notes && (
                              <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1">
                                "{session.notes}"
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded border font-medium ${statusClasses}`}
                          >
                            {statusText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 text-gray-500 rounded-xl text-sm border border-gray-100 flex items-center justify-center flex-col gap-2">
                    <i className="ph-fill ph-calendar-blank text-3xl text-gray-300"></i>
                    <p>No hay sesiones programadas para este entrenador.</p>
                  </div>
                )}
              </div>
              {/* Categorías a cargo mapeadas desde GraphQL */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Categorías a Cargo ({categories.length})
                  </h3>
                </div>

                {categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat: any) => (
                      <div
                        key={cat.id}
                        className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition-colors bg-gray-50/50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${cat.type === "SELECTIVA" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              <i
                                className={`ph-fill ${cat.type === "SELECTIVA" ? "ph-trophy" : "ph-users-three"}`}
                              ></i>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">
                                {cat.name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 ${cat.type === "SELECTIVA" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}
                              >
                                {cat.type}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-gray-800">
                            {cat.players?.length || 0}
                            <span className="text-xs font-normal text-gray-500 ml-1">
                              jugadores
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Este entrenador aún no tiene categorías asignadas.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA (Métricas y Tareas) */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4">
                  Rendimiento (Últimos 30 días)
                </h3>
                <div className="space-y-5">
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2 text-center">
                      Evolución Alumnos Nuevos
                    </p>
                    <div className="h-24 relative w-full">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
