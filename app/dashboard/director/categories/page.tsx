"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  School,
  ChevronDown,
  Users,
  Trophy,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert"; // Tu proveedor de alertas
import { useUser } from "@/src/providers/me"; // Tu hook de usuario

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
    icon: Users,
  },
  {
    name: "Sub-6",
    label: "Sub 6",
    description: "5 a 6 años (Iniciación)",
    icon: Users,
  },
  {
    name: "Sub-8",
    label: "Sub 8",
    description: "7 a 8 años (Formativa)",
    icon: Users,
  },
  {
    name: "Sub-10",
    label: "Sub 10",
    description: "9 a 10 años (Formativa)",
    icon: Users,
  },
  {
    name: "Sub-12",
    label: "Sub 12",
    description: "11 a 12 años (Competitiva)",
    icon: Trophy,
  },
  {
    name: "Sub-14",
    label: "Sub 14",
    description: "13 a 14 años (Competitiva)",
    icon: Trophy,
  },
  {
    name: "Sub-16",
    label: "Sub 16",
    description: "15 a 16 años (Competitiva)",
    icon: Trophy,
  },
  {
    name: "Sub-18",
    label: "Sub 18",
    description: "17 a 18 años (Juvenil)",
    icon: Trophy,
  },
  {
    name: "Proyeccion",
    label: "Proyección",
    description: "19+ años (Adulto)",
    icon: Trophy,
  },
  {
    name: "Femenina",
    label: "Rama Femenina",
    description: "Todo competidor",
    icon: Users,
  },
];

export default function ManageCategoriesPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null); // Para loading local

  // --- 1. LÓGICA DE ESCUELAS ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // Manejo robusto de array vs objeto único
    const schools = user.schools || (user.school ? [user.school] : []);
    // Aplanar estructura si viene anidada (ej: user.schools[{ school: {...} }])
    return schools.map((s: any) => s.school || s);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- 2. APOLLO HOOKS ---
  const {
    data,
    loading: catsLoading,
    refetch,
  }: any = useQuery(GET_CATEGORIES, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    notifyOnNetworkStatusChange: true,
  });

  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [removeCategory] = useMutation(REMOVE_CATEGORY);

  const activeCategories = data?.categories || [];

  // --- 3. HANDLERS ---
  const handleToggle = async (catConfig: (typeof STANDARD_CATEGORIES)[0]) => {
    if (!selectedSchoolId) return showAlert("Selecciona una escuela", "error");

    setProcessingId(catConfig.name); // Activar loading en la tarjeta específica

    const existing = activeCategories.find(
      (c: any) => c.name === catConfig.name,
    );

    try {
      if (existing) {
        // Desactivar
        await removeCategory({ variables: { id: existing.id } });
        // showAlert(`Categoría ${catConfig.label} desactivada`, "default");
      } else {
        // Activar
        await createCategory({
          variables: {
            input: {
              name: catConfig.name,
              type: "FORMATIVA",
              schoolId: selectedSchoolId,
            },
          },
        });
        // showAlert(`Categoría ${catConfig.label} activada`, "success");
      }
      await refetch();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || "Error al actualizar categoría", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // --- 4. RENDERERS ---
  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando perfil...
        </p>
      </div>
    );
  }

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            Categorías y Series
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Define qué categorías están activas en tu escuela. Esto configurará
            automáticamente los grupos de entrenamiento y asistencia.
          </p>
        </div>

        {/* SELECTOR DE ESCUELA (Estilo Control Panel) */}
        {availableSchools.length > 0 && (
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-1 flex items-center gap-2">
            <div className="bg-indigo-50 p-2.5 rounded-lg">
              <School className="w-5 h-5 text-[#312E81]" />
            </div>
            <div className="pr-4 relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Escuela Seleccionada
              </label>
              {availableSchools.length > 1 ? (
                <div className="relative group">
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="appearance-none bg-transparent font-bold text-[#312E81] text-sm focus:outline-none cursor-pointer pr-6 w-full"
                  >
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#312E81] pointer-events-none" />
                </div>
              ) : (
                <span className="font-bold text-[#312E81] text-sm block">
                  {currentSchool?.name}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* GRID DE CATEGORÍAS */}
      {catsLoading && !activeCategories.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {STANDARD_CATEGORIES.map((cat) => {
            const isActive = activeCategories.some(
              (c: any) => c.name === cat.name,
            );
            const isLoading = processingId === cat.name;
            const Icon = cat.icon;

            return (
              <div
                key={cat.name}
                onClick={() => !isLoading && handleToggle(cat)}
                className={`
                  group relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                  ${
                    isActive
                      ? "bg-[#F0FDFA] border-[#10B981] shadow-md shadow-emerald-100"
                      : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-gray-100"
                  }
                `}
              >
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-2.5 rounded-xl ${isActive ? "bg-[#10B981] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-[#312E81]"} transition-colors`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Switch Visual */}
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ${isActive ? "bg-[#10B981]" : "bg-gray-300"}`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isActive ? "translate-x-5" : ""}`}
                    ></div>
                  </div>
                </div>

                {/* Content Card */}
                <div>
                  <h3
                    className={`text-lg font-bold mb-1 ${isActive ? "text-[#064E3B]" : "text-gray-700"}`}
                  >
                    {cat.label}
                  </h3>
                  <p
                    className={`text-xs font-medium ${isActive ? "text-[#047857]" : "text-gray-400"}`}
                  >
                    {cat.description}
                  </p>
                </div>

                {/* Overlay de Loading Local */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-[#312E81]" />
                  </div>
                )}

                {/* Indicador de Estado (Esquina) */}
                {isActive && (
                  <div className="absolute top-0 right-0 p-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER INFORMATIVO */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start">
        <div className="bg-indigo-100 p-3 rounded-full shrink-0 text-[#312E81]">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-bold text-[#312E81] text-lg mb-1">
            ¿Cómo funciona esto?
          </h4>
          <p className="text-indigo-900/80 text-sm leading-relaxed mb-4">
            Al activar una categoría (ej: Sub-12), el sistema habilita
            automáticamente los módulos de
            <strong> asistencia, citaciones y pagos</strong> para ese grupo de
            edad en la escuela
            <span className="font-bold"> {currentSchool?.name}</span>.
          </p>
          <div className="flex gap-2 text-xs font-semibold text-[#312E81]">
            <span className="bg-white px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
              <CheckCircle2 size={12} /> Cambios instantáneos
            </span>
            <span className="bg-white px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
              <AlertCircle size={12} /> Sin pérdida de datos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
