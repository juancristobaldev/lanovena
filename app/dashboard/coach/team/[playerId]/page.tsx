"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import React, { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Activity,
  AlertTriangle,
  CalendarClock,
  Phone,
  Mail,
  ShieldCheck,
  Stethoscope,
  Loader2,
  User,
  Target,
  ChartBar,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// --- CHART.JS IMPORTS ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Radar } from "react-chartjs-2";

// Registrar elementos de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
);

// === GRAPHQL ALINEADO AL NUEVO MODELO ===
const GET_PLAYER_COACH_DETAILS = gql`
  query GetPlayerCoachDetails($playerId: String!) {
    playerProfile(playerId: $playerId) {
      id
      firstName
      lastName
      birthDate
      photoUrl
      medicalInfo
      active
      category {
        name
      }
      guardian {
        fullName
        email
        phone
      }
      stats {
        attendanceRate
        lastAttendance
      }
      # Evaluaciones ahora traen su protocolo dinámico
      evaluations {
        id
        date
        value
        protocol {
          name
          category
          unit
        }
      }
    }
  }
`;

const UPDATE_PLAYER_MEDICAL = gql`
  mutation UpdatePlayerMedical($playerId: String!, $input: UpdatePlayerInput!) {
    updatePlayer(playerId: $playerId, input: $input) {
      id
      medicalInfo
    }
  }
`;

