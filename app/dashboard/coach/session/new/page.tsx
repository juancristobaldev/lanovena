"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  ArrowLeft,
  Dumbbell,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Save,
  Loader2,
  Users,
  Bell,
  Swords,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  PlusCircle,
  Map, // Icono para Pizarras
  LayoutList,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// === TYPES ===
interface SessionFormValues {
  title: string;
  notes?: string;
  date: string;
  time: string;
  location: string;
  categoryId: string;
  rivalName?: string;
  notify?: boolean;
  exerciseIds: string[];
  tacticalBoardIds: string[]; // <--- NUEVO CAMPO
}

interface Category {
  id: string;
  name: string;
}

interface Exercise {
  id: string;
  title: string;
  difficulty: "BASIC" | "INTERMEDIATE" | "ADVANCED";
  imageUrl?: string;
  objective?: string;
}

interface TacticalBoard {
  id: string;
  title: string;
  description?: string;
  animation?: any; // Para saber si es animada
}

// === GRAPHQL ===

// 1. Datos Coach
const GET_COACH_DATA = gql`
  query GetCoachData {
    meCoach {
      id
      schoolId
      coachProfile {
        categories {
          id
          name
        }
      }
    }
  }
`;

// 2. Ejercicios (Por Escuela)
const GET_EXERCISES = gql`
  query GetSchoolExercises($schoolId: String!) {
    mySchoolExercises(schoolId: $schoolId) {
      id
      title
      difficulty
      imageUrl
      objective
    }
  }
`;

// 3. Pizarras (Por Categoría)
const GET_BOARDS_BY_CATEGORY = gql`
  query GetBoardsByCategory($categoryId: ID!) {
    tacticalBoardsByCategory(categoryId: $categoryId) {
      id
      title
      description
      animation
    }
  }
`;

const CREATE_SESSION = gql`
  mutation CreateTrainingSession($input: CreateTrainingSessionInput!) {
    createTrainingSession(input: $input) {
      id
    }
  }
`;

const CREATE_MATCH = gql`
  mutation CreateMatch($input: CreateMatchInput!) {
    createMatch(input: $input) {
      id
    }
  }
`;

