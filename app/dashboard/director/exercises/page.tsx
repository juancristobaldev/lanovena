"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Link from "next/link";
import {
  Dumbbell,
  Search,
  PlayCircle,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Loader2,
  Youtube,
} from "lucide-react";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// --- GRAPHQL ---
const GET_EXERCISES = gql`
  query GetMySchoolExercises($schoolId: String!) {
    mySchoolExercises(schoolId: $schoolId) {
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

const REMOVE_EXERCISE = gql`
  mutation RemoveExercise($id: String!) {
    removeExercise(id: $id)
  }
`;

export default function DirectorExercisesPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();

  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Obtenemos el ID de la escuela activa (Fallback al primero disponible)
  const activeSchoolId = useMemo(() => {
    if (!user?.schools) return null;
    return user.schools.length
      ? user.schools[0]?.school?.id || user.schools[0]?.id
      : null;
  }, [user]);

  const { data, loading, refetch }: any = useQuery(GET_EXERCISES, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
    fetchPolicy: "cache-and-network",
  });

  const [removeExercise] = useMutation(REMOVE_EXERCISE);
  const exercises = data?.mySchoolExercises || [];

  // Filtrado Frontend
  const filteredExercises = exercises.filter((ex: any) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.objective &&
        ex.objective.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff =
      filterDifficulty === "ALL" || ex.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  const handleDelete = async (id: string) => {
    // TODO: Cambiar por Modal UI
    if (
      !window.confirm(
        "¿Estás seguro de eliminar este ejercicio permanentemente?",
      )
    )
      return;
    try {
      await removeExercise({ variables: { id } });
      showAlert("Ejercicio eliminado exitosamente", "success");
      refetch();
    } catch (error) {
      showAlert("No se pudo eliminar el ejercicio", "error");
    }
  };

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o enfoque táctico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-transparent outline-none text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-[#312E81]/20 rounded-xl transition-all"
          />
        </div>

        <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 px-2 md:px-0 hide-scrollbar shrink-0">
          {[
            { id: "ALL", label: "Todos" },
            { id: "BASIC", label: "Básico" },
            { id: "INTERMEDIATE", label: "Intermedio" },
            { id: "ADVANCED", label: "Avanzado" },
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => setFilterDifficulty(level.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#312E81]/40
                ${
                  filterDifficulty === level.id
                    ? "bg-indigo-50 text-[#312E81] ring-1 ring-[#312E81]/30 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map((ex: any) => (
            <article
              key={ex.id}
              className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Thumbnail / Header Multimedia */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                {ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt={ex.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <Dumbbell
                    className="text-slate-300 w-12 h-12"
                    strokeWidth={1.5}
                  />
                )}

                {/* Badge Dificultad (Flotante) */}
                <div className="absolute top-3 left-3">
                  <DifficultyBadge level={ex.difficulty} />
                </div>

                {/* Video Overlay Indicator */}
                {ex.videoUrl && (
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm p-2.5 rounded-full text-red-600 shadow-lg transform group-hover:scale-110 transition-transform">
                      <Youtube size={24} fill="currentColor" strokeWidth={0} />
                    </div>
                  </div>
                )}
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-lg leading-snug mb-2 line-clamp-2 group-hover:text-[#312E81] transition-colors">
                    {ex.title}
                  </h3>

                  {ex.objective && (
                    <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#10B981] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md mb-3">
                      Enfoque: {ex.objective}
                    </span>
                  )}

                  <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed font-medium">
                    {ex.description}
                  </p>
                </div>

                {/* Footer Tarjeta: Metadatos y Acciones */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {ex.videoUrl ? (
                      <>
                        <PlayCircle size={14} className="text-[#312E81]" />{" "}
                        Video
                      </>
                    ) : (
                      <>
                        <ImageIcon size={14} /> Esquema
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 -mr-2">
                    <Link
                      href={`/dashboard/director/exercises/create?id=${ex.id}`}
                      className="p-2 text-slate-400 hover:text-[#312E81] hover:bg-indigo-50 rounded-lg transition-all"
                      title="Editar Ejercicio"
                    >
                      <Pencil size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar Ejercicio"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// --- SUBCOMPONENTES UI ---
function DifficultyBadge({ level }: { level: string }) {
  const config = {
    BASIC: { bg: "bg-emerald-500/90", text: "text-white", label: "Básico" },
    INTERMEDIATE: {
      bg: "bg-amber-500/90",
      text: "text-white",
      label: "Intermedio",
    },
    ADVANCED: { bg: "bg-rose-500/90", text: "text-white", label: "Avanzado" },
  };
  const style = config[level as keyof typeof config] || config.BASIC;

  return (
    <span
      className={`backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-80 bg-white border border-slate-100 shadow-sm rounded-3xl animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
      <div className="bg-slate-50 p-6 rounded-full inline-block shadow-inner mb-4">
        <Dumbbell className="text-slate-300 w-12 h-12" />
      </div>
      <h3 className="text-xl font-black text-slate-900">Biblioteca Vacía</h3>
      <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm">
        Sube ejercicios, tácticas y metodologías para estandarizar el
        entrenamiento en toda tu escuela.
      </p>
    </div>
  );
}
