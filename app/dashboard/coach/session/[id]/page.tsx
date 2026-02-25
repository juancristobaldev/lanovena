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
  Activity,
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

const GET_TEST_PROTOCOLS = gql`
  query GetTestProtocols {
    getAvailableTestProtocols {
      id
      name
      category
      unit
    }
  }
`;

const CREATE_EVALUATION = gql`
  mutation CreateEvaluation($input: CreateEvaluationInput!) {
    createEvaluation(createEvaluationInput: $input) {
      id
      value
      protocol {
        name
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// 2. TYPES & INTERFACES & DICCIONARIOS
// ---------------------------------------------------------------------------

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PENDING";
type TabView = "ATTENDANCE" | "PLANNING" | "EVALUATION" | "TACTICS";

const UNIT_LABELS: Record<string, string> = {
  SECONDS: "seg",
  METERS: "m",
  CENTIMETERS: "cm",
  POINTS: "pts",
  PERCENTAGE: "%",
  COUNT: "reps/niveles",
};

interface TestProtocol {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface TacticalBoardData {
  id: string;
  tacticalBoard: {
    id: string;
    title: string;
    description?: string;
    initialState: any;
    animation?: any;
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
  const [selectedProtocol, setSelectedProtocol] = useState<TestProtocol | null>(
    null,
  );
  const [evalValuesMap, setEvalValuesMap] = useState<Record<string, string>>(
    {},
  );
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA FETCHING ---
  const {
    data: sessionData,
    loading: loadingSession,
    error: errorSession,
  }: any = useQuery(GET_SESSION_FULL_DETAIL, {
    variables: { sessionId },
    fetchPolicy: "network-only",
  });

  const { data: protocolsData }: any = useQuery(GET_TEST_PROTOCOLS, {
    fetchPolicy: "cache-first",
  });

  const [completeSession, { loading: completing }] =
    useMutation(COMPLETE_SESSION);
  const [registerAttendance] = useMutation(REGISTER_ATTENDANCE);
  const [ratePlayer] = useMutation(RATE_PLAYER_PERFORMANCE);
  const [createEvaluation] = useMutation(CREATE_EVALUATION);

  // --- EFFECT ---
  useEffect(() => {
    if (sessionData && !loadingSession) {
      const attMap: Record<string, AttendanceStatus> = {};
      const rateMap: Record<string, number> = {};
      const feedMap: Record<string, string> = {};

      sessionData.trainingSession.attendance.forEach((r: any) => {
        attMap[r.player.id] = r.status;
        if (r.rating) rateMap[r.player.id] = r.rating;
        if (r.feedback) feedMap[r.player.id] = r.feedback;
      });

      setAttendanceMap(attMap);
      setRatingsMap(rateMap);
      setFeedbackMap(feedMap);
    }
  }, [sessionData, loadingSession]);

  // --- HANDLERS ---
  const handleCompleteSession = async () => {
    if (
      !confirm(
        "¿Estás seguro de finalizar el entrenamiento? Esto cerrará la asistencia y bloqueará cambios.",
      )
    )
      return;

    try {
      await completeSession({
        variables: { sessionId },
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
      router.push("/dashboard/coach");
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
    const players = sessionData?.trainingSession?.category?.players || [];
    players.forEach((p: Player) => {
      if (attendanceMap[p.id] !== "PRESENT") handleAttendance(p.id, "PRESENT");
    });
  };

  const handleRating = (playerId: string, rating: number) => {
    setRatingsMap((prev) => ({ ...prev, [playerId]: rating }));
  };

  const saveEvaluations = async () => {
    if (!selectedProtocol) return alert("Selecciona una prueba primero.");

    const playerIdsToSave = Object.keys(evalValuesMap).filter(
      (id) => evalValuesMap[id].trim() !== "",
    );

    if (playerIdsToSave.length === 0) {
      setIsSaving(false);
      return alert(
        "Ingresa el resultado de al menos un jugador antes de guardar.",
      );
    }

    setIsSaving(true);
    try {
      const promises = playerIdsToSave.map((playerId) => {
        return createEvaluation({
          variables: {
            input: {
              protocolId: selectedProtocol.id,
              value: parseFloat(evalValuesMap[playerId]),
              notes: feedbackMap[playerId] || "",
              playerId: playerId,
              sessionId: sessionId,
            },
          },
        });
      });

      await Promise.all(promises);

      alert(
        `✅ Se guardaron ${playerIdsToSave.length} evaluaciones exitosamente.`,
      );
      setEvalValuesMap({});
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar las evaluaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    const values = Object.values(attendanceMap);
    const total = sessionData?.trainingSession?.category?.players?.length || 0;
    return {
      present: values.filter((s) => s === "PRESENT").length,
      late: values.filter((s) => s === "LATE").length,
      absent: values.filter((s) => s === "ABSENT").length,
      total,
    };
  }, [attendanceMap, sessionData]);

  if (loadingSession) return <LoadingScreen />;
  if (errorSession) return <ErrorScreen />;

  const session = sessionData.trainingSession;
  const players: Player[] = session.category.players;
  const tacticalBoards: TacticalBoardData[] = session.tacticalBoards || [];
  const protocols: TestProtocol[] =
    protocolsData?.getAvailableTestProtocols || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-[#10B981] selection:text-white">
      {/* ================= HEADER ================= */}
      <div
        className={`pt-8 px-6 pb-16 rounded-b-[2.5rem] shadow-xl relative z-20 transition-all duration-500 ease-in-out ${session.status === "COMPLETED" ? "bg-slate-800" : "bg-[#312E81]"}`}
      >
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white p-2 -ml-2 transition-colors active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            className={`backdrop-blur-md border px-3 py-1 rounded-full flex items-center gap-2 transition-colors ${session.status === "COMPLETED" ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-400" : "bg-white/10 border-white/20 text-white"}`}
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

        <div className="flex justify-between items-end gap-4">
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
            icon={Activity}
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

        {/* --- TAB: PIZARRA TÁCTICA --- */}
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
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col">
                    <h3 className="font-bold text-[#312E81] text-lg">
                      {tb.tacticalBoard.title}
                    </h3>
                    {tb.tacticalBoard.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tb.tacticalBoard.description}
                      </p>
                    )}
                  </div>
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
          <div className="pb-32 space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-500" /> 1. Selecciona la
                Prueba
              </h3>
              {protocols.length === 0 ? (
                <div className="p-4 bg-gray-100 rounded-xl text-xs text-gray-500 text-center">
                  No hay pruebas configuradas en el sistema.
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar custom-scrollbar">
                  {protocols.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProtocol(p)}
                      className={`whitespace-nowrap px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 flex flex-col items-start min-w-[140px]
                        ${selectedProtocol?.id === p.id ? "bg-[#312E81] border-[#312E81] text-white shadow-md transform scale-[0.98]" : "bg-white border-gray-100 text-gray-600 hover:border-indigo-200"}`}
                    >
                      <span className="block truncate w-full text-left">
                        {p.name}
                      </span>
                      <span
                        className={`text-[10px] mt-1 uppercase tracking-wider ${selectedProtocol?.id === p.id ? "text-indigo-200" : "text-gray-400"}`}
                      >
                        Unidad: {UNIT_LABELS[p.unit] || p.unit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProtocol ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    2. Ingreso de Resultados
                  </h3>
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                    {
                      Object.values(evalValuesMap).filter((v) => v !== "")
                        .length
                    }{" "}
                    / {players.length}
                  </span>
                </div>

                {players.map((player) => {
                  const isAbsent = attendanceMap[player.id] === "ABSENT";
                  const currentRating = ratingsMap[player.id] || 0;

                  return (
                    <div
                      key={player.id}
                      className={`relative bg-white p-4 rounded-2xl shadow-sm border transition-all overflow-hidden ${isAbsent ? "border-red-100 bg-red-50/30 opacity-60" : "border-gray-200 focus-within:border-[#10B981] focus-within:ring-4 focus-within:ring-emerald-50"}`}
                    >
                      {isAbsent && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">
                          AUSENTE
                        </div>
                      )}

                      <div className="flex justify-between items-center gap-4">
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <Avatar player={player} />
                            <div className="truncate">
                              <h3 className="font-bold text-gray-800 text-sm truncate">
                                {player.firstName} {player.lastName}
                              </h3>
                            </div>
                          </div>

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
                                    className={`w-4 h-4 transition-colors ${currentRating >= star ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-50"}`}
                                  />
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1 bg-gray-50 rounded-xl p-2 border border-gray-100 shadow-inner">
                            <input
                              type="number"
                              step="0.01"
                              disabled={isAbsent}
                              placeholder="0.0"
                              className="w-20 bg-transparent text-right text-3xl font-black text-[#312E81] focus:outline-none disabled:text-gray-400 placeholder-gray-300"
                              value={evalValuesMap[player.id] || ""}
                              onChange={(e) =>
                                setEvalValuesMap((prev) => ({
                                  ...prev,
                                  [player.id]: e.target.value,
                                }))
                              }
                            />
                            <span className="text-xs font-bold text-gray-400 mr-1">
                              {UNIT_LABELS[selectedProtocol.unit] ||
                                selectedProtocol.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isAbsent && (
                        <div className="mt-3 relative group">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-indigo-500" />
                          <input
                            type="text"
                            placeholder="Anota observaciones técnicas aquí..."
                            disabled={isAbsent}
                            className="w-full bg-transparent border border-gray-100 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-600 focus:bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition-colors"
                            value={feedbackMap[player.id] || ""}
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
            ) : (
              <EmptyState
                icon={Trophy}
                message="Selecciona una prueba arriba para ingresar resultados."
              />
            )}

            {selectedProtocol && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent lg:static lg:bg-none lg:p-0 z-40">
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={saveEvaluations}
                    disabled={isSaving}
                    className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" /> Guardando
                        datos...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" /> Guardar Evaluaciones (
                        {selectedProtocol.name})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. COMPONENTE REPRODUCTOR DE TÁCTICA MEJORADO (PIZARRA)
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

  // Parseo defensivo por si los datos vienen como String (GraphQL a veces devuelve JSON como String)
  let parsedState = initialState;
  let parsedAnim = animation;
  try {
    if (typeof initialState === "string")
      parsedState = JSON.parse(initialState);
  } catch (e) {}
  try {
    if (typeof animation === "string") parsedAnim = JSON.parse(animation);
  } catch (e) {}

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [currentTokens, setCurrentTokens] = useState(parsedState?.tokens || []);
  const [currentStrokes, setCurrentStrokes] = useState(
    parsedState?.strokes || [],
  );

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const FRAME_RATE_MS = 50;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const container = containerRef.current;

    if (!canvas || !ctx || !container) return;

    // Asegurarse de que el canvas ocupa todo el contenedor correctamente
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;

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
  }, [currentStrokes, currentTokens]);

  // Manejar redimensionamiento de pantalla para repintar trazos
  useEffect(() => {
    const handleResize = () => setCurrentStrokes([...currentStrokes]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentStrokes]);

  useEffect(() => {
    if (isPlaying && parsedAnim && parsedAnim.length > 0) {
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          const next = prev + 1;
          if (next >= parsedAnim.length) {
            setIsPlaying(false);
            return prev;
          }
          const frame = parsedAnim[next];
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
  }, [isPlaying, parsedAnim]);

  const handlePlayPause = () => {
    if (!parsedAnim || parsedAnim.length === 0) return;
    if (playbackIndex >= parsedAnim.length - 1) setPlaybackIndex(0);
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
    setCurrentTokens(parsedState.tokens || []);
    setCurrentStrokes(parsedState.strokes || []);
  };

  return (
    <div
      className="relative w-full aspect-[16/10] sm:aspect-[4/3] bg-[#2c8f43] border-[6px] border-white shadow-inner overflow-hidden select-none"
      ref={containerRef}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.15) 50px, rgba(255,255,255,0.15) 52px)",
      }}
    >
      {/* --- LINEAS DE LA CANCHA --- */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <div className="absolute top-1/2 left-1/2 w-[15%] h-[20%] min-w-[80px] min-h-[80px] border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 w-full h-0.5 bg-white/70"></div>
        <div className="absolute top-0 left-1/2 w-[30%] h-[15%] border-2 border-t-0 border-white -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-[30%] h-[15%] border-2 border-b-0 border-white -translate-x-1/2"></div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* --- TOKENS (JUGADORES, PELOTA, ARCOS) --- */}
      {currentTokens.map((token: any) => (
        <div
          key={token.id}
          className={`absolute flex flex-col items-center justify-center z-20 transition-all ease-linear`}
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            transform: "translate(-50%, -50%)",
            transitionDuration: isPlaying ? `${FRAME_RATE_MS}ms` : "0s",
          }}
        >
          <div
            className={`
              flex items-center justify-center shadow-md
              ${token.type === "team-a" ? "bg-red-600 text-white border-2 border-white w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-xs sm:text-sm" : ""}
              ${token.type === "team-b" ? "bg-blue-600 text-white border-2 border-white w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-xs sm:text-sm" : ""}
              ${token.type === "ball" ? "bg-white text-black border-2 border-black w-4 h-4 sm:w-5 sm:h-5 rounded-full z-30" : ""}
              ${token.type === "cone" ? "bg-orange-500 w-5 h-5 sm:w-6 sm:h-6 border border-white/50" : ""}
              ${token.type === "goal" ? "bg-transparent border-4 border-white/80 w-24 h-12 rounded-sm shadow-none" : ""}
            `}
            style={{
              clipPath:
                token.type === "cone"
                  ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                  : "none",
            }}
          >
            {(token.type === "team-a" || token.type === "team-b") &&
              token.label}
          </div>

          {/* Renderizado de Nombres si es que se asignaron usando "Alinear Plantel" */}
          {token.playerName && (
            <span className="mt-1 bg-white/90 text-gray-900 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap shadow-sm border border-gray-200">
              {token.playerName}
            </span>
          )}
        </div>
      ))}

      {/* --- CONTROLES DE REPRODUCCIÓN MEJORADOS --- */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200 w-[90%] max-w-[300px] z-30">
        <button
          onClick={handlePlayPause}
          disabled={!parsedAnim || parsedAnim.length === 0}
          className="bg-[#312E81] hover:bg-indigo-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:bg-gray-400 shadow-md active:scale-95"
        >
          {isPlaying ? (
            <PauseCircle size={20} fill="currentColor" />
          ) : (
            <PlayCircle size={20} fill="currentColor" />
          )}
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-full transition-colors border border-gray-200 active:scale-95"
        >
          <RotateCcw size={16} />
        </button>

        {parsedAnim && parsedAnim.length > 0 ? (
          <div className="flex-1 flex items-center pr-2">
            <input
              type="range"
              min="0"
              max={parsedAnim.length - 1}
              value={playbackIndex}
              onChange={(e) => {
                setPlaybackIndex(Number(e.target.value));
                const frame = parsedAnim[Number(e.target.value)];
                setCurrentTokens(frame.tokens);
                setCurrentStrokes(frame.strokes);
              }}
              className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#312E81]"
            />
          </div>
        ) : (
          <div className="flex-1 text-xs text-gray-400 font-bold px-2 text-center uppercase">
            Sin animación
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
      className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2 px-1 rounded-xl transition-all ${
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
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
        active
          ? `${bg} text-white shadow-md`
          : "bg-gray-50 text-gray-300 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={active ? 3 : 2} />
    </button>
  );
}

function Avatar({ player }: any) {
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[#312E81] text-xs font-bold uppercase">
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
      <div className="h-10 bg-gray-200 rounded-xl mb-4 w-1/2"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl w-full"></div>
        ))}
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-red-500">
      <AlertCircle className="w-12 h-12 mb-4" />
      <h2 className="text-xl font-bold mb-2">Error de Carga</h2>
      <p className="text-sm opacity-80">
        Hubo un problema al cargar los datos de la sesión. Revisa tu conexión.
      </p>
    </div>
  );
}