export default function NewSessionPage() {
  const router = useRouter();
  const { showAlert } = useAlert();

  // Estado UI
  const [sessionType, setSessionType] = useState<"TRAINING" | "MATCH">(
    "TRAINING",
  );
  const [planningTab, setPlanningTab] = useState<"EXERCISES" | "TACTICS">(
    "EXERCISES",
  ); // Nuevo Tab

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionFormValues>({
    defaultValues: {
      notify: true,
      location: "Cancha Principal",
      date: new Date().toISOString().split("T")[0],
      time: "18:00",
      exerciseIds: [],
      tacticalBoardIds: [], // Init array
    },
  });

  const notifyValue = watch("notify");
  const selectedCategoryId = watch("categoryId");
  const selectedExerciseIds = watch("exerciseIds") || [];
  const selectedBoardIds = watch("tacticalBoardIds") || [];

  // --- QUERIES ---
  const { data: coachData, loading: loadingCoach }: any =
    useQuery(GET_COACH_DATA);
  const schoolId = coachData?.meCoach?.schoolId;
  const categories: Category[] =
    coachData?.meCoach?.coachProfile?.categories || [];

  // Fetch Ejercicios
  const { data: exercisesData, loading: loadingExercises }: any = useQuery(
    GET_EXERCISES,
    {
      variables: { schoolId },
      skip: !schoolId,
      fetchPolicy: "cache-and-network",
    },
  );

  // Fetch Pizarras (Depende de la categoría seleccionada)
  const { data: boardsData, loading: loadingBoards }: any = useQuery(
    GET_BOARDS_BY_CATEGORY,
    {
      variables: { categoryId: selectedCategoryId },
      skip: !selectedCategoryId, // Solo busca si hay categoría
      fetchPolicy: "cache-and-network",
    },
  );

  const allExercises: Exercise[] = exercisesData?.mySchoolExercises || [];
  const allBoards: TacticalBoard[] = boardsData?.tacticalBoardsByCategory || [];

  // --- MUTATIONS ---
  const [createTraining, { loading: loadingTraining }] =
    useMutation(CREATE_SESSION);
  const [createMatch, { loading: loadingMatch }] = useMutation(CREATE_MATCH);

  const loading = loadingTraining || loadingMatch || loadingCoach;
  const themeBg = sessionType === "MATCH" ? "bg-[#312E81]" : "bg-[#10B981]";
  const themeBorder =
    sessionType === "MATCH" ? "focus:ring-[#312E81]" : "focus:ring-[#10B981]";

  // --- LOGICA ORDENAMIENTO (GENÉRICA) ---
  const handleSelection = (id: string, type: "EXERCISE" | "BOARD") => {
    const list = type === "EXERCISE" ? selectedExerciseIds : selectedBoardIds;
    const field = type === "EXERCISE" ? "exerciseIds" : "tacticalBoardIds";

    if (list.includes(id)) {
      // Remover
      setValue(
        field,
        list.filter((item) => item !== id),
      );
    } else {
      // Agregar
      setValue(field, [...list, id]);
    }
  };

  const handleReorder = (
    index: number,
    direction: "UP" | "DOWN",
    type: "EXERCISE" | "BOARD",
  ) => {
    const list =
      type === "EXERCISE" ? [...selectedExerciseIds] : [...selectedBoardIds];
    const field = type === "EXERCISE" ? "exerciseIds" : "tacticalBoardIds";

    if (direction === "UP") {
      if (index === 0) return;
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else {
      if (index === list.length - 1) return;
      [list[index + 1], list[index]] = [list[index], list[index + 1]];
    }
    setValue(field, list);
  };

  const handleRemove = (id: string, type: "EXERCISE" | "BOARD") => {
    const list = type === "EXERCISE" ? selectedExerciseIds : selectedBoardIds;
    const field = type === "EXERCISE" ? "exerciseIds" : "tacticalBoardIds";
    setValue(
      field,
      list.filter((item) => item !== id),
    );
  };

  // --- SUBMIT ---
  const onSubmit: SubmitHandler<SessionFormValues> = async (formData) => {
    const dateTime = new Date(`${formData.date}T${formData.time}`);

    try {
      if (sessionType === "TRAINING") {
        await createTraining({
          variables: {
            input: {
              title: formData.title,
              notes: formData.notes,
              date: dateTime,
              location: formData.location,
              categoryId: formData.categoryId,
              exerciseIds: formData.exerciseIds,
              tacticalBoardIds: formData.tacticalBoardIds, // Enviamos las pizarras
            },
          },
        });
      } else {
        await createMatch({
          variables: {
            input: {
              date: dateTime,
              rivalName: formData.rivalName,
              location: formData.location,
              categoryId: formData.categoryId,
              notes: formData.notes,
              isHome: true,
            },
          },
        });
      }

      showAlert("Actividad programada correctamente", "success");
      router.push("/dashboard/coach");
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || "Error al crear la actividad", "error");
    }
  };

  if (loadingCoach) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  // Filtros de disponibles
  const availableExercises = allExercises.filter(
    (ex) => !selectedExerciseIds.includes(ex.id),
  );
  const availableBoards = allBoards.filter(
    (b) => !selectedBoardIds.includes(b.id),
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Nueva Actividad</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-8">
        {/* SELECTOR DE TIPO */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex relative">
          <button
            type="button"
            onClick={() => setSessionType("TRAINING")}
            className={`flex-1 py-4 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              sessionType === "TRAINING"
                ? "bg-emerald-50 text-[#10B981] ring-1 ring-[#10B981]"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <Dumbbell
              size={24}
              strokeWidth={sessionType === "TRAINING" ? 2.5 : 2}
            />
            Entrenamiento
          </button>
          <button
            type="button"
            onClick={() => setSessionType("MATCH")}
            className={`flex-1 py-4 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              sessionType === "MATCH"
                ? "bg-indigo-50 text-[#312E81] ring-1 ring-[#312E81]"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <Trophy size={24} strokeWidth={sessionType === "MATCH" ? 2.5 : 2} />
            Partido
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Equipo
              </label>
              <div className="relative">
                <Users
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={20}
                />
                <select
                  {...register("categoryId", {
                    required: "Selecciona un equipo",
                  })}
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none appearance-none font-bold text-gray-800 transition-all focus:bg-white focus:ring-2 ${themeBorder}`}
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-xs mt-1 ml-2">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
            </div>

            {sessionType === "TRAINING" ? (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Objetivo / Título
                </label>
                <input
                  type="text"
                  {...register("title", {
                    required: sessionType === "TRAINING",
                  })}
                  placeholder="Ej: Salida de balón"
                  className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium transition-all focus:bg-white focus:ring-2 ${themeBorder}`}
                />
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Rival
                </label>
                <div className="relative">
                  <Swords
                    className="absolute left-4 top-3.5 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    {...register("rivalName", {
                      required: sessionType === "MATCH",
                    })}
                    placeholder="Ej: Colo-Colo"
                    className={`w-full pl-12 pr-4 py-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl outline-none font-bold text-[#312E81] placeholder-indigo-300 transition-all focus:bg-white focus:ring-2 ${themeBorder}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: PLANIFICACIÓN (SOLO ENTRENAMIENTO) */}
          {sessionType === "TRAINING" && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
              {/* TABS DE PLANIFICACIÓN */}
              <div className="flex border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setPlanningTab("EXERCISES")}
                  className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${planningTab === "EXERCISES" ? "text-emerald-600 bg-emerald-50/50" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <Dumbbell size={16} /> Ejercicios (
                  {selectedExerciseIds.length})
                </button>
                <div className="w-px bg-gray-100"></div>
                <button
                  type="button"
                  onClick={() => setPlanningTab("TACTICS")}
                  className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${planningTab === "TACTICS" ? "text-indigo-600 bg-indigo-50/50" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <Map size={16} /> Estrategia ({selectedBoardIds.length})
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* TAB EJERCICIOS */}
                {planningTab === "EXERCISES" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                    {/* Lista Seleccionada */}
                    {selectedExerciseIds.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider ml-1">
                          Orden de Ejercicios
                        </label>
                        {selectedExerciseIds.map((id, index) => {
                          const ex = allExercises.find((e) => e.id === id);
                          if (!ex) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-3 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100"
                            >
                              <span className="font-bold text-emerald-600 text-sm w-5 text-center">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-bold text-gray-800 text-sm">
                                  {ex.title}
                                </p>
                                <DifficultyBadge level={ex.difficulty} />
                              </div>
                              <OrderingControls
                                isFirst={index === 0}
                                isLast={
                                  index === selectedExerciseIds.length - 1
                                }
                                onUp={() =>
                                  handleReorder(index, "UP", "EXERCISE")
                                }
                                onDown={() =>
                                  handleReorder(index, "DOWN", "EXERCISE")
                                }
                                onRemove={() => handleRemove(id, "EXERCISE")}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Lista Disponibles */}
                    <div>
                      <div className="flex justify-between items-center mb-3 mt-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                          Biblioteca de Ejercicios
                        </label>
                        {loadingExercises && (
                          <Loader2 className="animate-spin w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {availableExercises.map((ex) => (
                          <div
                            key={ex.id}
                            onClick={() => handleSelection(ex.id, "EXERCISE")}
                            className="cursor-pointer rounded-xl p-3 border border-gray-100 hover:border-emerald-200 hover:bg-gray-50 transition-all flex items-center justify-between group"
                          >
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-gray-700">
                                {ex.title}
                              </h4>
                              <p className="text-[10px] text-gray-400 truncate">
                                {ex.objective}
                              </p>
                            </div>
                            <PlusCircle
                              size={20}
                              className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        ))}
                        {availableExercises.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">
                            No hay más ejercicios disponibles.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB PIZARRAS */}
                {planningTab === "TACTICS" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    {!selectedCategoryId ? (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <Map className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Selecciona un equipo arriba para ver sus pizarras.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Lista Seleccionada */}
                        {selectedBoardIds.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider ml-1">
                              Orden de Pizarras
                            </label>
                            {selectedBoardIds.map((id, index) => {
                              const board = allBoards.find((b) => b.id === id);
                              if (!board) return null;
                              return (
                                <div
                                  key={id}
                                  className="flex items-center gap-3 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100"
                                >
                                  <span className="font-bold text-indigo-600 text-sm w-5 text-center">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-800 text-sm">
                                      {board.title}
                                    </p>
                                    {board.animation && (
                                      <span className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded border border-red-200">
                                        Animada
                                      </span>
                                    )}
                                  </div>
                                  <OrderingControls
                                    isFirst={index === 0}
                                    isLast={
                                      index === selectedBoardIds.length - 1
                                    }
                                    onUp={() =>
                                      handleReorder(index, "UP", "BOARD")
                                    }
                                    onDown={() =>
                                      handleReorder(index, "DOWN", "BOARD")
                                    }
                                    onRemove={() => handleRemove(id, "BOARD")}
                                    accentColor="text-indigo-600 hover:bg-indigo-50"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Lista Disponibles */}
                        <div>
                          <div className="flex justify-between items-center mb-3 mt-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                              Mis Pizarras ({availableBoards.length})
                            </label>
                            {loadingBoards && (
                              <Loader2 className="animate-spin w-4 h-4 text-indigo-500" />
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {availableBoards.map((b) => (
                              <div
                                key={b.id}
                                onClick={() => handleSelection(b.id, "BOARD")}
                                className="cursor-pointer rounded-xl p-3 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all flex items-center justify-between group"
                              >
                                <div className="flex-1">
                                  <h4 className="font-bold text-sm text-gray-700">
                                    {b.title}
                                  </h4>
                                  {b.description && (
                                    <p className="text-[10px] text-gray-400 truncate">
                                      {b.description}
                                    </p>
                                  )}
                                </div>
                                <PlusCircle
                                  size={20}
                                  className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                            ))}
                            {availableBoards.length === 0 && (
                              <p className="text-xs text-gray-400 text-center py-4">
                                No hay pizarras guardadas para esta categoría.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN 3: FECHA Y LUGAR (Sin cambios mayores) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="date"
                    {...register("date", { required: true })}
                    className={`w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 ${themeBorder}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Hora
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="time"
                    {...register("time", { required: true })}
                    className={`w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 ${themeBorder}`}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Ubicación
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  {...register("location", { required: true })}
                  placeholder="Ej: Cancha 2"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white focus:ring-2 ${themeBorder}`}
                />
              </div>
            </div>
          </div>

          <div className="h-10"></div>

          {/* BOTÓN SUBMIT */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 lg:static lg:bg-transparent lg:border-none lg:p-0 z-40">
            <div className="max-w-2xl mx-auto">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all
                            ${themeBg} hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save size={22} />{" "}
                    {sessionType === "MATCH"
                      ? "Programar Partido"
                      : "Agendar Entrenamiento"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// === COMPONENTES UI ===

function OrderingControls({
  isFirst,
  isLast,
  onUp,
  onDown,
  onRemove,
  accentColor = "text-emerald-700",
}: any) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={isFirst}
        className={`p-1.5 rounded-lg hover:bg-white disabled:opacity-30 ${accentColor}`}
      >
        <ArrowUp size={16} />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={isLast}
        className={`p-1.5 rounded-lg hover:bg-white disabled:opacity-30 ${accentColor}`}
      >
        <ArrowDown size={16} />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function DifficultyBadge({
  level,
}: {
  level: "BASIC" | "INTERMEDIATE" | "ADVANCED";
}) {
  const styles = {
    BASIC: "bg-emerald-100 text-emerald-700",
    INTERMEDIATE: "bg-amber-100 text-amber-700",
    ADVANCED: "bg-rose-100 text-rose-700",
  };
  const labels = {
    BASIC: "Básico",
    INTERMEDIATE: "Intermedio",
    ADVANCED: "Avanzado",
  };
  // @ts-ignore
  return (
    <span
      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${styles[level] || styles.BASIC}`}
    >
      {labels[level] || "General"}
    </span>
  );
}