export default function CoachPlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  const playerId = params.playerId as string;

  const { register, handleSubmit, setValue } = useForm();

  // --- QUERIES & MUTATIONS ---
  const { data, loading, error }: any = useQuery(GET_PLAYER_COACH_DETAILS, {
    variables: { playerId },
    fetchPolicy: "network-only",
  });

  const [updatePlayer, { loading: saving }] = useMutation(
    UPDATE_PLAYER_MEDICAL,
  );

  // Sync Form
  useEffect(() => {
    if (data?.playerProfile) {
      setValue("medicalInfo", data.playerProfile.medicalInfo);
    }
  }, [data, setValue]);

  const onSubmit = async (formData: any) => {
    try {
      await updatePlayer({
        variables: {
          playerId,
          input: { medicalInfo: formData.medicalInfo },
        },
      });
      showAlert("Ficha médica/observaciones actualizada", "success");
    } catch (err) {
      console.error(err);
      showAlert("Error al guardar cambios", "error");
    }
  };

  // --- PROCESAMIENTO DE DATOS PARA GRÁFICOS (Real Data) ---
  const { radarData, lineData, topTestName }: any = useMemo(() => {
    if (!data?.playerProfile?.evaluations)
      return { radarData: null, lineData: null, topTestName: "" };

    const evals = data.playerProfile.evaluations;

    // 1. DATA PARA EL RADAR (Perfil Técnico: Últimos valores por Categoría)
    const categoryMap = {
      TECHNICAL: { label: "Tec", index: 0 },
      PHYSICAL: { label: "Fis", index: 1 },
      TACTICAL: { label: "Tac", index: 2 },
      MENTAL: { label: "Men", index: 3 },
      SPEED: { label: "Vel", index: 4 },
    };

    const radarValues = [0, 0, 0, 0, 0]; // Valores por defecto

    // Ordenar de más reciente a más antigua
    const sortedEvals = [...evals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Buscar el valor más reciente de cada categoría (Asumiendo que están en escala 1-10 o similar)
    Object.keys(categoryMap).forEach((cat) => {
      const latest = sortedEvals.find((e) => e.protocol?.category === cat);
      if (latest) {
        radarValues[categoryMap[cat as keyof typeof categoryMap].index] =
          latest.value;
      }
    });

    const radarConfig = {
      labels: ["Tec", "Fis", "Tac", "Men", "Vel"],
      datasets: [
        {
          label: "Nivel",
          data: radarValues,
          borderColor: "#10B981",
          backgroundColor: "rgba(16,185,129,0.2)",
          pointBackgroundColor: "#10B981",
        },
      ],
    };

    // 2. DATA PARA EL GRÁFICO DE LÍNEA (Evolución de un test específico)
    // Encontramos el test con más historial (para que el gráfico se vea bien)
    const testCounts: Record<string, any[]> = {};
    sortedEvals.forEach((e) => {
      const name = e.protocol?.name || "Test";
      if (!testCounts[name]) testCounts[name] = [];
      testCounts[name].push(e);
    });

    let topTest = "";
    let maxLen = 0;
    Object.entries(testCounts).forEach(([name, arr]) => {
      if (arr.length > maxLen) {
        maxLen = arr.length;
        topTest = name;
      }
    });

    // Ordenar cronológicamente para el gráfico de línea
    const timelineEvals = topTest
      ? testCounts[topTest].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
      : [];

    const lineConfig = {
      labels: timelineEvals.map((e) =>
        new Date(e.date).toLocaleDateString("es-CL", {
          month: "short",
          day: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Resultado",
          data: timelineEvals.map((e) => e.value),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };

    return {
      radarData: radarConfig,
      lineData: lineConfig,
      topTestName: topTest || "Sin datos",
    };
  }, [data]);

  // Loading States
  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#10B981]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando expediente deportivo...
        </p>
      </div>
    );

  if (error || !data?.playerProfile)
    return (
      <div className="p-10 flex flex-col items-center text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">
          Error al cargar jugador
        </h3>
        <button
          onClick={() => router.back()}
          className="mt-4 text-[#10B981] font-bold hover:underline"
        >
          Volver atrás
        </button>
      </div>
    );

  const player = data.playerProfile;

  // Lógica Visual de Asistencia
  const attendanceRate = player.stats?.attendanceRate || 0;
  const lastAttendanceDate = player.stats?.lastAttendance
    ? new Date(player.stats.lastAttendance).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      })
    : "Sin registros";

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (attendanceRate / 100) * circumference;
  const age =
    new Date().getFullYear() - new Date(player.birthDate).getFullYear();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* 1. TOP NAV */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#10B981] transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Volver al Equipo
        </button>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <span>Ficha Técnica ID:</span>
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
            {player.id.split("-")[0]}...
          </span>
        </div>
      </div>

      {/* 2. HERO CARD (Perfil) */}
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div
          className={`h-32 w-full ${
            player.active
              ? "bg-gradient-to-r from-[#10B981] to-emerald-600"
              : "bg-gray-200"
          }`}
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Target size={120} className="text-white" />
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
          <div
            className={`w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 ${
              !player.active && "grayscale"
            }`}
          >
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt="Player"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-gray-300 flex flex-col items-center">
                <User size={40} />
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left mb-2">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
              <h1
                className={`text-3xl font-black ${
                  player.active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {player.firstName} {player.lastName}
              </h1>
              {!player.active && (
                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                  INACTIVO
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#312E81]" />{" "}
                {player.category.name}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock size={14} className="text-emerald-500" /> {age}{" "}
                Años ({new Date(player.birthDate).getFullYear()})
              </span>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* === COLUMNA IZQUIERDA (ASISTENCIA Y STATS GRÁFICOS) === */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD ASISTENCIA */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={14} /> Asistencia a Entrenamientos
            </h3>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg
                  className="absolute w-full h-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#F3F4F6"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={attendanceRate < 60 ? "#EF4444" : "#10B981"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-gray-900">
                    {attendanceRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    Última Asistencia
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {lastAttendanceDate}
                  </p>
                </div>
                {attendanceRate < 60 && (
                  <div className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                    <AlertTriangle size={10} /> Ojo: Baja asistencia
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD EVOLUCIÓN FÍSICA (Línea) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <ChartBar size={14} className="text-blue-500" /> Evolución
                Histórica
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                {topTestName}
              </span>
            </div>
            <div className="h-48 w-full">
              {lineData?.labels?.length > 0 ? (
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: false } },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  Insuficientes datos para graficar.
                </div>
              )}
            </div>
          </div>

          {/* CARD PERFIL TÉCNICO (Radar) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target size={14} className="text-emerald-500" /> Perfil Técnico
            </h3>
            <div className="h-56 w-full flex justify-center">
              {radarData ? (
                <Radar
                  data={radarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { r: { beginAtZero: true, suggestedMax: 10 } },
                    plugins: { legend: { display: false } },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  Sin evaluaciones recientes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA (DATA ENTRY MÉDICO Y CONTACTO) === */}
        <div className="lg:col-span-7 space-y-6">
          {/* FICHA MÉDICA Y OBSERVACIONES (Editor del Coach) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-3xl">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope size={18} className="text-[#10B981]" /> Ficha
                Médica & Observaciones del Coach
              </h3>
            </div>

            <div className="p-6 flex-1">
              <textarea
                {...register("medicalInfo")}
                rows={12}
                className="w-full h-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-sm leading-relaxed bg-white text-gray-700 resize-none placeholder-gray-300"
                placeholder="Anota aquí lesiones previas, alergias, o apuntes técnicos importantes sobre el desarrollo del jugador..."
              />
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-3xl">
              <div className="text-xs text-gray-400 italic hidden sm:block">
                Mantén esta info actualizada para el cuerpo técnico.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Guardar Observaciones
              </button>
            </div>
          </div>

          {/* CARD CONTACTO APODERADO */}
          {player.guardian && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-[#312E81] shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Apoderado / Contacto
                  </p>
                  <p className="font-bold text-gray-900 text-lg">
                    {player.guardian.fullName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${player.guardian.phone}`}
                  className="flex-1 sm:flex-none flex justify-center p-3 text-gray-500 hover:text-[#10B981] bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-100"
                  title="Llamar"
                >
                  <Phone size={20} />
                </a>
                <a
                  href={`mailto:${player.guardian.email}`}
                  className="flex-1 sm:flex-none flex justify-center p-3 text-gray-500 hover:text-[#312E81] bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors border border-gray-100"
                  title="Email"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
