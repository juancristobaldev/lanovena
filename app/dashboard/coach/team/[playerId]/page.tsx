"use client";

import React, { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  QrCode,
  Activity,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Phone,
  Mail,
  ShieldCheck,
  Stethoscope,
  Loader2,
  User,
  Trophy,
  Lock,
  Target,
  UserCog,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// === CONSTANTES ===
const POSITIONS = [
  {
    id: "GK",
    label: "GK",
    full: "Arquero",
    color: "bg-amber-500",
    text: "text-amber-600",
  },
  {
    id: "DEF",
    label: "DEF",
    full: "Defensa",
    color: "bg-blue-600",
    text: "text-blue-700",
  },
  {
    id: "MID",
    label: "MID",
    full: "Medio",
    color: "bg-[#10B981]",
    text: "text-[#10B981]",
  },
  {
    id: "FW",
    label: "FW",
    full: "Delantero",
    color: "bg-red-600",
    text: "text-red-700",
  },
];

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
      position
      category {
        id
        name
      }
      guardian {
        id
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

const GET_GUARDIANS = gql`
  query GetGuardians($schoolId: String!) {
    usersByRole(role: GUARDIAN, schoolId: $schoolId) {
      id
      fullName
    }
  }
`;

const UPDATE_PLAYER = gql`
  mutation UpdatePlayer($playerId: String!, $input: UpdatePlayerInput!) {
    updatePlayer(playerId: $playerId, input: $input) {
      id
      firstName
      lastName
      active
      scholarship
      medicalInfo
      position
    }
  }
`;

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  const { user } = useUser();
  const playerId = params.id as string;

  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  // --- FORMS & STATE ---
  const { register, handleSubmit, setValue, control } = useForm();
  const isActive = useWatch({ control, name: "active", defaultValue: true });
  const isScholarship = useWatch({
    control,
    name: "scholarship",
    defaultValue: false,
  });

  // --- QUERIES ---
  const {
    data: playerData,
    loading: loadingPlayer,
    error,
  }: any = useQuery(GET_PLAYER_DETAILS, {
    variables: { playerId },
    fetchPolicy: "network-only",
  });

  const { data: guardiansData }: any = useQuery(GET_GUARDIANS, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
  });

  const [updatePlayer, { loading: saving }] = useMutation(UPDATE_PLAYER);

  // Sync Form Data
  useEffect(() => {
    if (playerData?.playerProfile) {
      const p = playerData.playerProfile;
      setValue("firstName", p.firstName);
      setValue("lastName", p.lastName);
      setValue("position", p.position || "MID");
      setValue("guardianId", p.guardian?.id || "");
      setValue("medicalInfo", p.medicalInfo || "");
      setValue("active", p.active ?? true);
      setValue("scholarship", p.scholarship ?? false);
    }
  }, [playerData, setValue]);

  const onSubmit = async (formData: any) => {
    try {
      await updatePlayer({
        variables: {
          playerId,
          input: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            position: formData.position,
            guardianId: formData.guardianId,
            medicalInfo: formData.medicalInfo,
            active: formData.active,
            scholarship: formData.scholarship,
          },
        },
      });
      showAlert("Expediente actualizado con éxito", "success");
    } catch (err: any) {
      showAlert(err.message || "Error al guardar cambios", "error");
    }
  };

  // --- LOADING / ERROR STATES ---
  if (loadingPlayer)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">
          Cargando expediente...
        </p>
      </div>
    );

  if (error || !playerData?.playerProfile)
    return (
      <div className="p-10 flex flex-col items-center text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Ficha no encontrada
        </h3>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-[#312E81] transition-colors"
        >
          Volver atrás
        </button>
      </div>
    );

  const player = playerData.playerProfile;

  // --- LÓGICA VISUAL ---
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

  const financeStatus = player.financialStatus?.status || "PENDING";
  const isOverdue = financeStatus === "OVERDUE";
  const debtAmount = player.financialStatus?.debtAmount || 0;

  const birthYear = new Date(player.birthDate).getFullYear();
  const age = new Date().getFullYear() - birthYear;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in pt-4 px-4 lg:px-0">
      {/* 1. TOP NAV */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#312E81] transition-colors bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Volver
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>ID:</span>
          <span className="font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600">
            {player.id.split("-")[0]}
          </span>
        </div>
      </div>

      {/* 2. HERO CARD (Banner + Avatar) */}
      <div className="relative bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
        <div
          className={`h-32 w-full transition-colors duration-500 ${isActive ? "bg-gradient-to-r from-[#312E81] to-[#4F46E5]" : "bg-slate-300"}`}
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck size={120} className="text-white" />
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
          {/* Avatar */}
          <div
            className={`w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 transition-all duration-500 ${!isActive && "grayscale opacity-80"}`}
          >
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt="Player"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-slate-300 flex flex-col items-center">
                <User size={40} />
              </span>
            )}
          </div>

          {/* Info Principal */}
          <div className="flex-1 text-center md:text-left mb-2">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
              <h1
                className={`text-3xl font-black tracking-tight transition-colors ${isActive ? "text-slate-900" : "text-slate-400"}`}
              >
                {player.firstName} {player.lastName}
              </h1>
              <div className="flex gap-2">
                {!isActive && (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-200">
                    Inactivo
                  </span>
                )}
                {isScholarship && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200 shadow-sm">
                    <Trophy size={10} /> Becado
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-slate-500 font-medium mt-2">
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                <ShieldCheck size={16} className="text-[#312E81]" />{" "}
                {player.category.name}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                <CalendarClock size={16} className="text-[#10B981]" /> {age}{" "}
                Años
              </span>
            </div>
          </div>

          {/* Credencial QR Action */}
          <button className="bg-white hover:bg-slate-50 text-[#312E81] border border-slate-200 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 mb-2 md:mb-0">
            <QrCode size={18} />
            <span className="hidden sm:inline">Ver Credencial</span>
          </button>
        </div>
      </div>

      {/* 3. FORMULARIO PRINCIPAL */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* === COLUMNA IZQUIERDA (STATUS & METRICS) === */}
        <div className="space-y-6">
          {/* Panel de Permisos */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={16} className="text-[#312E81]" /> Control de
              Estado
            </h3>

            <div className="space-y-4">
              {/* Switch Activo */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    Estado Jugador
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Habilita acceso a plataforma
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("active")}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#10B981] shadow-inner"></div>
                </label>
              </div>

              {/* Switch Beca */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors ${!isActive && "opacity-50 pointer-events-none"}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    Beca Deportiva
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Exime pagos mensuales
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("scholarship")}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-400 shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Asistencia Visual */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#10B981]" /> Rendimiento
              Asistencia
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
                    stroke="#F1F5F9"
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
                  <span className="text-xl font-black text-slate-900">
                    {attendanceRate}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Última Clase
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {lastAttendanceDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Finanzas */}
          {!isScholarship ? (
            <div
              className={`p-6 rounded-[2rem] border shadow-sm ${isOverdue ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3
                  className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${isOverdue ? "text-red-700" : "text-emerald-700"}`}
                >
                  <CreditCard size={16} /> Finanzas
                </h3>
                {isOverdue && (
                  <span className="text-[10px] font-black bg-white px-2 py-1 rounded-md border border-red-200 text-red-600 shadow-sm">
                    MOROSO
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p
                    className={`text-3xl font-black tracking-tight ${isOverdue ? "text-red-900" : "text-emerald-900"}`}
                  >
                    ${debtAmount.toLocaleString("es-CL")}
                  </p>
                  <p
                    className={`text-xs font-bold mt-1 ${isOverdue ? "text-red-600/80" : "text-emerald-600/80"}`}
                  >
                    {isOverdue ? "Deuda Pendiente" : "Sin Deuda Actual"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[2rem] border border-amber-200 bg-amber-50 shadow-sm opacity-90">
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-widest mb-3">
                <Trophy size={16} /> Financiero Pausado
              </div>
              <p className="text-sm font-medium text-amber-700/80 leading-relaxed">
                Jugador con{" "}
                <strong className="font-black text-amber-900">
                  Beca Deportiva
                </strong>
                . Exento de cobros automatizados.
              </p>
            </div>
          )}
        </div>

        {/* === COLUMNA CENTRAL/DERECHA (EDICIÓN) === */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerta de bloqueo si está inactivo */}
          {!isActive && (
            <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg animate-fade-in">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="text-white" size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">
                  Ficha Bloqueada para Edición
                </p>
                <p className="text-slate-400 text-xs font-medium">
                  Reactiva al jugador en el "Control de Estado" para modificar
                  sus datos.
                </p>
              </div>
            </div>
          )}

          {/* Contenedor principal de edición (Se opaca si está inactivo) */}
          <div
            className={`transition-all duration-300 ${!isActive ? "opacity-50 pointer-events-none grayscale-[0.2]" : ""}`}
          >
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-6">
              {/* Sección: Datos Personales */}
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <UserCog size={16} className="text-[#312E81]" /> Información
                  Básica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nombre
                    </label>
                    <input
                      {...register("firstName", { required: true })}
                      disabled={!isActive}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-800 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Apellido
                    </label>
                    <input
                      {...register("lastName", { required: true })}
                      disabled={!isActive}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-800 disabled:opacity-70"
                    />
                  </div>
                </div>

                {/* Campos Protegidos (Solo Lectura) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      Fecha de Nacimiento{" "}
                      <Lock size={12} className="text-slate-400" />
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-slate-500 font-medium cursor-not-allowed flex items-center">
                      {new Date(player.birthDate).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      Serie Actual <Lock size={12} className="text-slate-400" />
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl border border-indigo-100 bg-indigo-50/50 text-[#312E81] font-black tracking-tight cursor-not-allowed flex items-center">
                      {player.category.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Deportivo y Administrativo */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                {/* Posición */}
                <div className="mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Target size={16} className="text-[#10B981]" /> Posición
                    Principal
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {POSITIONS.map((pos) => (
                      <label
                        key={pos.id}
                        className={`cursor-pointer group ${!isActive ? "pointer-events-none" : ""}`}
                      >
                        <input
                          type="radio"
                          value={pos.id}
                          {...register("position")}
                          disabled={!isActive}
                          className="peer hidden"
                        />
                        <div className="border border-slate-200 rounded-2xl p-4 text-center bg-white hover:bg-slate-50 transition-all peer-checked:ring-2 peer-checked:ring-[#312E81] peer-checked:border-transparent peer-checked:shadow-md">
                          <div
                            className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${pos.color} text-white font-black text-sm shadow-sm group-hover:-translate-y-1 transition-transform`}
                          >
                            {pos.label}
                          </div>
                          <div
                            className={`text-[10px] font-black uppercase tracking-wide text-slate-400 peer-checked:${pos.text}`}
                          >
                            {pos.full}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apoderado */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <User size={16} className="text-[#312E81]" /> Apoderado
                    Responsable
                  </h3>
                  <select
                    {...register("guardianId", { required: true })}
                    disabled={!isActive}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-bold text-slate-700 disabled:opacity-70"
                  >
                    <option value="">Selecciona una familia...</option>
                    {guardiansData?.usersByRole?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección: Ficha Médica */}
              <div className="p-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Stethoscope size={16} className="text-red-500" /> Ficha
                  Médica & Notas
                </h3>
                <textarea
                  {...register("medicalInfo")}
                  disabled={!isActive}
                  rows={6}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800 resize-none placeholder-slate-300 disabled:opacity-70"
                  placeholder="Alergias, lesiones, tipo de sangre, observaciones para el entrenador..."
                />
              </div>
            </div>
          </div>

          {/* Botón de Guardado (Siempre activo para poder guardar el cambio de estado) */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-4 rounded-xl font-black text-white bg-[#312E81] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save size={20} /> Guardar Expediente
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
