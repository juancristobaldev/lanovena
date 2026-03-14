"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// --- 1. QUERY GRAPHQL ---
// Traemos las estadísticas globales para anclar los gráficos al volumen real,
// y la lista de escuelas para calcular el Top 5 en tiempo real.
const GET_STATISTICS_DATA = gql`
  query GetStatisticsData {
    adminDashboardStats {
      totalPlayers
      totalUsers
    }
    adminSchools {
      id
      name
      counts {
        players
      }
    }
  }
`;

export default function AdminEstadisticsPage() {
  const [timeRange, setTimeRange] = useState("30days");

  const { data, loading, error }: any = useQuery(GET_STATISTICS_DATA, {
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">
            Procesando Analítica...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 flex flex-col items-center text-center mt-20">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Error de Conexión
        </h3>
        <p className="text-slate-500 mt-2">{error.message}</p>
      </div>
    );
  }

  // --- 2. PROCESAMIENTO DE DATOS REALES ---
  const stats = data?.adminDashboardStats;
  const schools = data?.adminSchools || [];

  // Ordenar escuelas por cantidad de jugadores (Top 5)
  const topSchools = [...schools]
    .sort((a, b) => (b.counts?.players || 0) - (a.counts?.players || 0))
    .slice(0, 5);

  const maxPlayersInTop = topSchools[0]?.counts?.players || 1;

  // --- 3. CONFIGURACIÓN DE GRÁFICOS (Híbrido: Base histórica mockeada + Fin real) ---

  // A. Gráfico de Conversión (Doughnut)
  const conversionData = {
    labels: ["Suscripción Pagada", "Prueba Expirada/Abandonó"],
    datasets: [
      {
        data: [68, 32],
        backgroundColor: ["#10B981", "#E2E8F0"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const conversionOptions = {
    cutout: "80%",
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    maintainAspectRatio: false,
  };

  // B. Gráfico de Volumen de Usuarios (Line)
  const usersVolumeData = {
    labels: ["Oct", "Nov", "Dic", "Ene", "Feb Actual"],
    datasets: [
      {
        label: "Niños Inscritos",
        data: [1500, 2100, 2800, 3200, stats?.totalPlayers || 3450],
        borderColor: "#312E81",
        backgroundColor: "#312E81",
        tension: 0.4,
      },
      {
        label: "Usuarios Totales (App)",
        data: [2000, 2800, 3600, 4200, stats?.totalUsers || 4800],
        borderColor: "#8B5CF6",
        backgroundColor: "#8B5CF6",
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  };

  const usersVolumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: { legend: { position: "bottom" as const } },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [2, 4], color: "#F1F5F9" } },
      x: { grid: { display: false } },
    },
  };

  // C. Gráfico de Actividad DAU (Bar)
  const activityData = {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    datasets: [
      {
        label: "Usuarios Activos (Miles)",
        data: [1.2, 1.5, 1.8, 2.1, 2.5, 4.8, 3.2],
        backgroundColor: "#4F46E5",
        borderRadius: 6,
      },
    ],
  };

  const activityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { display: false, beginAtZero: true },
      x: { grid: { display: false } },
    },
  };

  // Colores para el Top 5 (Degradado visual)
  const topColors = [
    "bg-indigo-600 text-indigo-600",
    "bg-indigo-500 text-indigo-500",
    "bg-indigo-400 text-indigo-400",
    "bg-slate-400 text-slate-400",
    "bg-slate-300 text-slate-400",
  ];

  return (
    <>
      {/* HEADER DE LA PÁGINA (Integrado en el layout, pero si necesitas encabezado local, aquí está) */}
      <header className="bg-white h-24 border-b border-slate-200 flex justify-between items-center px-10 shadow-sm shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Analítica Avanzada del Negocio
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Métricas de conversión y uso de la plataforma en tiempo real.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar animate-fade-in bg-slate-50">
        {/* CONTROLES SUPERIORES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="font-bold text-xl text-slate-900 tracking-tight">
              Métricas de Crecimiento & Adopción
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Análisis detallado en porcentajes y volumen de usuarios.
            </p>
          </div>
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none border border-slate-200 rounded-xl px-5 py-2.5 pr-10 text-sm font-bold text-slate-600 outline-none bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
            >
              <option value="30days">Últimos 30 días</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Año 2026</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* FILA 1: CONVERSIÓN Y VOLUMEN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Tasa de Conversión */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <h4 className="font-bold text-slate-800 mb-1">
              Tasa de Conversión
            </h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">
              De Prueba a Suscripción
            </p>

            <div className="w-48 h-48 relative">
              <Doughnut data={conversionData} options={conversionOptions} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-4xl font-black text-indigo-600">68%</span>
              </div>
            </div>

            <div className="mt-8 w-full flex justify-between text-xs font-bold px-2">
              <div className="text-emerald-600 flex items-center gap-1.5">
                <span className="w-3 h-3 block bg-[#10B981] rounded-full shadow-sm"></span>
                Pagando (28)
              </div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <span className="w-3 h-3 block bg-slate-200 rounded-full shadow-sm"></span>
                Abandonó (13)
              </div>
            </div>
          </div>

          {/* Crecimiento de Usuarios */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <h4 className="font-bold text-slate-800 mb-1">
              Volumen de Usuarios Finales
            </h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">
              Niños Inscritos vs Base Total
            </p>
            <div className="flex-1 w-full min-h-[250px] relative">
              <Line data={usersVolumeData} options={usersVolumeOptions} />
            </div>
          </div>
        </div>

        {/* FILA 2: ACTIVIDAD Y TOP ESCUELAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          {/* Actividad Semanal */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <h4 className="font-bold text-slate-800 mb-1">
              Actividad en la App (DAU)
            </h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">
              Usuarios activos por día de la semana
            </p>
            <div className="flex-1 w-full min-h-[200px] relative">
              <Bar data={activityData} options={activityOptions} />
            </div>
          </div>

          {/* Top 5 Escuelas (Datos Reales de GraphQL) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <h4 className="font-bold text-slate-800 mb-6">
              Top 5 Escuelas{" "}
              <span className="text-slate-400 font-medium text-sm">
                (Por volumen)
              </span>
            </h4>

            <div className="space-y-5 flex-1 flex flex-col justify-center">
              {topSchools.length > 0 ? (
                topSchools.map((school, index) => {
                  const players = school.counts?.players || 0;
                  const percentage = Math.max(
                    5,
                    (players / maxPlayersInTop) * 100,
                  ); // Mínimo 5% para que se vea la barra
                  const colorClass =
                    topColors[index] || topColors[topColors.length - 1];
                  const bgColor = colorClass.split(" ")[0]; // Ej: bg-indigo-600
                  const textColor = colorClass.split(" ")[1]; // Ej: text-indigo-600

                  return (
                    <div key={school.id} className="group">
                      <div className="flex justify-between text-sm font-bold mb-1.5">
                        <span className="text-slate-700 group-hover:text-slate-900 transition-colors">
                          {index + 1}. {school.name}
                        </span>
                        <span className={textColor}>{players} Alumnos</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`${bgColor} h-full rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-400 font-medium py-10">
                  Aún no hay escuelas con jugadores registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
