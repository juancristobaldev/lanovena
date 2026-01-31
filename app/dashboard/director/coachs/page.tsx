"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Plus,
  User as UserIcon,
  Mail,
  Edit,
  School,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// === GRAPHQL OPERATIONS ===

const GET_COACHES = gql`
  query GetCoaches($schoolId: ID!) {
    coaches(schoolId: $schoolId) {
      id
      fullName
      email
      role
      coachProfile {
        id
        categories {
          id
          name
        }
      }
    }
  }
`;

const GET_CATEGORIES_SELECT = gql`
  query GetCategoriesSelect($schoolId: String!) {
    categories(schoolId: $schoolId) {
      id
      name
    }
  }
`;

const CREATE_COACH = gql`
  mutation CreateCoach($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      fullName
    }
  }
`;

// Nueva mutación para actualizar datos básicos del usuario
const UPDATE_USER = gql`
  mutation UpdateUser($userId: ID!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      fullName
      email
    }
  }
`;

const UPDATE_COACH_CATEGORIES = gql`
  mutation UpdateCoachCategories($userId: ID!, $categoryIds: [ID!]!) {
    assignCategoriesToCoach(userId: $userId, categoryIds: $categoryIds) {
      id
    }
  }
`;

export default function CoachesPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    categoryIds: [] as string[],
  });

  // --- SELECCIÓN DE ESCUELA ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // @ts-ignore: Compatibilidad con array o objeto único
    return user.schools || (user.school ? [user.school] : []);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].school.id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERIES ---
  const {
    data: coachesData,
    loading: loadingCoaches,
    refetch: refetchCoaches,
  }: any = useQuery(GET_COACHES, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "network-only",
  });

  const { data: catData }: any = useQuery(GET_CATEGORIES_SELECT, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
  });

  // --- MUTATIONS ---
  const [createCoach, { loading: creating }] = useMutation(CREATE_COACH);
  const [updateUser, { loading: updatingUser }] = useMutation(UPDATE_USER);
  const [updateCategories, { loading: updatingCats }] = useMutation(
    UPDATE_COACH_CATEGORIES,
  );

  const isSaving = creating || updatingUser || updatingCats;

  // --- HANDLERS ---

  const handleOpenModal = () => {
    setEditingCoachId(null); // Modo Crear
    setFormData({ fullName: "", email: "", password: "", categoryIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (coach: any) => {
    setEditingCoachId(coach.id); // Modo Editar

    // Extraer IDs de categorías asignadas
    const currentCategoryIds =
      coach.coachProfile?.categories?.map((c: any) => c.id) || [];

    setFormData({
      fullName: coach.fullName,
      email: coach.email,
      password: "", // No rellenamos password al editar por seguridad
      categoryIds: currentCategoryIds,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSchoolId) return showAlert("Selecciona una escuela", "error");

    // Validación básica
    if (!formData.fullName || !formData.email) {
      return showAlert("Nombre y Email son obligatorios", "warning");
    }
    // Si estamos creando, el password es obligatorio
    if (!editingCoachId && !formData.password) {
      return showAlert(
        "La contraseña es obligatoria para nuevos usuarios",
        "warning",
      );
    }

    try {
      let targetUserId = editingCoachId;

      if (editingCoachId) {
        // === MODO EDICIÓN ===
        await updateUser({
          variables: {
            userId: editingCoachId,
            input: {
              fullName: formData.fullName,
              email: formData.email,
              // Solo enviamos password si el usuario escribió algo nuevo
              ...(formData.password ? { password: formData.password } : {}),
            },
          },
        });
      } else {
        // === MODO CREACIÓN ===
        const { data: newUser }: any = await createCoach({
          variables: {
            input: {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              role: "COACH",
              schoolId: selectedSchoolId,
            },
          },
        });
        targetUserId = newUser?.createUser?.id;
      }

      // === ASIGNACIÓN DE CATEGORÍAS ===
      // Siempre actualizamos las categorías (tanto al crear como al editar)
      if (targetUserId) {
        // Nota: Incluso si el array está vacío, lo enviamos para "desasignar" todas si es el caso
        await updateCategories({
          variables: {
            userId: targetUserId,
            categoryIds: formData.categoryIds,
          },
        });
      }

      showAlert(
        editingCoachId
          ? "Entrenador actualizado"
          : "Entrenador creado exitosamente",
        "success",
      );
      setIsModalOpen(false);
      refetchCoaches();
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al procesar solicitud", "error");
    }
  };

  const toggleCategorySelection = (catId: string) => {
    setFormData((prev) => {
      const exists = prev.categoryIds.includes(catId);
      if (exists)
        return {
          ...prev,
          categoryIds: prev.categoryIds.filter((id) => id !== catId),
        };
      return { ...prev, categoryIds: [...prev.categoryIds, catId] };
    });
  };

  // --- RENDER ---

  if (userLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-indigo-900" />
      </div>
    );

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Cuerpo Técnico</h1>
          <p className="text-gray-600">
            Gestiona los entrenadores y sus asignaciones.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {availableSchools.length > 1 && (
            <div className="relative group bg-white border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
              <School className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-indigo-900 cursor-pointer appearance-none pr-6"
              >
                {availableSchools.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
            </div>
          )}

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95 transform"
          >
            <Plus className="w-4 h-4" />
            Nuevo Entrenador
          </button>
        </div>
      </div>

      {/* GRID DE ENTRENADORES */}
      {loadingCoaches ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coachesData?.coaches?.map((coach: any) => (
            <div
              key={coach.id}
              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-5 flex flex-col relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-100">
                    {coach.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">
                      {coach.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[140px]">
                        {coach.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Editar Activo */}
                <button
                  onClick={() => handleEdit(coach)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Editar Entrenador"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-auto pt-3 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Categorías
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.coachProfile?.categories?.length > 0 ? (
                    coach.coachProfile.categories.map((cat: any) => (
                      <span
                        key={cat.id}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] rounded border border-indigo-100 font-medium"
                      >
                        {cat.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded">
                      Sin asignaciones
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {(!coachesData?.coaches || coachesData.coaches.length === 0) && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <UserIcon className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-gray-600">
                Sin Cuerpo Técnico
              </h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                No hay entrenadores registrados en{" "}
                <strong>{currentSchool?.name}</strong>.
              </p>
              <button
                onClick={handleOpenModal}
                className="text-indigo-600 font-bold text-sm hover:underline"
              >
                Crear el primer entrenador
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL (CREAR / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-indigo-900">
                  {editingCoachId ? "Editar Entrenador" : "Nuevo Entrenador"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingCoachId
                    ? "Modifica los datos y asignaciones"
                    : "Registra un nuevo miembro del staff"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ej: Marcelo Bielsa"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="coach@lanovena.cl"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    {editingCoachId
                      ? "Nueva Contraseña (Opcional)"
                      : "Contraseña Provisoria"}
                  </label>
                  <input
                    type="password"
                    required={!editingCoachId} // Solo requerida si es nuevo
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-300"
                    placeholder={
                      editingCoachId
                        ? "Dejar en blanco para mantener"
                        : "******"
                    }
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Selector de Categorías */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3">
                  Categorías Asignadas
                </label>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-2">
                    {catData?.categories?.map((cat: any) => {
                      const isSelected = formData.categoryIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleCategorySelection(cat.id)}
                          className={`
                            cursor-pointer text-xs px-3 py-2.5 rounded-md border transition-all select-none text-center font-medium
                            ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-1 ring-indigo-200"
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700"
                            }
                          `}
                        >
                          {cat.name}
                        </div>
                      );
                    })}
                  </div>
                  {(!catData?.categories ||
                    catData.categories.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">
                        No hay categorías configuradas.
                      </p>
                      <p className="text-[10px] text-indigo-500 mt-1">
                        Ve a "Categorías" para activarlas.
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  El entrenador verá solo los jugadores de estas series.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-900 rounded-lg hover:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCoachId ? "Guardar Cambios" : "Crear Entrenador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
