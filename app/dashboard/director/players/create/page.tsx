"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  Loader2,
  UserPlus,
  Calendar,
  Target,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";
import { useMutation, useQuery } from "@apollo/client/react";

interface Category {
  id: string;
  name: string;
}
interface FormDataQuery {
  categories: Category[];
  usersByRole: { id: string; fullName: string }[];
}

const GET_FORM_DATA = gql`
  query GetPlayerFormData($schoolId: String!) {
    categories(schoolId: $schoolId) {
      id
      name
    }
    usersByRole(role: GUARDIAN, schoolId: $schoolId) {
      id
      fullName
    }
  }
`;

const CREATE_PLAYER = gql`
  mutation CreatePlayer($input: CreatePlayerInput!) {
    createPlayer(input: $input) {
      id
      firstName
    }
  }
`;

export const POSITIONS = [
  {
    id: "GK",
    label: "GK",
    full: "Arquero",
    color: "bg-amber-500",
    text: "text-amber-600",
  },
  {
    id: "DEF",
    label: "DEF",
    full: "Defensa",
    color: "bg-blue-600",
    text: "text-blue-700",
  },
  {
    id: "MID",
    label: "MID",
    full: "Medio",
    color: "bg-[#10B981]",
    text: "text-[#10B981]",
  },
  {
    id: "FW",
    label: "FW",
    full: "Delantero",
    color: "bg-red-600",
    text: "text-red-700",
  },
];

