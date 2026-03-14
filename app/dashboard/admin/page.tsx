"use client";

import React from "react";
import {
  Users,
  Building2,
  Coins,
  TrendingUp,
  MapPin,
  LineChart,
  UserCheck,
  Plus,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2"; // <-- Importamos Chart en lugar de Bar

// 1. Registrar Controladores para gráficos mixtos
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController, // <-- Necesario para el componente <Chart />
  BarController, // <-- Necesario para el componente <Chart />
  Title,
  Tooltip,
  Legend,
  Filler,
);

const GET_ADMIN_DASHBOARD_DATA = gql`
  query GetAdminDashboardData {
    adminDashboardStats {
      totalPlayers
      totalSchools
      totalUsers
      activeSchools
      totalRevenue
    }
    adminRevenueAnalytics {
      totalRevenue
      totalPayments
    }
  }
`;

export default function AdminDashboardPage() {
  const { data, loading, error }: any = useQuery(GET_ADMIN_DASHBOARD_DATA);

  if (loading) {
    return (
      <div className="h-full min-h-[80vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-[#312E81] rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
            Calculando métricas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 m-10 bg-red-50 rounded-[2rem] border border-red-100 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <LineChart size={32} />
        </div>
        <h3 className="text-xl font-black text-red-600 mb-2">
          Error de conexión
        </h3>
        <p className="text-slate-600 font-medium max-w-md">{error.message}</p>
      </div>
    );
  }

  const stats = data?.adminDashboardStats;
  const revenue = data?.adminRevenueAnalytics;

  // 2. Tipar la data de Chart.js correctamente
  const chartData = {
    labels: ["Oct", "Nov", "Dic", "Ene", "Feb"],
    datasets: [
      {
        type: "line" as const,
        label: "MRR ($)",
        borderColor: "#312E81", // Indigo de La Novena
        borderWidth: 4,
        pointBackgroundColor: "#312E81",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: false,
        data: [
          800000,
          1100000,
          1500000,
          1800000,
          stats?.totalRevenue || 2100000,
        ],
        yAxisID: "y",
      },
      {
        type: "bar" as const,
        label: "Escuelas Activas",
        backgroundColor: "#10B981", // Verde de La Novena
        borderRadius: 8,
        data: [15, 22, 30, 38, stats?.activeSchools || 42],
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "Inter", weight: "bold" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { family: "Inter", size: 13 },
        bodyFont: { family: "Inter", size: 13 },
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Inter", weight: "bold" }, color: "#94a3b8" },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: { color: "#f1f5f9", borderDash: [5, 5] },
        ticks: { color: "#94a3b8" },
      },
      y1: {
        type: "linear" as const,
        display: false, // Ocultamos el eje secundario para un look más limpio
        position: "right" as const,
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* HEADER TIPO LAYOUT */}
      <header className="bg-white border-b border-slate-200 px-6 py-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
              Control de Mando
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Métricas globales y rendimiento financiero de la plataforma.
            </p>
          </div>
          <button className="bg-[#312E81] hover:bg-indigo-900 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 w-full md:w-auto">
            <Plus size={18} strokeWidth={3} />
            Nueva Institución
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 animate-fade-in space-y-8">
        {/* 1. KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="absolute -right-4 -bottom-4 text-emerald-50 z-0 group-hover:scale-110 transition-transform">
              <Users size={120} strokeWidth={2} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Padrón Total
              </p>
              <h3 className="text-4xl font-black text-slate-900">
                {stats?.totalPlayers?.toLocaleString("es-CL")}
              </h3>
              <p className="text-xs font-bold text-[#10B981] mt-3 flex items-center gap-1.5 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
                <TrendingUp size={14} /> Jugadores
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="absolute -right-4 -bottom-4 text-indigo-50 z-0 group-hover:scale-110 transition-transform">
              <Building2 size={120} strokeWidth={2} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Escuelas Operativas
              </p>
              <h3 className="text-4xl font-black text-[#312E81]">
                {stats?.activeSchools}{" "}
                <span className="text-xl text-slate-300">
                  / {stats?.totalSchools}
                </span>
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-3 flex items-center gap-1.5">
                Clientes Activos
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="absolute -right-4 -bottom-4 text-amber-50 z-0 group-hover:scale-110 transition-transform">
              <Coins size={120} strokeWidth={2} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                MRR (Ingreso Mensual)
              </p>
              <h3 className="text-4xl font-black text-slate-900">
                ${stats?.totalRevenue?.toLocaleString("es-CL")}
              </h3>
              <p className="text-xs font-bold text-amber-600 mt-3 flex items-center gap-1.5 bg-amber-50 w-fit px-2.5 py-1 rounded-full border border-amber-100">
                {revenue?.totalPayments || 0} Trxs este mes
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="absolute -right-4 -bottom-4 text-purple-50 z-0 group-hover:scale-110 transition-transform">
              <UserCheck size={120} strokeWidth={2} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Cuentas de Usuario
              </p>
              <h3 className="text-4xl font-black text-slate-900">
                {stats?.totalUsers?.toLocaleString("es-CL")}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-3">
                App Móvil y Web
              </p>
            </div>
          </div>
        </div>

        {/* 2. GRÁFICO Y MAPA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico Mixto */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
            <div className="mb-6">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                Crecimiento y Recaudación
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Histórico de los últimos 5 meses.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              {/* 3. Se usa el componente <Chart /> con el prop type="bar" como base */}
              <Chart
                type="bar"
                data={chartData}
                options={chartOptions as any}
              />
            </div>
          </div>

          {/* Mapa / Placeholder */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  Cobertura Geográfica
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  Distribución de sedes en el país.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                Global
              </span>
            </div>

            <div className="w-full flex-1 rounded-[1.5rem] bg-slate-50 border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Pattern de fondo */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'3\\'/%3E%3Ccircle cx=\\'13\\' cy=\\'13\\' r=\\'3\\'/%3E%3C/g%3E%3C/svg%3E')",
                }}
              ></div>

              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 relative z-10 border border-slate-100 group-hover:-translate-y-2 transition-transform">
                <MapPin className="text-[#10B981]" size={28} />
              </div>
              <p className="text-base font-black text-slate-900 relative z-10">
                Módulo de Mapas
              </p>
              <p className="text-sm text-slate-500 relative z-10 px-8 text-center mt-2 max-w-xs">
                Para visualizar las sedes, implementa{" "}
                <code className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">
                  react-leaflet
                </code>{" "}
                con carga dinámica en Next.js.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
