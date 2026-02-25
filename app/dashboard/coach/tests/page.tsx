"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// ---------------------------------------------------------
// 1. QUERIES Y MUTATIONS (Alineadas al Nuevo Modelo)
// ---------------------------------------------------------

// Query para obtener los alumnos del profe
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

// NUEVA QUERY: Obtenemos los TestProtocols dinámicos desde el backend
export const GET_TEST_PROTOCOLS = gql`
  query GetTestProtocols {
    getAvailableTestProtocols {
      id
      name
      category
      unit
    }
  }
`;

// MUTACIÓN ACTUALIZADA: Ahora usa protocolId
export const CREATE_EVALUATION = gql`
  mutation CreateEvaluation($input: CreateEvaluationInput!) {
    createEvaluation(createEvaluationInput: $input) {
      id
      value
      protocol {
        name
        unit
      }
      player {
        firstName
      }
    }
  }
`;

// ---------------------------------------------------------
// 2. UTILIDADES Y MAPEOS
// ---------------------------------------------------------

// Diccionario para traducir los Enums de BD a etiquetas amigables
const UNIT_LABELS: Record<string, string> = {
  SECONDS: "seg",
  METERS: "m",
  CENTIMETERS: "cm",
  POINTS: "pts",
  PERCENTAGE: "%",
  COUNT: "reps/niveles",
};

// ---------------------------------------------------------
// 3. INTERFACES
// ---------------------------------------------------------
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

interface TestProtocol {
  id: string;
  name: string;
  category: string;
  unit: string;
}

