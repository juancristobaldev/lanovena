"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  PauseCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

// ---------------------------------------------------------------------------
// 1. GRAPHQL QUERIES & MUTATIONS
// ---------------------------------------------------------------------------

const COMPLETE_SESSION = gql`
  mutation CompleteTrainingSession($sessionId: ID!) {
    completeTrainingSession(sessionId: $sessionId) {
      id
      status
    }
  }
`;

const GET_SESSION_FULL_DETAIL = gql`
  query GetSessionFullDetail($sessionId: ID!) {
    trainingSession(sessionId: $sessionId) {
      id
      date
      notes
      status
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
      tacticalBoards {
        id
        orderIndex
        tacticalBoard {
          id
          title
          description
          initialState
          animation
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
      rating
      notes
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
}

interface TacticalBoardData {
  id: string; // ID de la relación session-board
  tacticalBoard: {
    id: string;
    title: string;
    description?: string;
    initialState: any; // JSON Tokens + Strokes
    animation?: any; // JSON Frames
  };
}

// ---------------------------------------------------------------------------
// 3. MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [completeSession, { loading: completing }] =
    useMutation(COMPLETE_SESSION);
  // --- STATES ---
  const [activeTab, setActiveTab] = useState<TabView>("ATTENDANCE");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});
  // Almacena las notas por ID de jugador: { "player_123": "Buen control", "player_456": "Falta intensidad" }
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA FETCHING ---
  const { data, loading, error }: any = useQuery(GET_SESSION_FULL_DETAIL, {
    variables: { sessionId: sessionId },
    fetchPolicy: "network-only",
  });
  const [ratePlayer] = useMutation(RATE_PLAYER_PERFORMANCE); // ✅ Ahora usamos esto
  const [registerAttendance] = useMutation(REGISTER_ATTENDANCE);

  // --- HANDLERS ---

  const handleCompleteSession = async () => {
    if (
      !confirm(
        "¿Estás seguro de finalizar el entrenamiento? Esto cerrará la asistencia.",
      )
    )
      return;

    try {
      await completeSession({
        variables: { sessionId },
        // Actualizamos la caché local para que cambie el estado visualmente sin recargar
        update: (cache, { data }: any) => {
          const existingData: any = cache.readQuery({
            query: GET_SESSION_FULL_DETAIL,
            variables: { sessionId },
          });
          cache.writeQuery({
            query: GET_SESSION_FULL_DETAIL,
            variables: { sessionId },
            data: {
              trainingSession: {
                ...existingData.trainingSession,
                status: data.completeTrainingSession.status,
              },
            },
          });
        },
      });
      alert("Entrenamiento finalizado correctamente 🏁");
      router.push("/dashboard/coach"); // Opcional: volver al home
    } catch (error) {
      console.error(error);
      alert("Error al finalizar la sesión");
    }
  };
  const handleAttendance = async (
    playerId: string,
    status: AttendanceStatus,
  ) => {
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
      if (attendanceMap[p.id] !== "PRESENT") handleAttendance(p.id, "PRESENT");
    });
  };

  const handleRating = (playerId: string, rating: number) => {
    setRatingsMap((prev) => ({ ...prev, [playerId]: rating }));
  };

  const saveEvaluations = async () => {
    setIsSaving(true);

    // Filtramos solo los jugadores que tienen una calificación marcada
    const ratedPlayerIds = Object.keys(ratingsMap);

    if (ratedPlayerIds.length === 0) {
      setIsSaving(false);
      return alert("Califica al menos a un jugador antes de guardar.");
    }

    try {
      // Enviamos todas las peticiones en paralelo (Bulk Save)
      const promises = ratedPlayerIds.map((playerId) => {
        return ratePlayer({
          variables: {
            sessionId: sessionId,
            playerId: playerId,
            rating: ratingsMap[playerId],
            notes: feedbackMap[playerId] || "", // Enviamos nota vacía si no escribió nada
          },
        });
      });

      await Promise.all(promises);

      alert("✅ Evaluaciones guardadas correctamente");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar las evaluaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- EFFECT ---
  useEffect(() => {
    if (data && !loading) {
      const attMap: Record<string, AttendanceStatus> = {};
      const rateMap: Record<string, number> = {};
      const feedMap: Record<string, string> = {}; // <--- Mapa temporal para notas

      data.trainingSession.attendance.forEach((r: any) => {
        // 1. Cargar Asistencia
        attMap[r.player.id] = r.status;

        // 2. Cargar Ratings existentes
        if (r.rating) rateMap[r.player.id] = r.rating;

        // 3. Cargar Feedback existente
        if (r.feedback) feedMap[r.player.id] = r.feedback;
      });

      setAttendanceMap(attMap);
      setRatingsMap(rateMap);
      setFeedbackMap(feedMap); // <--- Guardamos en el estado
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
  const tacticalBoards: TacticalBoardData[] = session.tacticalBoards || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* ================= HEADER ================= */}
      {/* ================= HEADER ================= */}
      <div
        className={`pt-8 px-6 pb-16 rounded-b-[2.5rem] shadow-xl relative z-20 transition-all duration-500 ease-in-out
          ${session.status === "COMPLETED" ? "bg-slate-800" : "bg-[#312E81]"}`}
      >
        {/* Top Bar: Back & Status */}
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white p-2 -ml-2 transition-colors active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Status Badge */}
          <div
            className={`backdrop-blur-md border px-3 py-1 rounded-full flex items-center gap-2 transition-colors
              ${
                session.status === "COMPLETED"
                  ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-400"
                  : "bg-white/10 border-white/20 text-white"
              }`}
          >
            {session.status === "COMPLETED" ? (
              <CheckCircle2 size={14} />
            ) : (
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse shadow-[0_0_8px_#10B981]"></div>
            )}
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {session.status === "COMPLETED" ? "Finalizado" : "En Curso"}
            </span>
          </div>
        </div>

        {/* Main Content & Action */}
        <div className="flex justify-between items-end gap-4">
          {/* Title & Meta Data */}
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white mb-3 leading-tight">
              {session.category.name}
            </h1>

            <div className="flex flex-col gap-2 text-indigo-100/80 text-sm font-medium">
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

          {/* Finalize Button (Only if NOT completed) */}
          {session.status !== "COMPLETED" && (
            <button
              onClick={handleCompleteSession}
              disabled={completing}
              className="bg-white text-[#312E81] hover:bg-indigo-50 px-5 py-3 rounded-2xl text-xs font-black shadow-lg shadow-black/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-1"
            >
              {completing ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Finalizar</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
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
              </div>
              <button
                onClick={handleMarkAllPresent}
                className="bg-[#312E81] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm active:scale-95 transition-transform"
              >
                Todos Presentes
              </button>
            </div>

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

        {/* --- TAB: PLANIFICACIÓN (Ejercicios) --- */}
        {activeTab === "PLANNING" && (
          <div className="space-y-4 pb-24">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
              <h3 className="text-[#312E81] font-bold text-sm flex items-center gap-2 mb-1">
                <ClipboardList className="w-4 h-4" /> Notas del Entrenador
              </h3>
              <p className="text-sm text-gray-600 italic">
                {session.notes || "Sin notas específicas."}
              </p>
            </div>
            {session.exercises?.map((item: any, idx: number) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3"
              >
                <div className="flex h-28">
                  <div className="w-32 bg-gray-100 relative shrink-0">
                    {item.exercise.imageUrl ? (
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
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 p-3 flex flex-col relative">
                    <h4 className="font-bold text-[#312E81] text-sm leading-tight line-clamp-2 mb-1">
                      {item.exercise.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-snug">
                      {item.exercise.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB: PIZARRA TÁCTICA (NUEVO REPRODUCTOR) --- */}
        {activeTab === "TACTICS" && (
          <div className="space-y-6 pb-24">
            {tacticalBoards.length === 0 ? (
              <EmptyState
                icon={Map}
                message="No hay estrategias asignadas a esta sesión."
              />
            ) : (
              tacticalBoards.map((tb, index) => (
                <div
                  key={tb.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Header Pizarra */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-[#312E81] text-lg">
                      {tb.tacticalBoard.title}
                    </h3>
                    {tb.tacticalBoard.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tb.tacticalBoard.description}
                      </p>
                    )}
                  </div>

                  {/* Reproductor Canvas */}
                  <TacticalPlayer
                    initialState={tb.tacticalBoard.initialState}
                    animation={tb.tacticalBoard.animation}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB: EVALUACIÓN --- */}
        {activeTab === "EVALUATION" && (
          <div className="pb-32 space-y-4 animate-in fade-in slide-in-from-right-4">
            {/* Header Informativo */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
              <div className="bg-amber-100 p-2 rounded-full">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-900 font-bold">
                  Rendimiento del Jugador
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Califica del 1 al 5. Los jugadores ausentes no pueden ser
                  evaluados. Esta información es privada para el staff técnico.
                </p>
              </div>
            </div>

            {/* Lista de Jugadores para Evaluar */}
            <div className="space-y-3">
              {players.map((player) => {
                const isAbsent = attendanceMap[player.id] === "ABSENT";
                const currentRating = ratingsMap[player.id] || 0;

                return (
                  <div
                    key={player.id}
                    className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${
                      isAbsent
                        ? "border-gray-100 opacity-60 grayscale bg-gray-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {/* Cabecera Card: Avatar + Nombre + Estrellas */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar player={player} />
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">
                            {player.firstName} {player.lastName}
                          </h3>
                          <p className="text-xs text-gray-400 font-medium">
                            {isAbsent ? (
                              <span className="text-red-400 font-bold">
                                AUSENTE
                              </span>
                            ) : (
                              "Delantero"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Selector de Estrellas */}
                      <div className="flex gap-1">
                        {!isAbsent &&
                          [1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRating(player.id, star)}
                              className="focus:outline-none transition-transform active:scale-110 p-1"
                              type="button"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  currentRating >= star
                                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                    : "text-gray-200 fill-gray-50"
                                }`}
                              />
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Input de Feedback (Solo si no está ausente) */}
                    {!isAbsent && (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MessageSquare className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          placeholder="Nota técnica (ej: Mejorar control orientado)..."
                          disabled={isAbsent}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-9 pr-4 text-xs font-medium text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          value={feedbackMap[player.id] || ""}
                          // ✅ Actualización del estado
                          onChange={(e) =>
                            setFeedbackMap((prev) => ({
                              ...prev,
                              [player.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botón Flotante Guardar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 lg:static lg:bg-transparent lg:border-none lg:p-0 z-40">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={saveEvaluations}
                  disabled={isSaving}
                  className="w-full bg-[#312E81] hover:bg-indigo-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Guardar Evaluaciones
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. COMPONENTE REPRODUCTOR DE TÁCTICA
// ---------------------------------------------------------------------------

const TacticalPlayer = ({
  initialState,
  animation,
}: {
  initialState: any;
  animation?: any[];
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de reproducción
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [currentTokens, setCurrentTokens] = useState(
    initialState?.tokens || [],
  );
  const [currentStrokes, setCurrentStrokes] = useState(
    initialState?.strokes || [],
  );

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const FRAME_RATE_MS = 50;

  // Dibujar en Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const container = containerRef.current;

    if (!canvas || !ctx || !container) return;

    // Ajustar tamaño
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;

    // Dibujar Trazos
    currentStrokes.forEach((stroke: any) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }
      ctx.stroke();
    });
  }, [currentStrokes, currentTokens]); // Redibujar cuando cambian

  // Lógica de Animación
  useEffect(() => {
    if (isPlaying && animation && animation.length > 0) {
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          const next = prev + 1;
          if (next >= animation.length) {
            setIsPlaying(false);
            return prev;
          }
          // Actualizar estado visual con el frame actual
          const frame = animation[next];
          setCurrentTokens(frame.tokens);
          setCurrentStrokes(frame.strokes);
          return next;
        });
      }, FRAME_RATE_MS);
    } else {
      if (playbackIntervalRef.current)
        clearInterval(playbackIntervalRef.current);
    }
    return () => {
      if (playbackIntervalRef.current)
        clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, animation]);

  const handlePlayPause = () => {
    if (!animation || animation.length === 0) return;
    if (playbackIndex >= animation.length - 1) setPlaybackIndex(0); // Reiniciar si terminó
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
    setCurrentTokens(initialState.tokens);
    setCurrentStrokes(initialState.strokes);
  };

  return (
    <div
      className="relative w-full aspect-[4/3] bg-[#2c8f43] border-t-4 border-b-4 border-[#1a5c2b] overflow-hidden"
      ref={containerRef}
    >
      {/* Fondo Cancha */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-1/2 left-1/2 w-[20%] h-[25%] border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 w-full h-0.5 bg-white"></div>
      </div>

      {/* Canvas de Dibujos */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* Tokens (Jugadores) */}
      {currentTokens.map((token: any) => (
        <div
          key={token.id}
          className={`
                        absolute flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] shadow-sm z-20 transition-all duration-[50ms] ease-linear
                        ${token.type === "team-a" ? "bg-red-600 text-white border border-white" : ""}
                        ${token.type === "team-b" ? "bg-blue-600 text-white border border-white" : ""}
                        ${token.type === "ball" ? "bg-white text-black border border-black w-3 h-3" : ""}
                        ${token.type === "cone" ? "bg-orange-500 w-4 h-4 rounded-none clip-path-triangle" : ""}
                    `}
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {(token.type === "team-a" || token.type === "team-b") && token.label}
        </div>
      ))}

      {/* Controles */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-30">
        <button
          onClick={handlePlayPause}
          disabled={!animation}
          className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors disabled:opacity-50"
        >
          {isPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
        </button>

        <button
          onClick={handleReset}
          className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          <RotateCcw size={16} />
        </button>

        {/* Barra de Progreso */}
        {animation && (
          <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-white transition-all duration-[50ms] ease-linear"
              style={{
                width: `${(playbackIndex / (animation.length - 1)) * 100}%`,
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. OTROS COMPONENTES UI (Helpers)
// ---------------------------------------------------------------------------

function TabItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2 px-1 rounded-xl transition-all ${active ? "bg-indigo-50 text-[#312E81]" : "text-gray-400 hover:bg-gray-50"}`}
    >
      <Icon
        className={`w-5 h-5 mb-1 ${active ? "stroke-[2.5px]" : "stroke-2"}`}
      />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function AttendanceBtn({ status, current, onClick }: any) {
  const config: any = {
    PRESENT: { icon: CheckCircle2, bg: "bg-[#10B981]" },
    LATE: { icon: Clock, bg: "bg-amber-500" },
    ABSENT: { icon: XCircle, bg: "bg-red-500" },
  };
  const active = status === current;
  const { icon: Icon, bg } = config[status];
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${active ? `${bg} text-white shadow-md` : "bg-gray-50 text-gray-300"}`}
    >
      <Icon className="w-5 h-5" strokeWidth={active ? 3 : 2} />
    </button>
  );
}

function Avatar({ player }: any) {
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[#312E81] text-xs font-bold">
          {player.firstName[0]}
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
    </div>
  );
}
function ErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center text-red-500 font-bold">
      Error de Carga
    </div>
  );
}
