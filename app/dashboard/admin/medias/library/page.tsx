"use client";

import React from "react";
import { gql } from "@apollo/client";
import {
  LibraryBig,
  UploadCloud,
  ClipboardList,
  Dumbbell,
  HeartHandshake,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_LIBRARY_CONTENT = gql`
  query GetLibraryContent {
    adminExercises {
      id
      title
      description
      difficulty
      isGlobal
      createdAt
    }
    adminStrategies {
      id
      title
      description
      createdAt
    }
    adminBoards {
      id
      title
      tags
      createdAt
    }
  }
`;

const DELETE_EXERCISE = gql`
  mutation AdminDeleteExercise($id: String!) {
    adminDeleteExercise(id: $id)
  }
`;

// ==========================================
// 2. TIPOS DE DATOS
// ==========================================
interface Exercise {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  isGlobal: boolean;
}

interface Strategy {
  id: string;
  title: string;
  description?: string;
}

interface Board {
  id: string;
  title: string;
  tags: string[];
}

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function LibraryPage() {
  const { data, loading, error, refetch }: any = useQuery(GET_LIBRARY_CONTENT, {
    fetchPolicy: "cache-and-network",
  });

  const [deleteExercise] = useMutation(DELETE_EXERCISE, {
    onCompleted: () => {
      alert("Contenido eliminado de la red global.");
      refetch();
    },
    onError: (err: any) => alert("Error al eliminar: " + err.message),
  });

  const handleDeleteExercise = (id: string, title: string) => {
    if (
      window.confirm(
        `¿Estás seguro de eliminar el ejercicio "${title}" de la red global?`,
      )
    ) {
      deleteExercise({ variables: { id } });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Cargando motor de contenidos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-slate-50 flex-1">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-lg">Error de conexión CMS</h3>
            <p className="text-sm font-medium mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const exercises: Exercise[] = data?.adminExercises || [];
  const strategies: Strategy[] = data?.adminStrategies || [];
  const boards: Board[] = data?.adminBoards || [];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LibraryBig className="text-indigo-600" /> Motor de Contenidos
            Central
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Distribuye conocimiento a toda la red de La Novena al instante.
          </p>
        </div>
        <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition">
          <UploadCloud size={18} strokeWidth={3} /> Subir Material a la Red
        </button>
      </div>

      {/* CMS COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: ENTRENADORES (Boards/Pizarras) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-t-8 border-t-emerald-500 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <ClipboardList size={28} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg tracking-tight leading-tight">
                Cancha & Metodología
              </h4>
              <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mt-1">
                Se muestra en: App Entrenadores
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Sube animaciones de pizarra táctica y documentos. Los profes los
            usarán para armar sus sesiones diarias en cancha.
          </p>

          <div className="space-y-3 flex-1">
            {boards.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay pizarras cargadas.
              </p>
            )}
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-emerald-300 cursor-pointer transition-colors group"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {board.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {board.tags.length > 0
                      ? board.tags.join(" • ")
                      : "Pizarra Animada"}
                  </p>
                </div>
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 opacity-70 group-hover:opacity-100">
                  <CheckCircle2 size={14} /> Global
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: JUGADORES (Exercises/Rutinas) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-t-8 border-t-blue-500 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Dumbbell size={28} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg tracking-tight leading-tight">
                Player Academy
              </h4>
              <p className="text-[9px] text-blue-600 uppercase font-black tracking-widest mt-1">
                Se muestra en: App Jugadores
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Sube rutinas físicas, nutrición y tips de desarrollo exclusivo
            directo al celular de los deportistas.
          </p>

          <div className="space-y-3 flex-1">
            {exercises.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay ejercicios cargados.
              </p>
            )}
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-blue-300 transition-colors group"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {exercise.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">
                    Dif: {exercise.difficulty}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {exercise.isGlobal && (
                    <span
                      className="text-blue-600 font-bold text-xs flex items-center gap-1 opacity-70 group-hover:opacity-100"
                      title="Activo para toda la red"
                    >
                      <CheckCircle2 size={14} />
                    </span>
                  )}
                  <button
                    onClick={() =>
                      handleDeleteExercise(exercise.id, exercise.title)
                    }
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Eliminar contenido"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 3: APODERADOS (Strategies/Psicología) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-t-8 border-t-purple-500 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
              <HeartHandshake size={28} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg tracking-tight leading-tight">
                Escuela para Padres
              </h4>
              <p className="text-[9px] text-purple-600 uppercase font-black tracking-widest mt-1">
                Se muestra en: App Apoderados
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Sube material de psicología deportiva, estrategias, nutrición y
            acompañamiento sano para las familias.
          </p>

          <div className="space-y-3 flex-1">
            {strategies.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay estrategias cargadas.
              </p>
            )}
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-purple-300 cursor-pointer transition-colors group"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {strategy.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {strategy.description || "Documento Estratégico"}
                  </p>
                </div>
                <span className="text-purple-600 font-bold text-xs flex items-center gap-1 opacity-70 group-hover:opacity-100">
                  <CheckCircle2 size={14} /> Global
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
