"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// QUERY: Traer jugadores agrupados por categorías del entrenador
export const GET_COACH_DATA = gql`
  query GetCoachData {
    meCoach {
      id
      coachProfile {
        categories {
          id
          name
          players {
            id
            firstName
            lastName
            photoUrl
          }
        }
      }
    }
  }
`;

// MUTATION: Guardar la evaluación
export const CREATE_EVALUATION = gql`
  mutation CreateEvaluation($input: CreateEvaluationInput!) {
    createEvaluation(createEvaluationInput: $input) {
      id
      value
      unit
      player {
        firstName
      }
    }
  }
`;

// Tipos simulados
type TestType = "VELOCIDAD_30M" | "SALTO_Largo" | "YOYO_TEST";

// Recomendación: usar librería 'sonner' o 'react-hot-toast' para feedback

// Tipos de Tests predefinidos (Configurables)
const TEST_TYPES = [
  { id: "SPEED_30M", label: "Velocidad 30m", unit: "seg" },
  { id: "JUMP_CMJ", label: "Salto (CMJ)", unit: "cm" },
  { id: "STRENGTH_SQUAT", label: "Sentadilla 1RM", unit: "kg" },
  { id: "ENDURANCE_YOYO", label: "Yo-Yo Test", unit: "nivel" },
];

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  players: Player[];
}

export function EvaluationForm({ categories }: { categories: Category[] }) {
  const { showAlert } = useAlert();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id || "",
  );
  const [selectedTest, setSelectedTest] = useState(TEST_TYPES[0]);

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const [createEvaluation, { loading }] = useMutation(CREATE_EVALUATION);

  // Filtrar jugadores según categoría seleccionada
  const currentPlayers =
    categories.find((c) => c.id === selectedCategory)?.players || [];

  const onSubmit = async (data: any) => {
    if (!data.playerId) {
      showAlert("Selecciona un jugador", "warning");
      return;
    }

    try {
      await createEvaluation({
        variables: {
          input: {
            type: selectedTest.id,
            value: parseFloat(data.value),
            unit: selectedTest.unit,
            playerId: data.playerId,
          },
        },
      });

      showAlert(`Evaluación guardada para el jugador`, "success");
      // Resetear solo el valor, mantener jugador y test para agilidad
      setValue("value", "");
      // Opcional: reset({ ...data, value: "" });
    } catch (error) {
      showAlert("Error al guardar la evaluación", "error");
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. SELECCIÓN DE GRUPO (Categoría) */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Categoría
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setValue("playerId", "");
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[#312E81] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. SELECCIÓN DE JUGADOR */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Jugador
          </label>
          <select
            {...register("playerId", { required: true })}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-[#10B981] outline-none"
          >
            <option value="">-- Seleccionar Alumno --</option>
            {currentPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* 3. TIPO DE TEST (Grid de botones) */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Prueba
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TEST_TYPES.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => setSelectedTest(test)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedTest.id === test.id
                    ? "border-[#10B981] bg-green-50 text-[#312E81]"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                <div className="font-bold text-sm">{test.label}</div>
                <div className="text-xs opacity-70">Unidad: {test.unit}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. INPUT DE RESULTADO (Gigante) */}
        <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
          <label className="text-sm font-medium text-gray-500 mb-2">
            Resultado Final
          </label>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("value", { required: true })}
              className="bg-transparent text-5xl font-black text-[#312E81] text-center w-40 placeholder-gray-200 focus:outline-none"
              autoComplete="off"
            />
            <span className="text-xl font-bold text-gray-400">
              {selectedTest.unit}
            </span>
          </div>
        </div>

        {/* BOTÓN DE GUARDAR */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
        >
          {loading ? (
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <span>💾 Guardar Registro</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// src/app/dashboard/coach/tests/page.tsx

// Función auxiliar para fetch (ajustar según tu configuración de Apollo/Fetch)

export default function TestsPage() {
  // 1. Hook de Apollo Client
  const { data, loading, error }: any = useQuery(GET_COACH_DATA, {
    fetchPolicy: "network-only", // Para asegurar datos frescos al evaluar
  });

  // 2. Extracción segura de datos
  const categories = data?.meCoach?.coachProfile?.categories || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Fijo / Title */}
      <div className="bg-[#312E81] text-white p-6 pt-8 rounded-b-[2rem] shadow-xl mb-6">
        <h1 className="text-2xl font-bold">Evaluaciones</h1>
        <p className="text-indigo-200 text-sm mt-1 opacity-80">
          Registra el rendimiento físico y técnico.
        </p>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* 3. Manejo de Estados de Carga y Error */}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
            <p className="text-gray-400 text-sm font-medium">
              Cargando plantel...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
            <p className="text-red-600 font-bold mb-1">Error de conexión</p>
            <p className="text-sm text-red-400">
              No pudimos cargar tus categorías.
            </p>
          </div>
        )}

        {/* 4. Renderizado de Contenido */}
        {!loading && !error && (
          <>
            {categories.length > 0 ? (
              <EvaluationForm categories={categories} />
            ) : (
              <div className="bg-white p-6 rounded-xl text-center shadow-sm">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-bold text-gray-800">
                  Sin categorías asignadas
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  No tienes equipos asignados en tu perfil de entrenador para
                  realizar evaluaciones.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
