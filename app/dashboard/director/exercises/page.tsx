"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Dumbbell,
  Plus,
  Search,
  PlayCircle,
  Image as ImageIcon,
  Trash2,
  X,
  Save,
  Loader2,
  Youtube,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me"; // Asumiendo que tienes este hook

// === GRAPHQL ALINEADO CON TU RESOLVER ===

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

const CREATE_EXERCISE = gql`
  mutation CreateExercise($schoolId: String!, $input: CreateExerciseInput!) {
    createExercise(schoolId: $schoolId, input: $input) {
      id
      title
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
  const { user, loading: userLoading } = useUser(); // Obtenemos el usuario y sus escuelas

  // Estado UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener la ID de la escuela activa (Asumimos la primera del array o la seleccionada)
  // Ajusta esta lógica según cómo gestiones la "escuela activa" en tu frontend
  const activeSchoolId = useMemo(() => {
    if (!user?.schools) return null;
    // Si es un array, tomamos el schoolId del primer elemento donde sea DIRECTOR
    const haveSchool = user.schools.length ? user.schools[0]?.school.id : null;
    return haveSchool;
  }, [user]);

  // === QUERIES & MUTATIONS ===

  // 1. Query: Ahora enviamos schoolId
  const { data, loading, refetch }: any = useQuery(GET_EXERCISES, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId, // No ejecutar si no hay ID
    fetchPolicy: "cache-and-network",
  });

  // 2. Mutation: Ahora enviamos schoolId + input
  const [createExercise, { loading: creating }] = useMutation(CREATE_EXERCISE);
  const [removeExercise] = useMutation(REMOVE_EXERCISE);

  const exercises = data?.mySchoolExercises || [];

  // Filtrado Frontend
  const filteredExercises = exercises.filter((ex: any) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.objective?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff =
      filterDifficulty === "ALL" || ex.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  // Formulario
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData: any) => {
    if (!activeSchoolId)
      return showAlert("No se identificó la escuela", "error");

    try {
      await createExercise({
        variables: {
          schoolId: activeSchoolId, // Argumento 1 del Resolver
          input: {
            // Argumento 2 del Resolver
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty || "BASIC",
            objective: formData.objective,
            videoUrl: formData.videoUrl,
            imageUrl: formData.imageUrl,
          },
        },
      });
      showAlert("Ejercicio añadido a la biblioteca", "success");
      setIsModalOpen(false);
      reset();
      refetch();
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al crear ejercicio", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este ejercicio?")) return;
    try {
      await removeExercise({ variables: { id } });
      showAlert("Ejercicio eliminado", "success");
      refetch();
    } catch (error) {
      showAlert("No se pudo eliminar", "error");
    }
  };

  // Loading inicial de usuario
  if (userLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#312E81]" />
      </div>
    );

  // Estado si no es Director o no tiene escuela
  if (!activeSchoolId)
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center p-6">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Acceso Restringido</h2>
        <p className="text-gray-500">
          No se encontró una escuela asociada a tu cuenta de Director.
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#312E81] tracking-tight">
            Metodología y Ejercicios
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona la biblioteca técnica. Estos ejercicios estarán disponibles
            para tus entrenadores.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#312E81] hover:bg-indigo-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Ejercicio
        </button>
      </div>

      {/* 2. FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre u objetivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-gray-700 font-medium"
          />
        </div>
        <div className="h-px md:h-auto w-full md:w-px bg-gray-200 mx-2"></div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 px-2 md:px-0">
          {["ALL", "BASIC", "INTERMEDIATE", "ADVANCED"].map((level) => (
            <button
              key={level}
              onClick={() => setFilterDifficulty(level)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap
                ${
                  filterDifficulty === level
                    ? "bg-indigo-50 text-[#312E81] ring-1 ring-[#312E81]"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              {level === "ALL"
                ? "Todos"
                : level === "BASIC"
                  ? "Básico"
                  : level === "INTERMEDIATE"
                    ? "Intermedio"
                    : "Avanzado"}
            </button>
          ))}
        </div>
      </div>

      {/* 3. GRID DE EJERCICIOS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map((ex: any) => (
            <div
              key={ex.id}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {/* Thumbnail / Header */}
              <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                {ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt={ex.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Dumbbell className="text-gray-300 w-16 h-16" />
                )}

                {/* Badge Dificultad */}
                <div className="absolute top-3 left-3">
                  <DifficultyBadge level={ex.difficulty} />
                </div>

                {/* Video Overlay */}
                {ex.videoUrl && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 p-2 rounded-full text-red-600 shadow-lg">
                      <Youtube size={24} fill="currentColor" />
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <button
                  onClick={() => handleDelete(ex.id)}
                  className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-lg text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2">
                    {ex.title}
                  </h3>
                  {ex.objective && (
                    <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md inline-block mb-3">
                      Obj: {ex.objective}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                {/* Footer Card */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    {ex.videoUrl ? (
                      <PlayCircle size={14} className="text-[#312E81]" />
                    ) : (
                      <ImageIcon size={14} />
                    )}
                    {ex.videoUrl ? "Video" : "Imagen"}
                  </div>
                  <span>ID: {ex.id.substring(0, 4)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
            <Dumbbell className="text-gray-400 w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">
            No hay ejercicios encontrados
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Añade ejercicios para que tus entrenadores puedan usarlos.
          </p>
        </div>
      )}

      {/* MODAL CREAR EJERCICIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Nuevo Ejercicio
                </h2>
                <p className="text-sm text-gray-500">
                  Agrega un recurso a la biblioteca
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 overflow-y-auto custom-scrollbar space-y-5"
            >
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nombre del Ejercicio
                  </label>
                  <input
                    {...register("title", { required: true })}
                    placeholder="Ej: Rondo 4vs2 con transición"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#312E81] outline-none text-sm font-medium"
                  />
                </div>

                {/* Dificultad & Objetivo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Dificultad
                    </label>
                    <select
                      {...register("difficulty")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#312E81] outline-none text-sm bg-white"
                    >
                      <option value="BASIC">Básico</option>
                      <option value="INTERMEDIATE">Intermedio</option>
                      <option value="ADVANCED">Avanzado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Objetivo Ppal.
                    </label>
                    <input
                      {...register("objective")}
                      placeholder="Ej: Pase corto"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#312E81] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Descripción / Reglas
                  </label>
                  <textarea
                    {...register("description", { required: true })}
                    rows={4}
                    placeholder="Describe cómo funciona el ejercicio, dimensiones del campo, reglas..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#312E81] outline-none text-sm resize-none"
                  />
                </div>

                {/* Media Links */}
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <p className="text-xs font-bold text-[#312E81] uppercase flex items-center gap-1">
                    <PlayCircle size={14} /> Multimedia (Opcional)
                  </p>
                  <div>
                    <input
                      {...register("videoUrl")}
                      placeholder="URL Video (YouTube/Vimeo)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-indigo-400 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      {...register("imageUrl")}
                      placeholder="URL Imagen / Diagrama"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-indigo-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#312E81] hover:bg-indigo-800 text-white py-4 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Guardar Ejercicio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente Badge para mantener limpio el código
function DifficultyBadge({ level }: { level: string }) {
  const styles = {
    BASIC: "bg-emerald-100 text-emerald-700 border-emerald-200",
    INTERMEDIATE: "bg-amber-100 text-amber-700 border-amber-200",
    ADVANCED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const labels = {
    BASIC: "Básico",
    INTERMEDIATE: "Intermedio",
    ADVANCED: "Avanzado",
  };

  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${styles[level as keyof typeof styles] || styles.BASIC}`}
    >
      {labels[level as keyof typeof labels] || "General"}
    </span>
  );
}
