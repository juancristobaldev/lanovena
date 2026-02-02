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

// === GRAPHQL ===

// 1. Obtener Datos del Entrenador y su Escuela
const GET_COACH_DATA = gql`
  query GetCoachData {
    meCoach {
      id
      # Necesitamos el ID de la escuela para pedir los ejercicios
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

// 2. Obtener Ejercicios (Requiere schoolId)
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
  const [sessionType, setSessionType] = useState<"TRAINING" | "MATCH">(
    "TRAINING",
  );

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
    },
  });

  const notifyValue = watch("notify");
  const selectedIds = watch("exerciseIds") || [];

  // --- QUERIES ---

  // Paso 1: Cargar perfil del coach y categorías
  const { data: coachData, loading: loadingCoach }: any =
    useQuery(GET_COACH_DATA);

  const categories: Category[] =
    coachData?.meCoach?.coachProfile?.categories || [];
  const schoolId = coachData?.meCoach?.schoolId;

  // Paso 2: Cargar ejercicios (Solo si tenemos schoolId)
  const { data: exercisesData, loading: loadingExercises }: any = useQuery(
    GET_EXERCISES,
    {
      variables: { schoolId },
      skip: !schoolId, // Evita el error si schoolId es undefined
      fetchPolicy: "cache-and-network",
    },
  );

  const allExercises: Exercise[] = exercisesData?.mySchoolExercises || [];

  // --- MUTATIONS ---
  const [createTraining, { loading: loadingTraining }] =
    useMutation(CREATE_SESSION);
  const [createMatch, { loading: loadingMatch }] = useMutation(CREATE_MATCH);

  const loading = loadingTraining || loadingMatch || loadingCoach;
  const themeBg = sessionType === "MATCH" ? "bg-[#312E81]" : "bg-[#10B981]";
  const themeBorder =
    sessionType === "MATCH" ? "focus:ring-[#312E81]" : "focus:ring-[#10B981]";

  // --- LOGICA ORDENAMIENTO ---
  const addExercise = (id: string) => {
    if (!selectedIds.includes(id))
      setValue("exerciseIds", [...selectedIds, id]);
  };

  const removeExercise = (id: string) => {
    setValue(
      "exerciseIds",
      selectedIds.filter((exId) => exId !== id),
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedIds];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setValue("exerciseIds", newOrder);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newOrder = [...selectedIds];
    [newOrder[index + 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index + 1],
    ];
    setValue("exerciseIds", newOrder);
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
              isHome: true, // Podrías agregar un toggle en UI para esto
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

  // Loading inicial crítico (Datos del usuario)
  if (loadingCoach) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  const availableExercises = allExercises.filter(
    (ex) => !selectedIds.includes(ex.id),
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
        {/* TABS TIPO */}
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
          {/* DATOS BÁSICOS */}
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

          {/* PLANIFICADOR (SOLO ENTRENAMIENTO) */}
          {sessionType === "TRAINING" && (
            <div className="space-y-4 animate-in fade-in">
              {/* Lista Seleccionada */}
              {selectedIds.length > 0 && (
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100">
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider ml-1 mb-3 block">
                    Orden del Entrenamiento ({selectedIds.length})
                  </label>
                  <div className="space-y-2">
                    {selectedIds.map((id, index) => {
                      const ex = allExercises.find((e) => e.id === id);
                      if (!ex) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100"
                        >
                          <div className="font-bold text-emerald-600 w-6 text-center text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">
                              {ex.title}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {ex.objective || "Sin objetivo"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg hover:bg-white text-emerald-700 disabled:opacity-30"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDown(index)}
                              disabled={index === selectedIds.length - 1}
                              className="p-1.5 rounded-lg hover:bg-white text-emerald-700 disabled:opacity-30"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <div className="w-px h-6 bg-emerald-200 mx-1"></div>
                            <button
                              type="button"
                              onClick={() => removeExercise(id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista Disponibles */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                    Biblioteca de Ejercicios
                  </label>
                  {loadingExercises && (
                    <Loader2 className="animate-spin w-4 h-4 text-emerald-500" />
                  )}
                </div>

                {!schoolId ? (
                  <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    No se pudo identificar tu escuela.
                  </div>
                ) : availableExercises.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {allExercises.length === 0
                      ? "No hay ejercicios creados en la biblioteca."
                      : "Has seleccionado todos los ejercicios."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {availableExercises.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => addExercise(ex.id)}
                        className="cursor-pointer rounded-xl p-3 border border-gray-100 hover:border-emerald-200 hover:bg-gray-50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-700">
                              {ex.title}
                            </h4>
                            <DifficultyBadge level={ex.difficulty} />
                          </div>
                          {ex.imageUrl && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-400">
                              <PlayCircle size={10} /> Multimedia
                            </div>
                          )}
                        </div>
                        <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlusCircle size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FECHA Y LUGAR */}
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

// Helper Badge
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
