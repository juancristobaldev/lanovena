"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  UserCog,
  ShieldCheck,
  Trophy,
  Key,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

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

const UPDATE_COACH_CATEGORIES = gql`
  mutation UpdateCoachCategories($userId: String!, $categoryIds: [String!]!) {
    assignCategoriesToCoach(userId: $userId, categoryIds: $categoryIds) {
      id
    }
  }
`;

export default function CreateCoachPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    categoryIds: [] as string[],
  });

  // Derivamos la escuela activa
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const { data: catData, loading: loadingCats }: any = useQuery(
    GET_CATEGORIES_SELECT,
    {
      variables: { schoolId: activeSchoolId },
      skip: !activeSchoolId,
    },
  );

  const [createCoach, { loading: creating }] = useMutation(CREATE_COACH);
  const [updateCategories, { loading: updatingCats }] = useMutation(
    UPDATE_COACH_CATEGORIES,
  );
  const isSaving = creating || updatingCats;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchoolId)
      return showAlert("Error: Escuela no identificada", "error");

    try {
      // 1. Crear Usuario
      const { data: newUser }: any = await createCoach({
        variables: {
          input: {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: "COACH",
            schoolId: activeSchoolId,
          },
        },
      });

      // 2. Asignar Categorías si seleccionó alguna
      if (newUser?.createCoach?.id && formData.categoryIds.length > 0) {
        await updateCategories({
          variables: {
            userId: newUser.createCoach.id,
            categoryIds: formData.categoryIds,
          },
        });
      }

      showAlert("Entrenador integrado exitosamente", "success");
      router.push("/dashboard/director/coachs"); // Volver a la lista
    } catch (error: any) {
      showAlert(error.message || "Hubo un problema al crear", "error");
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Volver al listado
      </button>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Ficha del Nuevo Entrenador
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Ingresa los datos del profesional y otórgale acceso a sus series.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* 1. Datos Personales */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserCog size={16} className="text-[#312E81]" /> Perfil Básico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Bielsa"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="profe@lanovena.cl"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                />
              </div>
            </div>
          </section>

          {/* 2. Seguridad */}
          <section className="space-y-4 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#312E81]" /> Acceso a
              Plataforma
            </h3>
            <div className="max-w-md">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Contraseña Inicial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Key size={16} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2">
                El profesor podrá cambiar esta contraseña desde su App.
              </p>
            </div>
          </section>

          {/* 3. Series */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Trophy size={16} className="text-[#10B981]" /> Asignación de
              Categorías
            </h3>
            {loadingCats ? (
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
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
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          isSelected
                            ? "bg-[#10B981] text-white border-[#10B981] shadow-lg shadow-emerald-900/10"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#312E81]/30 hover:bg-slate-50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 font-medium">
                    No hay categorías creadas en esta escuela.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-100 flex gap-4 justify-end">
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
              className="px-8 py-3 rounded-xl font-bold text-white bg-[#312E81] hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
                </>
              ) : (
                "Crear Entrenador"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
