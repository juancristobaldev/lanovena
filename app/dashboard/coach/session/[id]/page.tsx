"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  Users,
  Dumbbell,
  ClipboardList,
  Star,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  Save,
  Map,
  MessageSquare,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

// ---------------------------------------------------------------------------
// 1. GRAPHQL QUERIES & MUTATIONS
// ---------------------------------------------------------------------------

const GET_SESSION_FULL_DETAIL = gql`
  query GetSessionFullDetail($sessionId: ID!) {
    trainingSession(sessionId: $sessionId) {
      id
      date
      notes
      category {
        id
        name
        players {
          id
          firstName
          lastName
          photoUrl
          active
        }
      }
      attendance {
        id
        status
        player {
          id
        }
      }
      exercises {
        id

        orderIndex
        exercise {
          title
          description
          imageUrl
          videoUrl
          difficulty
        }
      }
    }
  }
`;

const REGISTER_ATTENDANCE = gql`
  mutation RegisterAttendance(
    $sessionId: String!
    $playerId: String!
    $status: String!
  ) {
    registerAttendance(
      sessionId: $sessionId
      playerId: $playerId
      status: $status
    ) {
      id
      status
    }
  }
`;

// Simulamos una mutación de evaluación (Asegúrate de tener esto en tu backend o eliminar si no aplica)
const RATE_PLAYER_PERFORMANCE = gql`
  mutation RatePlayer(
    $sessionId: String!
    $playerId: String!
    $rating: Int!
    $notes: String
  ) {
    ratePlayerPerformance(
      sessionId: $sessionId
      playerId: $playerId
      rating: $rating
      notes: $notes
    ) {
      id
    }
  }
`;

// ---------------------------------------------------------------------------
// 2. TYPES & INTERFACES
// ---------------------------------------------------------------------------

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PENDING";
type TabView = "ATTENDANCE" | "PLANNING" | "EVALUATION" | "TACTICS";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  position?: string;
}

interface Exercise {
  id: string;
  durationMin: number;
  exercise: {
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    difficulty?: string;
  };
}