export default function CreatePlayerPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useUser();

  const [calculatedCategory, setCalculatedCategory] = useState<Category | null>(
    null,
  );
  const [targetSubAge, setTargetSubAge] = useState<number | string | null>(
    null,
  );

  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      categoryId: "",
      position: "MID",
      scholarship: "false",
      guardianId: "",
    },
  });

  const { data: formData, loading: loadingData } = useQuery<FormDataQuery>(
    GET_FORM_DATA,
    {
      variables: { schoolId: activeSchoolId },
      skip: !activeSchoolId,
    },
  );

  const [createPlayer, { loading: creating }] = useMutation(CREATE_PLAYER);

  // Lógica de cálculo de edad (Intacta, solo mejoramos su UI)
  const birthDate = useWatch({ control, name: "birthDate" });
  useEffect(() => {
    if (!birthDate || !formData?.categories) {
      setCalculatedCategory(null);
      setTargetSubAge(null);
      setValue("categoryId", "");
      return;
    }

    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    let targetCategoryName: string | null = null;
    let visualSubAge: number | null = null;

    if (age <= 5) {
      targetCategoryName = "sub-5";
      visualSubAge = 5;
    } else if (age === 6) {
      targetCategoryName = "sub-6";
      visualSubAge = 6;
    } else if (age <= 8) {
      targetCategoryName = "sub-8";
      visualSubAge = 8;
    } else if (age <= 10) {
      targetCategoryName = "sub-10";
      visualSubAge = 10;
    } else if (age <= 12) {
      targetCategoryName = "sub-12";
      visualSubAge = 12;
    } else if (age <= 14) {
      targetCategoryName = "sub-14";
      visualSubAge = 14;
    } else if (age <= 16) {
      targetCategoryName = "sub-16";
      visualSubAge = 16;
    } else if (age <= 18) {
      targetCategoryName = "sub-18";
      visualSubAge = 18;
    } else {
      targetCategoryName = "proyeccion";
      visualSubAge = null;
    }

    setTargetSubAge(visualSubAge);

    const matchedCat = formData.categories.find((c) =>
      c.name.toLowerCase().includes(targetCategoryName!),
    );
    if (matchedCat) {
      setCalculatedCategory(matchedCat);
      setValue("categoryId", matchedCat.id, { shouldValidate: true });
    } else {
      setCalculatedCategory(null);
      setValue("categoryId", "");
    }
  }, [birthDate, formData, setValue]);

  const onSubmit = async (data: any) => {
    if (!data.categoryId)
      return showAlert("Debes tener una categoría válida asignada.", "error");

    try {
      await createPlayer({
        variables: {
          input: {
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: new Date(data.birthDate),
            categoryId: data.categoryId,
            position: data.position,
            guardianId: data.guardianId,
            scholarship: data.scholarship === "true",
            schoolId: activeSchoolId,
          },
        },
      });
      showAlert("Jugador matriculado con éxito", "success");
      router.push("/dashboard/director/players");
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  const isFormValidToSubmit = !!birthDate && !!calculatedCategory;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Volver a la plantilla
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Visual */}
        <div className="bg-[#312E81] relative px-10 py-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 text-white">
            <h2 className="text-3xl font-black tracking-tight mb-2">
              Matrícula de Jugador
            </h2>
            <p className="text-indigo-200 font-medium text-lg">
              El sistema calculará automáticamente la serie según su año de
              nacimiento.
            </p>
          </div>
        </div>

        {/* Formulario */}
        {loadingData ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#312E81] w-12 h-12" />
            <p className="font-medium text-slate-500">
              Sincronizando categorías...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-10">
            {/* 1. Datos Personales y Categoría Automática */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UserPlus size={16} className="text-[#312E81]" /> Perfil
                  Básico
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nombre
                    </label>
                    <input
                      {...register("firstName", { required: true })}
                      placeholder="Ej: Matías"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Apellido
                    </label>
                    <input
                      {...register("lastName", { required: true })}
                      placeholder="Ej: Fernández"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      {...register("birthDate", { required: true })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Panel de Categoría */}
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200 flex flex-col justify-center">
                <p className="text-sm font-bold text-slate-700 mb-4 text-center">
                  Asignación de Serie (Regla Sub)
                </p>

                {!birthDate ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">
                      Selecciona la fecha de nacimiento para asignar serie.
                    </p>
                  </div>
                ) : calculatedCategory ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#10B981]"></div>
                    <CheckCircle2
                      size={40}
                      className="mx-auto mb-3 text-[#10B981]"
                    />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">
                      Categoría Compatible
                    </p>
                    <p className="text-2xl font-black text-emerald-900">
                      {calculatedCategory.name}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    <AlertCircle
                      size={40}
                      className="mx-auto mb-3 text-red-500"
                    />
                    <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">
                      Serie Inexistente
                    </p>
                    <p className="text-sm font-medium text-red-800">
                      El sistema busca la categoría{" "}
                      <strong className="font-black">
                        Sub-{targetSubAge || "Adulto"}
                      </strong>{" "}
                      pero tu escuela no la tiene creada.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Posición y Administración */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-8 border-t border-slate-100">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Target size={16} className="text-[#10B981]" /> Posición
                  Principal
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {POSITIONS.map((pos) => (
                    <label key={pos.id} className="cursor-pointer group">
                      <input
                        type="radio"
                        value={pos.id}
                        {...register("position")}
                        className="peer hidden"
                      />
                      <div className="border border-slate-200 rounded-2xl p-4 text-center bg-white hover:bg-slate-50 transition-all peer-checked:ring-2 peer-checked:ring-[#312E81] peer-checked:border-transparent peer-checked:shadow-md">
                        <div
                          className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${pos.color} text-white font-black text-sm shadow-sm group-hover:-translate-y-1 transition-transform`}
                        >
                          {pos.label}
                        </div>
                        <div
                          className={`text-[10px] font-black uppercase tracking-wide text-slate-400 peer-checked:${pos.text}`}
                        >
                          {pos.full}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Trophy size={16} className="text-amber-500" /> Vínculos y
                  Finanzas
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Apoderado Responsable
                  </label>
                  <select
                    {...register("guardianId", { required: true })}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-700"
                  >
                    <option value="">Selecciona una familia...</option>
                    {formData?.usersByRole?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Estado de Beca
                  </label>
                  <select
                    {...register("scholarship")}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium text-slate-700"
                  >
                    <option value="false">Pago de Mensualidad Normal</option>
                    <option value="true">
                      Jugador Becado (Exento de pago)
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-8 border-t border-slate-100 flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={creating}
                className="px-8 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || !isFormValidToSubmit}
                className={`px-10 py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                  isFormValidToSubmit && !creating
                    ? "bg-[#10B981] hover:bg-emerald-500 shadow-emerald-900/20"
                    : "bg-slate-300 cursor-not-allowed shadow-none"
                }`}
              >
                {creating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} /> Matricular Alumno
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
