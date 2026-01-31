"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle, School, ChevronDown } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
// Asumimos que este es tu hook de autenticación personalizado o de librería
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

// === CONSTANTES ===
const STANDARD_CATEGORIES = [
  { name: "Sub-5", label: "Sub 5 (Promoción)", description: "4 a 5 años" },
  { name: "Sub-6", label: "Sub 6", description: "5 a 6 años" },
  { name: "Sub-8", label: "Sub 8", description: "7 a 8 años" },
  { name: "Sub-10", label: "Sub 10", description: "9 a 10 años" },
  { name: "Sub-12", label: "Sub 12", description: "11 a 12 años" },
  { name: "Sub-14", label: "Sub 14", description: "13 a 14 años" },
  { name: "Sub-16", label: "Sub 16", description: "15 a 16 años" },
  { name: "Sub-18", label: "Sub 18 (Juvenil)", description: "17 a 18 años" },
  { name: "Proyeccion", label: "Proyección", description: "19+ años" },
  { name: "Femenina", label: "Rama Femenina", description: "Todo competidor" },
];

export default function ManageCategoriesPage() {
  const { showAlert } = useAlert();

  // 1. Obtener usuario del contexto
  const { user, loading: userLoading } = useUser();

  // 2. Estado para la escuela seleccionada
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // 3. Normalizar la lista de escuelas (Soporte para array user.schools o singular user.school)
  const availableSchools = React.useMemo(() => {
    if (!user) return [];
    // Prioridad a .schools (plural) si existe, sino fallback a .school (singular del Schema)
    // @ts-ignore: Ignoramos TS si 'schools' no está en tu tipo UserEntity aun
    const schoolsList = user.schools || (user.school ? [user.school] : []);
    return schoolsList;
  }, [user]);

  // Efecto para autoseleccionar la primera escuela al cargar
  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].school.id);
    }
  }, [availableSchools, selectedSchoolId]);

  // 4. Obtener categorías de la escuela seleccionada
  const {
    data,
    loading: catsLoading,
    refetch,
  }: any = useQuery(GET_CATEGORIES, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "network-only",
  });

  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY);
  const [removeCategory, { loading: removing }] = useMutation(REMOVE_CATEGORY);

  const activeCategories = data?.categories || [];

  const getActiveCategory = (stdName: string) => {
    return activeCategories.find((c: any) => c.name === stdName);
  };

  const handleToggle = async (stdCategory: (typeof STANDARD_CATEGORIES)[0]) => {
    if (!selectedSchoolId) {
      showAlert("Selecciona una escuela primero", "error");
      return;
    }

    const existing = getActiveCategory(stdCategory.name);

    try {
      if (existing) {
        // === DESACTIVAR ===
        if (!confirm(`¿Desactivar ${stdCategory.label}?`)) return;

        await removeCategory({ variables: { id: existing.id } });
        showAlert(`Categoría ${stdCategory.label} desactivada`, "success");
      } else {
        // === ACTIVAR ===
        // Aquí pasamos schoolId explícitamente en el input si tu backend lo requiere,
        // o confiamos en que el backend use el contexto si no se envía.
        // Dado que un Director puede tener varias escuelas según tu requerimiento,
        // lo mejor es enviar el schoolId o asegurar que el backend sepa cuál es.
        // *Nota*: Tu resolver createCategory actual usa `context.user.schoolId`.
        // Si el usuario tiene múltiples, necesitarás actualizar el resolver para aceptar `schoolId` en el Input.
        await createCategory({
          variables: {
            input: {
              name: stdCategory.name,
              type: "FORMATIVA",
              schoolId: selectedSchoolId, // Descomentar si actualizas el DTO CreateCategoryInput
            },
          },
        });
        showAlert(`Categoría ${stdCategory.label} activada`, "success");
      }
      refetch();
    } catch (err) {
      console.error(err);
      showAlert("Error al sincronizar categoría", "error");
    }
  };

  // Render de carga inicial de usuario
  if (userLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-900" />
      </div>
    );
  }

  // Si no hay escuelas asociadas
  if (availableSchools.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700">
          <p className="font-bold">No tienes escuelas asignadas.</p>
          <p className="text-sm">
            Contacta al SuperAdmin para que te asigne una escuela.
          </p>
        </div>
      </div>
    );
  }

  const currentSchool = availableSchools.find(
    (s: any) => s.school.id === selectedSchoolId,
  );

  console.log(currentSchool?.school, selectedSchoolId);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* HEADER CON SELECTOR DE ESCUELA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Categorías</h1>
          <p className="text-gray-600">
            Gestiona las series activas de tu escuela.
          </p>
        </div>

        {/* Selector de Escuela (Solo visible si hay más de 1, o para contexto visual) */}
        <div className="relative group">
          <div className="flex items-center gap-3 bg-white border border-indigo-100 shadow-sm px-4 py-2 rounded-lg">
            <div className="bg-indigo-100 p-2 rounded-full">
              <School className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                Escuela Activa
              </p>

              {availableSchools.length > 1 ? (
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="font-bold text-indigo-900 bg-transparent outline-none cursor-pointer pr-6 appearance-none"
                >
                  {availableSchools.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.school.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-bold text-indigo-900">
                  {currentSchool?.school.name}
                </p>
              )}
            </div>
            {availableSchools.length > 1 && (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* GRID DE CATEGORÍAS */}
      {catsLoading ? (
        <div className="flex justify-center p-12 opacity-50">
          <Loader2 className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD_CATEGORIES.map((cat) => {
            const isActive = !!getActiveCategory(cat.name);
            const isProcessing = creating || removing;

            return (
              <label
                key={cat.name}
                className={`
                  relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none
                  ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-gray-200 hover:border-indigo-300 bg-white hover:shadow-md"
                  }
                  ${isProcessing ? "opacity-60 pointer-events-none" : ""}
                `}
              >
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    checked={isActive}
                    onChange={() => handleToggle(cat)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span
                    className={`font-bold block ${isActive ? "text-indigo-900" : "text-gray-700"}`}
                  >
                    {cat.label}
                  </span>
                  <span className="text-gray-500 text-xs leading-tight block mt-0.5">
                    {cat.description}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  {isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 tracking-wide">
                      Activa
                    </span>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* FOOTER / NOTA */}
      <div className="mt-8 bg-blue-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <p className="text-sm text-indigo-900">
            <strong>Nota:</strong> Estás editando la configuración de{" "}
            <u>{currentSchool?.name}</u>. Las categorías marcadas aparecerán
            inmediatamente en el panel de entrenadores y formularios de
            inscripción.
          </p>
        </div>
      </div>
    </div>
  );
}
