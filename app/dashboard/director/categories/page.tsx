"use client";

import React, { useState, useMemo } from "react";
import {
  Loader2,
  Users,
  Trophy,
  Info,
  CheckCircle2,
  AlertCircle,
  Star,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// === GRAPHQL OPERATIONS ===
export const GET_CATEGORIES = gql`
  query GetCategories($schoolId: String!) {
    categories(schoolId: $schoolId) {
      id
      name
      type
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
    }
  }
`;

export const REMOVE_CATEGORY = gql`
  mutation RemoveCategory($id: String!) {
    removeCategory(id: $id) {
      id
    }
  }
`;

// === DATA ESTÁTICA ===
const STANDARD_CATEGORIES = [
  {
    name: "Sub-5",
    label: "Sub 5",
    description: "4 a 5 años (Promoción)",
    icon: Star,
    type: "FORMATIVA",
  },
  {
    name: "Sub-6",
    label: "Sub 6",
    description: "5 a 6 años (Iniciación)",
    icon: Star,
    type: "FORMATIVA",
  },
  {
    name: "Sub-8",
    label: "Sub 8",
    description: "7 a 8 años (Formativa)",
    icon: Users,
    type: "FORMATIVA",
  },
  {
    name: "Sub-10",
    label: "Sub 10",
    description: "9 a 10 años (Formativa)",
    icon: Users,
    type: "FORMATIVA",
  },
  {
    name: "Sub-12",
    label: "Sub 12",
    description: "11 a 12 años (Selectiva)",
    icon: Trophy,
    type: "SELECTIVA",
  },
  {
    name: "Sub-14",
    label: "Sub 14",
    description: "13 a 14 años (Selectiva)",
    icon: Trophy,
    type: "SELECTIVA",
  },
  {
    name: "Sub-16",
    label: "Sub 16",
    description: "15 a 16 años (Selectiva)",
    icon: Trophy,
    type: "SELECTIVA",
  },
  {
    name: "Sub-18",
    label: "Sub 18",
    description: "17 a 18 años (Juvenil)",
    icon: Trophy,
    type: "SELECTIVA",
  },
  {
    name: "Proyeccion",
    label: "Proyección",
    description: "19+ años (Adulto)",
    icon: Trophy,
    type: "ADULT",
  },
  {
    name: "Femenina",
    label: "Rama Femenina",
    description: "Todo competidor",
    icon: Users,
    type: "SPECIAL",
  },
];

export default function ManageCategoriesPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Obtenemos el ID de la escuela activa (Fallback al primero disponible para la UI local)
  const activeSchoolId = useMemo(() => {
    if (!user?.schools) return null;
    return user.schools.length
      ? user.schools[0]?.school?.id || user.schools[0]?.id
      : null;
  }, [user]);

  // --- APOLLO HOOKS ---
  const {
    data,
    loading: catsLoading,
    refetch,
  }: any = useQuery(GET_CATEGORIES, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
    fetchPolicy: "cache-and-network",
  });

  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [removeCategory] = useMutation(REMOVE_CATEGORY);

  const activeCategories = data?.categories || [];

  // --- HANDLERS ---
  const handleToggle = async (catConfig: (typeof STANDARD_CATEGORIES)[0]) => {
    if (!activeSchoolId)
      return showAlert("Error: Escuela no identificada", "error");

    setProcessingId(catConfig.name);
    const existing = activeCategories.find(
      (c: any) => c.name === catConfig.name,
    );

    try {
      if (existing) {
        await removeCategory({ variables: { id: existing.id } });
      } else {
        await createCategory({
          variables: {
            input: {
              name: catConfig.name,
              type: catConfig.type,
              schoolId: activeSchoolId,
            },
          },
        });
      }
      await refetch();
    } catch (err: any) {
      console.error(err);
      showAlert(
        err.message || "Ocurrió un error al actualizar la categoría",
        "error",
      );
    } finally {
      setProcessingId(null);
    }
  };

  // --- RENDERERS ---
  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* GRID DE CATEGORÍAS */}
      {catsLoading && !activeCategories.length ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {STANDARD_CATEGORIES.map((cat) => {
            const isActive = activeCategories.some(
              (c: any) => c.name === cat.name,
            );
            const isLoading = processingId === cat.name;
            const Icon = cat.icon;

            return (
              <button
                key={cat.name}
                onClick={() => !isLoading && handleToggle(cat)}
                disabled={isLoading}
                role="switch"
                aria-checked={isActive}
                className={`
                  group relative flex flex-col items-start p-6 rounded-3xl border-2 transition-all duration-300 text-left w-full outline-none focus-visible:ring-4 focus-visible:ring-[#312E81]/20
                  ${
                    isActive
                      ? "bg-[#10B981]/5 border-[#10B981] shadow-lg shadow-emerald-900/5 hover:bg-[#10B981]/10"
                      : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5"
                  }
                  ${isLoading ? "opacity-70 cursor-not-allowed scale-[0.98]" : "cursor-pointer active:scale-[0.98]"}
                `}
              >
                {/* Switch Visual Superior */}
                <div className="w-full flex justify-between items-center mb-6">
                  <div
                    className={`
                    w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner
                    ${isActive ? "bg-[#10B981]" : "bg-slate-200 group-hover:bg-slate-300"}
                  `}
                  >
                    <div
                      className={`
                      bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center
                      ${isActive ? "translate-x-6" : "translate-x-0"}
                    `}
                    >
                      {isLoading && (
                        <Loader2
                          size={12}
                          className="animate-spin text-slate-400"
                        />
                      )}
                    </div>
                  </div>

                  {/* Icono de Tipo de Serie */}
                  <div
                    className={`
                    p-2.5 rounded-xl transition-colors duration-300
                    ${isActive ? "bg-emerald-100 text-[#10B981]" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-[#312E81]"}
                  `}
                  >
                    <Icon size={22} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Contenido (Nombre y Descripción) */}
                <div className="mt-auto">
                  <h3
                    className={`text-2xl font-black tracking-tight mb-1 transition-colors duration-300 ${isActive ? "text-slate-900" : "text-slate-700 group-hover:text-[#312E81]"}`}
                  >
                    {cat.label}
                  </h3>
                  <p
                    className={`text-sm font-medium transition-colors duration-300 ${isActive ? "text-[#10B981]" : "text-slate-500"}`}
                  >
                    {cat.description}
                  </p>
                </div>

                {/* Pulso Decorativo si está activo */}
                {isActive && !isLoading && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* FOOTER INFORMATIVO (Aislado y limpio) */}
      <div className="mt-12 bg-[#312E81] rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl shrink-0 text-[#10B981] relative z-10 border border-white/10">
          <Info size={32} />
        </div>

        <div className="relative z-10">
          <h4 className="font-black text-white text-xl mb-2">
            Automatización de la Escuela
          </h4>
          <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-3xl font-medium">
            Al activar una categoría, La Novena genera instantáneamente el
            entorno digital para ese grupo. Se habilitan los módulos de
            <strong className="text-white">
              {" "}
              asistencia móvil para el profesor, citaciones a partidos y control
              de pagos
            </strong>{" "}
            para los apoderados correspondientes.
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-900">
            <span className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <CheckCircle2 size={16} className="text-[#10B981]" /> Cambios en
              tiempo real
            </span>
            <span className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <AlertCircle size={16} className="text-amber-500" /> Historial
              seguro
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES UI ---
function LoadingSpinner() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="h-44 bg-white border border-slate-100 rounded-3xl animate-pulse shadow-sm"
        />
      ))}
    </div>
  );
}
