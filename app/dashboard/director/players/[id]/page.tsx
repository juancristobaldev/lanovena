"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import React, { useEffect } from "react";
import {
  ArrowLeft,
  Save,
  QrCode,
  Activity,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Phone,
  Mail,
  ShieldCheck,
  Stethoscope,
  Loader2,
  User,
  Trophy,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// === GRAPHQL ===
const GET_PLAYER_DETAILS = gql`
  query GetPlayerDetails($playerId: String!) {
    playerProfile(playerId: $playerId) {
      id
      firstName
      lastName
      birthDate
      photoUrl
      medicalInfo
      active
      scholarship
      qrCodeToken
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
      financialStatus {
        status
        debtAmount
        lastPaymentDate
      }
    }
  }
`;

const UPDATE_PLAYER = gql`
  mutation UpdatePlayer($playerId: String!, $input: UpdatePlayerInput!) {
    updatePlayer(playerId: $playerId, input: $input) {
      id
      active
      scholarship
      medicalInfo
    }
  }
`;

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  const playerId = params.id as string;

  const { register, handleSubmit, watch, setValue } = useForm();
  const isActive = watch("active");
  const isScholarship = watch("scholarship");

  // --- QUERY ---
  const { data, loading, error }: any = useQuery(GET_PLAYER_DETAILS, {
    variables: { playerId },
    fetchPolicy: "network-only",
  });

  const [updatePlayer, { loading: saving }] = useMutation(UPDATE_PLAYER);

  // Sync Form
  useEffect(() => {
    if (data?.playerProfile) {
      setValue("medicalInfo", data.playerProfile.medicalInfo);
      setValue("active", data.playerProfile.active);
      setValue("scholarship", data.playerProfile.scholarship);
    }
  }, [data, setValue]);

  const onSubmit = async (formData: any) => {
    try {
      await updatePlayer({
        variables: {
          playerId,
          input: {
            medicalInfo: formData.medicalInfo,
            active: formData.active,
            scholarship: formData.scholarship,
          },
        },
      });
      showAlert("Ficha del jugador actualizada", "success");
    } catch (err) {
      console.error(err);
      showAlert("Error al guardar cambios", "error");
    }
  };

  // Loading States
  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando expediente...
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
          className="mt-4 text-[#312E81] font-bold hover:underline"
        >
          Volver atrás
        </button>
      </div>
    );

  const player = data.playerProfile;

  // --- LÓGICA VISUAL ---
  // Asistencia Radial
  const attendanceRate = player.stats?.attendanceRate || 0;
  const lastAttendanceDate = player.stats?.lastAttendance
    ? new Date(player.stats.lastAttendance).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
      })
    : "Sin registros";

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (attendanceRate / 100) * circumference;

  // Finanzas
  const financeStatus = player.financialStatus?.status || "PENDING";
  const isOverdue = financeStatus === "OVERDUE";
  const debtAmount = player.financialStatus?.debtAmount || 0;

  // Edad
  const age =
    new Date().getFullYear() - new Date(player.birthDate).getFullYear();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* 1. TOP NAV */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#312E81] transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Volver
        </button>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <span>Ficha ID:</span>
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
            {player.id.split("-")[0]}...
          </span>
        </div>
      </div>

      {/* 2. HERO CARD (Perfil) */}
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Background Banner */}
        <div
          className={`h-32 w-full ${isActive ? "bg-gradient-to-r from-[#312E81] to-[#4F46E5]" : "bg-gray-200"}`}
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck size={120} className="text-white" />
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
          {/* Avatar */}
          <div
            className={`w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 ${!isActive && "grayscale"}`}
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

          {/* Info Principal */}
          <div className="flex-1 text-center md:text-left mb-2">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
              <h1
                className={`text-3xl font-black ${isActive ? "text-gray-900" : "text-gray-400"}`}
              >
                {player.firstName} {player.lastName}
              </h1>
              {/* Badges */}
              <div className="flex gap-2">
                {!isActive && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                    INACTIVO
                  </span>
                )}
                {isScholarship && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 shadow-sm">
                    <Trophy size={10} /> BECADO
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-500" />{" "}
                {player.category.name}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock size={14} className="text-emerald-500" /> {age}{" "}
                Años ({new Date(player.birthDate).getFullYear()})
              </span>
            </div>
          </div>

          {/* QR Action */}
          <button className="bg-white hover:bg-gray-50 text-[#312E81] border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 mb-2 md:mb-0">
            <QrCode size={18} />
            <span className="hidden sm:inline">Ver Credencial</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* === COLUMNA IZQUIERDA (STATUS & METRICS) === */}
        <div className="space-y-6">
          {/* 1. PANEL DE ESTADO */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={14} /> Estado & Permisos
            </h3>

            <div className="space-y-4">
              {/* Switch Activo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">
                    Estado Jugador
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Habilita acceso a la cancha
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("active")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              {/* Switch Beca */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">
                    Beca Deportiva
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Exime del pago mensual
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("scholarship")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 2. CARD ASISTENCIA (Visual) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Rendimiento de Asistencia
            </h3>

            <div className="flex items-center gap-6">
              {/* Radial Chart */}
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
                    stroke={attendanceRate < 50 ? "#EF4444" : "#312E81"}
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
                    <AlertTriangle size={10} /> Baja asistencia
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. CARD FINANCIERA (Smart) */}
          {!isScholarship ? (
            <div
              className={`p-5 rounded-2xl border shadow-sm ${isOverdue ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isOverdue ? "text-red-700" : "text-emerald-700"}`}
                >
                  <CreditCard size={14} /> Situación Financiera
                </h3>
                {isOverdue && (
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-red-200 text-red-600">
                    MOROSO
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p
                    className={`text-2xl font-black ${isOverdue ? "text-red-900" : "text-emerald-900"}`}
                  >
                    ${debtAmount.toLocaleString("es-CL")}
                  </p>
                  <p
                    className={`text-xs ${isOverdue ? "text-red-600/80" : "text-emerald-600/80"}`}
                  >
                    {isOverdue ? "Deuda Pendiente" : "Sin Deuda Actual"}
                  </p>
                </div>
                {isOverdue && (
                  <button
                    type="button"
                    className="bg-white text-red-600 text-xs font-bold px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Notificar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm opacity-80">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-2">
                <Trophy size={14} /> Módulo Financiero Pausado
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Este jugador tiene <strong>Beca Deportiva</strong> activa. No se
                generarán cobros mensuales mientras esta opción esté habilitada.
              </p>
            </div>
          )}
        </div>

        {/* === COLUMNA CENTRAL/DERECHA (DATA ENTRY) === */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. FICHA MÉDICA (Editor) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope size={18} className="text-[#312E81]" /> Ficha
                Médica & Observaciones
              </h3>
              <span className="text-xs text-gray-400">
                Privado (Solo Staff)
              </span>
            </div>

            <div className="p-6 flex-1">
              <textarea
                {...register("medicalInfo")}
                rows={12}
                className="w-full h-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm leading-relaxed bg-white text-gray-700 resize-none placeholder-gray-300"
                placeholder="Escribe aquí alergias, lesiones crónicas, medicamentos, tipo de sangre o cualquier observación relevante para el cuerpo técnico..."
              />
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-400 italic">
                Última edición: {new Date().toLocaleDateString()}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#312E81] hover:bg-indigo-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/10 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* 2. CARD CONTACTO (Read Only por ahora) */}
          {player.guardian && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-[#312E81]">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Apoderado Responsable
                  </p>
                  <p className="font-bold text-gray-900">
                    {player.guardian.fullName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${player.guardian.phone}`}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Llamar"
                >
                  <Phone size={18} />
                </a>
                <a
                  href={`mailto:${player.guardian.email}`}
                  className="p-2 text-gray-400 hover:text-[#312E81] hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Email"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
