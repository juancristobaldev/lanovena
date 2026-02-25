"use client";

import { useForm, useWatch } from "react-hook-form";
import {
  X,
  Save,
  Loader2,
  Trophy,
  UserPlus,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";
import { useEffect, useState } from "react";

// 1. DEFINIR INTERFACES
interface PlayerFormValues {
  firstName: string;
  lastName: string;
  birthDate: string;
  categoryId: string;
  position: string;
  scholarship: string;
  guardianId: string;
}

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

const POSITIONS = [
  {
    id: "ARQ",
    label: "ARQ",
    full: "Arquero",
    color: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-600",
  },
  {
    id: "DEF",
    label: "DEF",
    full: "Defensa",
    color: "bg-blue-600",
    border: "border-blue-600",
    text: "text-blue-700",
  },
  {
    id: "MED",
    label: "MED",
    full: "Mediocampo",
    color: "bg-emerald-600",
    border: "border-emerald-600",
    text: "text-emerald-700",
  },
  {
    id: "DEL",
    label: "DEL",
    full: "Delantero",
    color: "bg-red-600",
    border: "border-red-600",
    text: "text-red-700",
  },
];

export default function PlayerModal({
  isOpen,
  onClose,
  schoolId,
  onSuccess,
}: any) {
  const { showAlert } = useAlert();
  const [calculatedCategory, setCalculatedCategory] = useState<Category | null>(
    null,
  );
  const [targetSubAge, setTargetSubAge] = useState<number | string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<PlayerFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      categoryId: "",
      position: "MED",
      scholarship: "false",
      guardianId: "",
    },
  });

  const { data: formData, loading: loadingData } = useQuery<FormDataQuery>(
    GET_FORM_DATA,
    {
      variables: { schoolId },
      skip: !schoolId || !isOpen,
    },
  );

  const [createPlayer, { loading: creating }] = useMutation(CREATE_PLAYER, {
    onCompleted: () => {
      if (showAlert) showAlert("Jugador registrado con éxito", "success");
      onSuccess();
      reset();
      onClose();
    },
    onError: (err) => {
      console.error(err);
      if (showAlert) showAlert(err.message, "error");
    },
  });

  // Lógica Estricta de Categorías Sub (Chile)
  const birthDate = useWatch({ control, name: "birthDate" });
  useEffect(() => {
    if (!birthDate || !formData?.categories) {
      setCalculatedCategory(null);
      setTargetSubAge(null);
      setValue("categoryId", "");
      return;
    }

    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    let targetCategoryName: string | null = null;
    let visualSubAge: number | null = null;

    // Mapeo EXACTO a tus STANDARD_CATEGORIES
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

    // Buscar en categorías reales del coach
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
  const onSubmit = (data: PlayerFormValues) => {
    if (!data.categoryId) {
      if (showAlert)
        showAlert("Debes tener una categoría válida asignada.", "error");
      return;
    }

    createPlayer({
      variables: {
        input: {
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: new Date(data.birthDate),
          categoryId: data.categoryId,
          position: data.position,
          guardianId: data.guardianId,
          scholarship: data.scholarship === "true",
          schoolId,
        },
      },
    });
  };

  if (!isOpen) return null;

  const isFormValidToSubmit = !!birthDate && !!calculatedCategory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        {/* Header - Modernizado */}
        <div className="bg-[#312E81] relative px-8 py-6 flex justify-between items-center text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="font-bold text-2xl tracking-tight mb-1">
              Inscripción de Jugador
            </h2>
            <p className="text-indigo-200 text-sm font-medium">
              Completa los datos para asignar al alumno automáticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 hover:bg-white/10 p-2.5 rounded-xl transition-colors backdrop-blur-sm"
          >
            <X size={22} className="text-indigo-100" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50">
          {loadingData ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
              <p className="text-sm font-medium text-slate-500">
                Cargando datos de la escuela...
              </p>
            </div>
          ) : (
            <form
              id="createPlayerForm"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-8"
            >
              {/* Sección: Datos Personales */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus size={16} /> Datos Personales
                </h3>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Nombre
                    </label>
                    <input
                      {...register("firstName", { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                      placeholder="Ej: Matías"
                    />
                    {errors.firstName && (
                      <span className="text-[10px] text-red-500 font-medium mt-1 block">
                        Requerido
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Apellido
                    </label>
                    <input
                      {...register("lastName", { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                      placeholder="Ej: Fernández"
                    />
                    {errors.lastName && (
                      <span className="text-[10px] text-red-500 font-medium mt-1 block">
                        Requerido
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="date"
                        {...register("birthDate", { required: true })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Tarjeta de Asignación Automática de Categoría */}
                  {/* Refactor de la tarjeta de Categoría para mejor UX */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Categoría Asignada
                    </label>
                    {!birthDate ? (
                      <div className="px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 text-sm flex items-center gap-2">
                        <Calendar size={16} /> Selecciona una fecha
                      </div>
                    ) : calculatedCategory ? (
                      <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm ring-1 ring-emerald-500/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500"
                          />
                          {calculatedCategory.name}
                        </div>
                        <span className="text-[10px] bg-emerald-200/50 px-2 py-0.5 rounded-full uppercase">
                          Sistema Sub
                        </span>
                      </div>
                    ) : (
                      <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs shadow-sm ring-1 ring-amber-500/20">
                        <div className="flex gap-2">
                          <AlertCircle
                            size={16}
                            className="text-amber-500 shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="font-bold uppercase text-[10px] mb-0.5">
                              Categoría no habilitada
                            </p>
                            <p className="leading-tight">
                              El jugador (año{" "}
                              {new Date(birthDate).getFullYear()}) debería estar
                              en
                              <span className="font-bold">
                                {" "}
                                {targetSubAge == "ADULTO" || !targetSubAge
                                  ? "Adultos"
                                  : `Sub-${targetSubAge}`}
                              </span>
                              . No tienes permisos en esta categoría.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="h-px w-full bg-slate-200"></div>

              {/* Sección: Deportiva */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Target size={16} /> Perfil Deportivo
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-3">
                    Posición Principal
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {POSITIONS.map((pos) => (
                      <label key={pos.id} className="cursor-pointer group">
                        <input
                          type="radio"
                          value={pos.id}
                          {...register("position")}
                          className="peer hidden"
                        />
                        <div
                          className={`border border-slate-200 rounded-xl p-3 text-center transition-all bg-white shadow-sm hover:border-slate-300 peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:border-transparent ${pos.border.replace("border-", "peer-checked:ring-")}`}
                        >
                          <div
                            className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${pos.color} text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform`}
                          >
                            {pos.label}
                          </div>
                          <div
                            className={`text-[10px] font-bold uppercase ${pos.text} opacity-80 peer-checked:opacity-100`}
                          >
                            {pos.full}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="h-px w-full bg-slate-200"></div>

              {/* Sección: Administrativa */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={16} /> Administrativo
                </h3>

                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Apoderado Responsable
                    </label>
                    <select
                      {...register("guardianId", { required: true })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="">Seleccionar apoderado...</option>
                      {formData?.usersByRole?.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                    {errors.guardianId && (
                      <span className="text-[10px] text-red-500 font-medium mt-1 block">
                        Requerido
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Estado Financiero
                    </label>
                    <select
                      {...register("scholarship")}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="false">Pago Mensual Normal</option>
                      <option value="true">Jugador Becado (100%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-white flex gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 px-4 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="createPlayerForm"
            disabled={creating || loadingData || !isFormValidToSubmit}
            className={`w-2/3 px-4 py-3.5 text-sm font-bold text-white rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg ${
              isFormValidToSubmit && !creating
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                : "bg-slate-300 shadow-none cursor-not-allowed"
            }`}
          >
            {creating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {creating ? "Guardando..." : "Inscribir Jugador"}
          </button>
        </div>
      </div>
    </div>
  );
}
