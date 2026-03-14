"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ArrowLeft,
  Save,
  Loader2,
  PlayCircle,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// NOTA DEV: Idealmente tendrías un GET_EXERCISE_BY_ID para pre-llenar en modo edición.
// Aquí simulo la arquitectura para ambas acciones.
const CREATE_EXERCISE = gql`
  mutation CreateExercise($schoolId: String!, $input: CreateExerciseInput!) {
    createExercise(schoolId: $schoolId, input: $input) {
      id
    }
  }
`;

const UPDATE_EXERCISE = gql`
  mutation UpdateExercise($id: String!, $input: CreateExerciseInput!) {
    updateExercise(id: $id, input: $input) {
      id
    }
  }
`;

const GET_EXERCISE_BY_ID = gql`
  query exerciseFindById($exerciseId: String!) {
    exerciseFindById(exerciseId: $exerciseId) {
      id
      title
      description
      difficulty
      objective
      videoUrl
      imageUrl
    }
  }
`;

const ExerciseEditorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get("id"); // Detecta si es modo Edición

  const { showAlert } = useAlert();
  const { user } = useUser();
  const activeSchoolId = user?.schools?.length
    ? user.schools[0]?.school?.id || user.schools[0]?.id
    : null;

  const { data: formData, loading: loadingData }: any = useQuery(
    GET_EXERCISE_BY_ID,
    {
      variables: { exerciseId: exerciseId },
      skip: !exerciseId,
    },
  );

  const exercise = formData?.exerciseFindById;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      objective: "",
      difficulty: "BASIC",
      description: "",
      imageUrl: "",
      videoUrl: "",
    },
  });

  useEffect(() => {
    if (exercise) {
      reset({
        title: exercise.title || "",
        objective: exercise.objective || "",
        difficulty: exercise.difficulty || "BASIC",
        description: exercise.description || "",
        imageUrl: exercise.imageUrl || "",
        videoUrl: exercise.videoUrl || "",
      });
    }
  }, [exercise, reset]);

  console.log({ exercise });

  // Observamos la URL de la imagen para la previsualización en vivo
  const watchImageUrl = watch("imageUrl");

  const [createExercise, { loading: isCreating }] =
    useMutation(CREATE_EXERCISE);
  const [updateExercise, { loading: isUpdating }] =
    useMutation(UPDATE_EXERCISE);
  const isProcessing = isCreating || isUpdating;

  const onSubmit = async (formData: any) => {
    if (!activeSchoolId)
      return showAlert("Error de contexto: Escuela no identificada", "error");

    try {
      if (exerciseId) {
        // Modo Edición
        await updateExercise({
          variables: { id: exerciseId, input: formData },
        });
        showAlert("Ejercicio actualizado", "success");
      } else {
        // Modo Creación
        await createExercise({
          variables: { schoolId: activeSchoolId, input: formData },
        });
        showAlert("Ejercicio añadido a la biblioteca", "success");
      }

      router.push("/dashboard/director/exercises");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al procesar el ejercicio", "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Botón Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard/director/exercises"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#312E81] transition-colors"
        >
          <ArrowLeft size={16} /> Volver a la Biblioteca
        </Link>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header del Formulario */}
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {exerciseId ? "Editar Ejercicio" : "Constructor de Ejercicio"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {exerciseId
                ? "Modifica los detalles técnicos."
                : "Sube un nuevo recurso metodológico para tu cuerpo técnico."}
            </p>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full md:w-auto px-6 py-3 bg-[#312E81] text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-[#282566] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {exerciseId ? "Guardar Cambios" : "Publicar Ejercicio"}
          </button>
        </div>

        {/* Cuerpo del Formulario (2 Columnas) */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* COLUMNA IZQUIERDA: Info Táctica (Ocupa 3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Nombre del Ejercicio <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", { required: true })}
                autoFocus
                className="w-full text-2xl font-black text-slate-900 placeholder-slate-300 outline-none bg-transparent border-b-2 border-transparent focus:border-[#312E81] transition-colors pb-2"
                placeholder="Ej: Rondo 4vs2 con transición rápida"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Nivel de Dificultad
                </label>
                <select
                  {...register("difficulty")}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all font-bold appearance-none cursor-pointer"
                >
                  <option value="BASIC">🟢 Básico (Formativo)</option>
                  <option value="INTERMEDIATE">
                    🟡 Intermedio (Competitivo)
                  </option>
                  <option value="ADVANCED">🔴 Avanzado (Élite)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Objetivo Principal
                </label>
                <input
                  {...register("objective")}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all font-bold"
                  placeholder="Ej: Posesión bajo presión"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Desarrollo y Reglas <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("description", { required: true })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all font-medium min-h-[200px] resize-y leading-relaxed"
                placeholder="Describe dimensiones de la cancha, cantidad de toques permitidos, variantes y puntuación..."
              />
            </div>
          </div>

          {/* COLUMNA DERECHA: Recursos Multimedia (Ocupa 2/5) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-6">
              <h3 className="text-sm font-black text-[#312E81] uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-3">
                <ImageIcon size={16} /> Esquema Visual
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">
                  URL de la Imagen / Diagrama
                </label>
                <input
                  {...register("imageUrl")}
                  className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all text-sm font-medium"
                  placeholder="https://ejemplo.com/cancha.jpg"
                />
              </div>

              {/* Live Preview de Imagen */}
              <div className="aspect-video bg-white border border-indigo-100 rounded-xl overflow-hidden flex items-center justify-center shadow-sm relative">
                {watchImageUrl ? (
                  <img
                    src={watchImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="text-center text-indigo-200">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-bold">Sin Imagen</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-3">
                <PlayCircle size={16} /> Referencia en Video
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">
                  URL de YouTube / Vimeo
                </label>
                <input
                  {...register("videoUrl")}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all text-sm font-medium"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                  * Opcional. Útil para mostrar la ejecución real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ExerciseEditorPage />
    </Suspense>
  );
}
