"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  UserCog,
  Trophy,
  Phone,
  Mail,
  UserCheck,
  Key,
  ShieldCheck,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// --- QUERIES Y MUTATIONS ---

const GET_COACH_BY_ID = gql`
  query GetCoachById($coachId: ID!) {
    coachById(coachId: $coachId) {
      id
      email
      fullName
      phone
      isActive
      coachProfile {
        id
        categories {
          id
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

const UPDATE_USER = gql`
  mutation UpdateUser($userId: String!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      fullName
      email
      phone
      isActive
    }
  }
`;

const UPDATE_COACH_CATEGORIES = gql`
  mutation UpdateCoachCategories($userId: String!, $categoryIds: [String!]!) {
    assignCategoriesToCoach(userId: $userId, categoryIds: $categoryIds) {
      id
      categories {
        id
      }
    }
  }
`;

export default function EditCoachPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const { showAlert } = useAlert();
  const { user } = useUser();

  // --- ESTADOS ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "", // Añadimos la contraseña al estado
    isActive: true,
    role: "COACH",
    categoryIds: [] as string[],
  });

  // Derivamos la escuela activa
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  // --- FETCH DE DATOS ---
  const { data: coachData, loading: loadingCoach }: any = useQuery(
    GET_COACH_BY_ID,
    {
      variables: { coachId: userId },
      skip: !userId,
    },
  );

  const { data: catData, loading: loadingCats }: any = useQuery(
    GET_CATEGORIES_SELECT,
    {
      variables: { schoolId: activeSchoolId },
      skip: !activeSchoolId,
    },
  );

  const [updateUser, { loading: updatingUser }] = useMutation(UPDATE_USER);
  const [updateCategories, { loading: updatingCats }] = useMutation(
    UPDATE_COACH_CATEGORIES,
  );

  const isSaving = updatingUser || updatingCats;

  // --- POBLAR FORMULARIO AL CARGAR ---
  useEffect(() => {
    if (coachData?.coachById) {
      const c = coachData.coachById;
      setFormData({
        fullName: c.fullName || "",
        email: c.email || "",
        phone: c.phone || "",
        password: "", // Siempre lo dejamos vacío al inicio por seguridad
        isActive: c.isActive ?? true,
        role: "COACH",
        categoryIds:
          c.coachProfile?.categories?.map((cat: any) => cat.id) || [],
      });
    }
  }, [coachData]);

  // --- MANEJADORES ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Preparamos el input (Si no hay password, no lo enviamos)
      const userInput: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: "COACH",
        isActive: formData.isActive,
      };

      if (formData.password.trim() !== "") {
        userInput.password = formData.password;
      }

      // 2. Actualizar Datos Personales del Usuario
      await updateUser({
        variables: {
          userId,
          input: userInput,
        },
      });

      // 3. Actualizar las Categorías Asignadas
      await updateCategories({
        variables: {
          userId,
          categoryIds: formData.categoryIds,
        },
      });

      showAlert("Entrenador actualizado exitosamente", "success");
      router.back();
    } catch (error: any) {
      showAlert(error.message || "Hubo un problema al actualizar", "error");
    }
  };

  const toggleCategory = (catId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  };

  // --- RENDERIZADO CONDICIONAL DE CARGA ---
  if (loadingCoach) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#312E81]" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12 pt-8 px-4 sm:px-6">
      {/* Botón Volver */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Volver al perfil
      </button>

      {/* Tarjeta Principal */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden relative">
        {/* Decoración Superior estilo La Novena */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#312E81] rounded-full mix-blend-multiply filter blur-3xl opacity-5 -mr-20 -mt-20 z-0 pointer-events-none"></div>

        <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Edición de Entrenador
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Actualiza los datos de{" "}
              <strong className="text-slate-700">{formData.fullName}</strong>.
            </p>
          </div>
          <div className="hidden sm:flex w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100">
            <UserCog className="text-[#312E81]" size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10 relative z-10">
          {/* 1. Datos Personales */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserCog size={16} className="text-[#312E81]" /> Perfil Básico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" /> Correo
                  Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" /> Teléfono
                </label>
                <input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>
          </section>

          {/* 2. Seguridad y Acceso (Contraseña y Estado) */}
          <section className="space-y-4 bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#312E81]" /> Seguridad y
              Acceso
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Reset Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Cambiar Contraseña (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Key size={16} />
                  </div>
                  <input
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-2">
                  Si escribes aquí, se sobrescribirá la contraseña actual del
                  entrenador.
                </p>
              </div>

              {/* Toggle Activo/Inactivo */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <UserCheck
                      size={16}
                      className={
                        formData.isActive ? "text-[#10B981]" : "text-slate-400"
                      }
                    />
                    {formData.isActive ? "Usuario Activo" : "Usuario Inactivo"}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {formData.isActive
                      ? "El profesor puede acceder a la App."
                      : "Acceso denegado a la plataforma."}
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <div
                      className={`block w-12 h-7 rounded-full transition-colors duration-300 ${formData.isActive ? "bg-[#10B981]" : "bg-slate-300"}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${formData.isActive ? "transform translate-x-5" : ""}`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* 3. Series / Categorías */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Trophy size={16} className="text-[#10B981]" /> Categorías a Cargo
            </h3>
            {loadingCats ? (
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-xl"></div>
                <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-xl"></div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {catData?.categories?.length > 0 ? (
                  catData.categories.map((cat: any) => {
                    const isSelected = formData.categoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          isSelected
                            ? "bg-[#10B981] text-white border-[#10B981] shadow-lg shadow-emerald-900/10 scale-[1.02]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#312E81]/30 hover:bg-slate-50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200 w-full">
                    No hay categorías creadas en esta escuela.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Submit / Footer */}
          <div className="pt-8 border-t border-slate-100 flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 rounded-xl font-black text-white bg-[#312E81] hover:bg-slate-900 transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Actualizando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
