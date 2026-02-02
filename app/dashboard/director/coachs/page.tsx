"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Plus,
  Search,
  Mail,
  Edit2,
  School,
  ChevronDown,
  ShieldCheck,
  Trophy,
  Key,
  UserCog,
  Trash2,
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
    createCoach(input: $input) {
      id
      fullName
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($userId: String!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      fullName
      email
    }
  }
`;

const UPDATE_COACH_CATEGORIES = gql`
  mutation UpdateCoachCategories($userId: String!, $categoryIds: [String!]!) {
    assignCategoriesToCoach(userId: $userId, categoryIds: $categoryIds) {
      id
    }
  }
`;

// === TYPES ===
interface Category {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  fullName: string;
  email: string;
  role: string;
  coachProfile: {
    id: string;
    categories: Category[];
  };
}

export default function CoachesPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();

  // States
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    categoryIds: [] as string[],
  });

  // --- ESCUELAS ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // Normalizar array de escuelas
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
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

  // --- LOGIC ---

  // Filtrado Frontend
  const filteredCoaches = useMemo(() => {
    if (!coachesData?.coaches) return [];
    if (!searchTerm) return coachesData.coaches;
    return coachesData.coaches.filter(
      (c: Coach) =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [coachesData, searchTerm]);

  const handleOpenModal = () => {
    setEditingCoachId(null);
    setFormData({ fullName: "", email: "", password: "", categoryIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (coach: Coach) => {
    setEditingCoachId(coach.id);
    const currentCategoryIds =
      coach.coachProfile?.categories?.map((c) => c.id) || [];
    setFormData({
      fullName: coach.fullName,
      email: coach.email,
      password: "",
      categoryIds: currentCategoryIds,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return showAlert("Selecciona una escuela", "error");

    try {
      let targetUserId = editingCoachId;

      if (editingCoachId) {
        // Editar
        await updateUser({
          variables: {
            userId: editingCoachId,
            input: {
              role: "COACH",
              fullName: formData.fullName,
              email: formData.email,
              ...(formData.password ? { password: formData.password } : {}),
            },
          },
        });
      } else {
        // Crear
        if (!formData.password)
          return showAlert("Contraseña obligatoria", "warning");

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
        targetUserId = newUser?.createCoach?.id;
      }

      // Asignar Categorías
      if (targetUserId) {
        await updateCategories({
          variables: {
            userId: targetUserId,
            categoryIds: formData.categoryIds,
          },
        });
      }

      showAlert(
        editingCoachId ? "Perfil actualizado" : "Entrenador creado",
        "success",
      );
      setIsModalOpen(false);
      refetchCoaches();
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al procesar", "error");
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
  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando staff...
        </p>
      </div>
    );
  }

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            Cuerpo Técnico
          </h1>
          <p className="text-gray-500 text-lg">
            Gestiona el acceso y las asignaciones de tus entrenadores.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Selector Escuela */}
          {availableSchools.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 min-w-[200px]">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <School className="w-4 h-4 text-[#312E81]" />
              </div>
              <div className="relative flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Escuela
                </span>
                {availableSchools.length > 1 ? (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="bg-transparent font-bold text-[#312E81] text-sm outline-none w-full appearance-none cursor-pointer"
                  >
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-[#312E81] text-sm block truncate">
                    {currentSchool?.name}
                  </span>
                )}
              </div>
              {availableSchools.length > 1 && (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}

          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
          >
            <Plus strokeWidth={3} className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Entrenador</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:border-transparent transition duration-150 ease-in-out shadow-sm"
        />
      </div>

      {/* 3. GRID DE ENTRENADORES */}
      {loadingCoaches ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredCoaches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach: Coach) => (
            <div
              key={coach.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Card Header Gradient */}
              <div className="h-20 bg-gradient-to-r from-[#312E81] to-[#4F46E5] relative">
                <div className="absolute -bottom-8 left-6">
                  <div className="w-16 h-16 bg-white p-1 rounded-2xl shadow-md">
                    <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-[#312E81] font-bold text-xl border border-indigo-100">
                      {coach.fullName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleEdit(coach)}
                    className="bg-white/20 hover:bg-white text-white hover:text-[#312E81] p-2 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                    {coach.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail size={14} />
                    <span className="truncate">{coach.email}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={14} className="text-[#10B981]" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Categorías a cargo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coach.coachProfile?.categories?.length > 0 ? (
                      coach.coachProfile.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-[#312E81] border border-indigo-100"
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                        Sin asignaciones
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <UserCog size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchTerm
              ? "No se encontraron resultados"
              : "Sin Entrenadores Registrados"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm text-center mb-6">
            {searchTerm
              ? `No hay nadie que coincida con "${searchTerm}".`
              : "Comienza armando tu equipo técnico para gestionar las series."}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenModal}
              className="text-[#312E81] font-bold text-sm hover:underline"
            >
              Registrar primer entrenador
            </button>
          )}
        </div>
      )}

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#312E81]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-xl text-[#111827]">
                  {editingCoachId ? "Editar Perfil" : "Nuevo Entrenador"}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {editingCoachId
                    ? "Actualiza datos y permisos"
                    : "Registra un profesional en tu escuela"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form
                id="coachForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Datos Personales */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <UserCog size={14} /> Información Personal
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Marcelo Bielsa"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none transition-all"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Corporativo
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="coach@lanovena.cl"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none transition-all"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Seguridad */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <ShieldCheck size={14} /> Seguridad y Acceso
                  </h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {editingCoachId
                        ? "Cambiar Contraseña (Opcional)"
                        : "Contraseña de Acceso"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Key size={16} />
                      </div>
                      <input
                        type="password"
                        required={!editingCoachId}
                        placeholder={
                          editingCoachId
                            ? "Dejar vacío para mantener la actual"
                            : "Mínimo 6 caracteres"
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none bg-white"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Asignaciones */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Trophy size={14} /> Asignación de Series
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {catData?.categories?.map((cat: any) => {
                        const isSelected = formData.categoryIds.includes(
                          cat.id,
                        );
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategorySelection(cat.id)}
                            className={`
                                       px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                       ${
                                         isSelected
                                           ? "bg-[#10B981] text-white border-[#10B981] shadow-md shadow-emerald-200"
                                           : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-[#312E81]"
                                       }
                                    `}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                      {(!catData?.categories ||
                        catData.categories.length === 0) && (
                        <p className="text-xs text-gray-400 w-full text-center py-2">
                          No hay categorías disponibles.
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 ml-1">
                    * El entrenador solo podrá ver y gestionar jugadores de
                    estas series.
                  </p>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="coachForm"
                disabled={isSaving}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#312E81] rounded-xl hover:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/10"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                  </>
                ) : editingCoachId ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Entrenador"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