// ---------------------------------------------------------------------------
// 3. MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // --- STATES ---
  const [activeTab, setActiveTab] = useState<TabView>("ATTENDANCE");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA FETCHING ---
  const { data, loading, error }: any = useQuery(GET_SESSION_FULL_DETAIL, {
    variables: { sessionId: sessionId },
    fetchPolicy: "network-only",
  });

  const [registerAttendance] = useMutation(REGISTER_ATTENDANCE);
  // const [ratePlayer] = useMutation(RATE_PLAYER_PERFORMANCE); // Descomentar cuando exista en backend

  // --- HANDLERS ---

  const handleAttendance = async (
    playerId: string,
    status: AttendanceStatus,
  ) => {
    // Optimistic Update
    setAttendanceMap((prev) => ({ ...prev, [playerId]: status }));
    try {
      await registerAttendance({ variables: { sessionId, playerId, status } });
    } catch (err) {
      console.error("Error al guardar asistencia", err);
    }
  };

  const handleMarkAllPresent = () => {
    const players = data?.trainingSession?.category?.players || [];
    players.forEach((p: Player) => {
      if (attendanceMap[p.id] !== "PRESENT") {
        handleAttendance(p.id, "PRESENT");
      }
    });
  };

  const handleRating = (playerId: string, rating: number) => {
    setRatingsMap((prev) => ({ ...prev, [playerId]: rating }));
  };

  const saveEvaluations = async () => {
    setIsSaving(true);
    // Simulación de guardado masivo
    setTimeout(() => {
      setIsSaving(false);
      alert("Evaluaciones guardadas correctamente (Simulación)");
    }, 1000);
  };

  // --- RENDER HELPERS ---

  useEffect(() => {
    if (data && !loading) {
      const map: Record<string, AttendanceStatus> = {};
      data.trainingSession.attendance.forEach((r: any) => {
        map[r.player.id] = r.status;
      });
      setAttendanceMap(map);
    }
  }, [data, loading]);

  const stats = useMemo(() => {
    const values = Object.values(attendanceMap);
    const total = data?.trainingSession?.category?.players?.length || 0;
    return {
      present: values.filter((s) => s === "PRESENT").length,
      late: values.filter((s) => s === "LATE").length,
      absent: values.filter((s) => s === "ABSENT").length,
      total,
    };
  }, [attendanceMap, data]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  const session = data.trainingSession;
  const players: Player[] = session.category.players;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* ================= HEADER ================= */}
      <div className="bg-[#312E81] pt-8 px-6 pb-16 rounded-b-[2.5rem] shadow-xl relative z-20">
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => router.back()}
            className="text-indigo-200 hover:text-white p-2 -ml-2 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
            <span className="text-xs font-bold text-white tracking-wide">
              EN CURSO
            </span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
          {session.category.name}
        </h1>

        <div className="flex flex-col gap-2 text-indigo-200 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#10B981]" />
            <p className="capitalize">
              {format(new Date(session.date), "EEEE d 'de' MMMM", {
                locale: es,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#10B981]" />
            <p>
              {format(new Date(session.date), "HH:mm")} hrs •{" "}
              {session.exercises?.length || 0} Ejercicios
            </p>
          </div>
        </div>
      </div>

      {/* ================= TABS NAVIGATION (Floating) ================= */}
      <div className="px-4 -mt-8 relative z-30">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex justify-between overflow-x-auto hide-scrollbar">
          <TabItem
            active={activeTab === "ATTENDANCE"}
            onClick={() => setActiveTab("ATTENDANCE")}
            icon={Users}
            label="Asistencia"
          />
          <TabItem
            active={activeTab === "PLANNING"}
            onClick={() => setActiveTab("PLANNING")}
            icon={Dumbbell}
            label="Plan"
          />
          <TabItem
            active={activeTab === "TACTICS"}
            onClick={() => setActiveTab("TACTICS")}
            icon={Map}
            label="Pizarra"
          />
          <TabItem
            active={activeTab === "EVALUATION"}
            onClick={() => setActiveTab("EVALUATION")}
            icon={Trophy}
            label="Evaluar"
          />
        </div>
      </div>

      {/* ================= CONTENT AREA ================= */}
      <div className="px-5 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- TAB: ASISTENCIA --- */}
        {activeTab === "ATTENDANCE" && (
          <div className="space-y-4">
            {/* Quick Stats & Action */}
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <span className="block font-bold text-emerald-600 text-lg leading-none">
                    {stats.present}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase">
                    Presentes
                  </span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-amber-500 text-lg leading-none">
                    {stats.late}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase">
                    Atrasos
                  </span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-400 text-lg leading-none">
                    {stats.total}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase">
                    Total
                  </span>
                </div>
              </div>
              <button
                onClick={handleMarkAllPresent}
                className="bg-[#312E81] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm active:scale-95 transition-transform"
              >
                Todos Presentes
              </button>
            </div>

            {/* Players List */}
            <div className="space-y-2 pb-24">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar player={player} />
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {player.firstName} {player.lastName}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {attendanceMap[player.id] === "PRESENT" ? (
                          <span className="text-emerald-500">Presente</span>
                        ) : attendanceMap[player.id] === "ABSENT" ? (
                          <span className="text-red-500">Ausente</span>
                        ) : attendanceMap[player.id] === "LATE" ? (
                          <span className="text-amber-500">Atrasado</span>
                        ) : (
                          "Sin marcar"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <AttendanceBtn
                      status="PRESENT"
                      current={attendanceMap[player.id]}
                      onClick={() => handleAttendance(player.id, "PRESENT")}
                    />
                    <AttendanceBtn
                      status="LATE"
                      current={attendanceMap[player.id]}
                      onClick={() => handleAttendance(player.id, "LATE")}
                    />
                    <AttendanceBtn
                      status="ABSENT"
                      current={attendanceMap[player.id]}
                      onClick={() => handleAttendance(player.id, "ABSENT")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: PLANIFICACIÓN --- */}
        {activeTab === "PLANNING" && (
          <div className="space-y-4 pb-24">
            {/* Info de la sesión */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
              <h3 className="text-[#312E81] font-bold text-sm flex items-center gap-2 mb-1">
                <ClipboardList className="w-4 h-4" /> Notas del Entrenador
              </h3>
              <p className="text-sm text-gray-600 italic">
                {session.notes ||
                  "Sin notas específicas para esta sesión. Enfocarse en los ejercicios planificados."}
              </p>
            </div>

            {session.exercises?.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                message="No hay ejercicios planificados"
              />
            ) : (
              session.exercises.map((item: Exercise, idx: number) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3"
                >
                  <div className="flex h-28">
                    {/* Imagen / Video Thumbnail */}
                    <div className="w-32 bg-gray-100 relative shrink-0">
                      {item.exercise.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.exercise.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Dumbbell />
                        </div>
                      )}
                      {item.exercise.videoUrl && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors cursor-pointer">
                          <PlayCircle className="w-8 h-8 text-white shadow-sm" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 p-3 flex flex-col relative">
                      <h4 className="font-bold text-[#312E81] text-sm leading-tight line-clamp-2 mb-1">
                        {item.exercise.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-snug">
                        {item.exercise.description}
                      </p>

                      <div className="mt-auto flex items-center gap-2">
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> {item.durationMin} min
                        </span>
                        {item.exercise.difficulty && (
                          <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-1.5 rounded">
                            {item.exercise.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB: PIZARRA (NUEVO) --- */}
        {activeTab === "TACTICS" && (
          <div className="pb-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              {/* Cancha CSS */}
              <div className="aspect-[3/4] bg-[#10B981] relative overflow-hidden border-b-4 border-[#065F46] p-6 flex flex-col items-center justify-center text-center">
                {/* Líneas de cancha decorativas */}
                <div className="absolute inset-0 border-[3px] border-white/30 m-4 rounded-sm"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-[3px] border-white/30"></div>

                {/* Contenido Táctico (Ejemplo) */}
                <div className="relative z-10 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg max-w-xs">
                  <h3 className="font-bold text-[#312E81] uppercase text-xs mb-2 tracking-widest">
                    Objetivo Táctico
                  </h3>
                  <p className="font-bold text-lg leading-tight mb-1">
                    Presión Alta & Transición Rápida
                  </p>
                  <p className="text-xs text-gray-500">
                    Bloquear salida rival y buscar extremos a espalda de
                    laterales.
                  </p>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-gray-800 text-sm mb-2">
                  Instrucciones Clave:
                </h4>
                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4 marker:text-[#10B981]">
                  <li>Extremos bien abiertos en fase ofensiva.</li>
                  <li>Volante central se mete entre centrales en salida.</li>
                  <li>Mucha comunicación en las marcas personales.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: EVALUACIÓN (NUEVO) --- */}
        {activeTab === "EVALUATION" && (
          <div className="pb-32 space-y-4">
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-bold">
                  Evaluación Post-Entrenamiento
                </p>
                <p className="text-[10px] text-amber-700">
                  Califica el rendimiento y actitud. Esto genera estadísticas de
                  progreso para el apoderado.
                </p>
              </div>
            </div>

            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar player={player} />
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {player.firstName} {player.lastName}
                      </h3>
                      <p className="text-xs text-gray-400">Delantero</p>
                    </div>
                  </div>
                  {/* Estrellas */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(player.id, star)}
                        className="focus:outline-none transition-transform active:scale-125"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (ratingsMap[player.id] || 0) >= star
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Input Nota Rápida */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nota técnica breve (opcional)..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none pr-8"
                    onChange={(e) =>
                      setFeedbackMap((prev) => ({
                        ...prev,
                        [player.id]: e.target.value,
                      }))
                    }
                  />
                  <MessageSquare className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}

            {/* Botón Flotante Guardar */}
            <div className="fixed bottom-6 left-0 right-0 px-6 z-50">
              <button
                onClick={saveEvaluations}
                disabled={isSaving}
                className="w-full bg-[#312E81] text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <span className="animate-pulse">Guardando...</span>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Guardar Evaluaciones
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. SUB-COMPONENTS
// ---------------------------------------------------------------------------

function TabItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2 px-1 rounded-xl transition-all duration-300 ${
        active
          ? "bg-indigo-50 text-[#312E81]"
          : "text-gray-400 hover:bg-gray-50"
      }`}
    >
      <Icon
        className={`w-5 h-5 mb-1 ${active ? "stroke-[2.5px]" : "stroke-2"}`}
      />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function AttendanceBtn({
  status,
  current,
  onClick,
}: {
  status: string;
  current: string;
  onClick: () => void;
}) {
  const config: any = {
    PRESENT: {
      icon: CheckCircle2,
      color: "text-[#10B981]",
      bg: "bg-[#10B981]",
    },
    LATE: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500" },
    ABSENT: { icon: XCircle, color: "text-red-500", bg: "bg-red-500" },
  };

  const active = status === current;
  const { icon: Icon, bg } = config[status];

  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
        active
          ? `${bg} text-white shadow-md`
          : "bg-gray-50 text-gray-300 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={active ? 3 : 2} />
    </button>
  );
}

function Avatar({ player }: { player: Player }) {
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
      {player.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoUrl}
          alt={player.firstName}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[#312E81] text-xs font-bold">
          {player.firstName[0]}
          {player.lastName[0]}
        </span>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <Icon className="w-10 h-10 text-gray-300 mb-2" />
      <p className="text-gray-400 text-sm font-medium">{message}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-12 animate-pulse">
      <div className="h-40 bg-gray-200 rounded-3xl mb-8"></div>
      <div className="flex gap-4 mb-8">
        <div className="h-10 w-20 bg-gray-200 rounded-xl"></div>
        <div className="h-10 w-20 bg-gray-200 rounded-xl"></div>
        <div className="h-10 w-20 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-[#312E81] font-bold text-lg">Error de Carga</h3>
      <p className="text-gray-400 text-sm mb-4">
        No pudimos obtener los datos de la sesión.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-[#312E81] font-bold underline"
      >
        Reintentar
      </button>
    </div>
  );
}