// ---------------------------------------------------------
// 4. COMPONENTE PRINCIPAL DE LA PÁGINA
// ---------------------------------------------------------
export default function TestsPage() {
  // Obtenemos los alumnos
  const {
    data: coachData,
    loading: loadingCoach,
    error: errorCoach,
  }: any = useQuery(GET_COACH_DATA, {
    fetchPolicy: "network-only",
  });

  // Obtenemos las pruebas (protocolos)
  const {
    data: protocolData,
    loading: loadingProtocols,
    error: errorProtocols,
  }: any = useQuery(GET_TEST_PROTOCOLS, {
    fetchPolicy: "cache-first",
  });

  const categories = coachData?.meCoach?.coachProfile?.categories || [];
  const protocols: TestProtocol[] =
    protocolData?.getAvailableTestProtocols || [];

  const isLoading = loadingCoach || loadingProtocols;
  const hasError = errorCoach || errorProtocols;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* HEADER RESPONSIVO */}
      <div className="bg-[#312E81] text-white p-6 pt-8 rounded-b-[2rem] lg:rounded-b-none shadow-xl mb-6 lg:mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Centro de Evaluación
            </h1>
            <p className="text-indigo-200 text-sm lg:text-base mt-1 opacity-90">
              Registra el rendimiento físico y técnico del plantel.
            </p>
          </div>
          <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-full">
            📋
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
            <p className="text-gray-500 font-medium">Cargando módulos...</p>
          </div>
        )}

        {hasError && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md mx-auto mt-10">
            <span className="text-4xl mb-2 block">⚠️</span>
            <p className="text-red-700 font-bold text-lg mb-1">
              Error de conexión
            </p>
            <p className="text-sm text-red-500">
              No pudimos cargar la información. Intenta recargar la página.
            </p>
          </div>
        )}

        {!isLoading && !hasError && (
          <>
            {categories.length > 0 && protocols.length > 0 ? (
              <EvaluationForm categories={categories} protocols={protocols} />
            ) : (
              <div className="bg-white p-10 rounded-3xl text-center shadow-sm max-w-md mx-auto border border-gray-100">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="font-bold text-gray-800 text-xl">
                  Información incompleta
                </h3>
                <p className="text-gray-500 mt-2">
                  No tienes categorías asignadas o no hay pruebas configuradas
                  en el sistema.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 5. COMPONENTE DEL FORMULARIO
// ---------------------------------------------------------
function EvaluationForm({
  categories,
  protocols,
}: {
  categories: Category[];
  protocols: TestProtocol[];
}) {
  const { showAlert } = useAlert();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id || "",
  );
  const [selectedTest, setSelectedTest] = useState<TestProtocol>(protocols[0]); // Seleccionamos el primero por defecto

  const { register, handleSubmit, setValue, watch, resetField } = useForm();
  const [createEvaluation, { loading }] = useMutation(CREATE_EVALUATION);

  const watchedPlayerId = watch("playerId");
  const currentPlayers =
    categories.find((c) => c.id === selectedCategory)?.players || [];

  useEffect(() => {
    setValue("playerId", "");
  }, [selectedCategory, setValue]);

  const onSubmit = async (data: any) => {
    if (!data.playerId) {
      showAlert("Por favor, selecciona a un jugador de la lista.", "warning");
      return;
    }
    if (!data.value || isNaN(data.value)) {
      showAlert("Debes ingresar un valor numérico válido.", "warning");
      return;
    }

    try {
      await createEvaluation({
        variables: {
          input: {
            protocolId: selectedTest.id, // ✅ Solo enviamos el ID del Protocolo
            value: parseFloat(data.value),
            playerId: data.playerId,
            // notes: "", // Opcional si lo agregas en un futuro input
          },
        },
      });

      showAlert(`Evaluación guardada exitosamente`, "success");
      resetField("value");
    } catch (error) {
      showAlert("Hubo un error al guardar la evaluación.", "error");
      console.error(error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
    >
      {/* =========================================
          COLUMNA IZQUIERDA: EQUIPO Y JUGADORES
      ========================================= */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            1. Equipo a Evaluar
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#312E81] text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            2. Seleccionar Jugador
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {currentPlayers.map((p) => {
              const isSelected = watchedPlayerId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setValue("playerId", p.id)}
                  className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 select-none ${
                    isSelected
                      ? "border-[#10B981] bg-green-50 shadow-sm transform scale-95"
                      : "border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200"
                  }`}
                >
                  <img
                    src={
                      p.photoUrl ||
                      `https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=E5E7EB&color=374151`
                    }
                    alt={p.firstName}
                    className={`w-14 h-14 rounded-full mb-2 object-cover ${isSelected ? "ring-2 ring-offset-2 ring-[#10B981]" : ""}`}
                  />
                  <span
                    className={`text-xs text-center line-clamp-1 ${isSelected ? "font-bold text-[#10B981]" : "font-medium text-gray-600"}`}
                  >
                    {p.firstName} {p.lastName.charAt(0)}.
                  </span>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white shadow-sm">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("playerId", { required: true })} />
        </div>
      </div>

      {/* =========================================
          COLUMNA DERECHA: PRUEBAS Y RESULTADOS
      ========================================= */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            3. Prueba a Evaluar
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {protocols.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => setSelectedTest(test)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedTest.id === test.id
                    ? "border-[#312E81] bg-indigo-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div
                  className={`font-bold text-sm lg:text-base ${selectedTest.id === test.id ? "text-[#312E81]" : "text-gray-700"}`}
                >
                  {test.name}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${selectedTest.id === test.id ? "bg-[#312E81]/10 text-[#312E81]" : "bg-gray-100 text-gray-500"}`}
                  >
                    {test.category}
                  </span>
                  <span
                    className={`text-xs font-semibold ${selectedTest.id === test.id ? "text-[#312E81]" : "text-gray-400"}`}
                  >
                    {UNIT_LABELS[test.unit] || test.unit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 lg:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">
            4. Resultado Obtenido
          </label>

          <div className="bg-gray-50 p-6 lg:p-10 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 w-full max-w-sm relative group focus-within:border-[#10B981] focus-within:bg-green-50/30 transition-colors">
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("value", { required: true })}
                className="bg-transparent text-6xl lg:text-7xl font-black text-[#312E81] text-center w-48 placeholder-gray-200 focus:outline-none"
                autoComplete="off"
              />
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-400 uppercase tracking-widest mt-2">
              {UNIT_LABELS[selectedTest.unit] || selectedTest.unit}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-sm mt-8 bg-[#10B981] hover:bg-[#059669] text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  ></path>
                </svg>
                <span>Guardar Evaluación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
