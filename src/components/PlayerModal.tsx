"use client";

import { useForm } from "react-hook-form";
import { X, Save, Loader2, Trophy, UserPlus } from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert"; // Asumiendo que tienes este provider

// QUERIES AUXILIARES
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

export default function PlayerModal({
  isOpen,
  onClose,
  schoolId,
  onSuccess,
}: any) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const { showAlert } = useAlert(); // Opcional, para feedback

  // Cargar datos para selects
  const { data: formData, loading: loadingData }: any = useQuery(
    GET_FORM_DATA,
    {
      variables: { schoolId },
      skip: !schoolId || !isOpen,
    },
  );

  const [createPlayer, { loading }] = useMutation(CREATE_PLAYER, {
    onCompleted: () => {
      onSuccess();
      reset(); // Limpiar form
      onClose();
    },
    onError: (err) => {
      // Manejo básico de error
      console.error(err);
      if (showAlert) showAlert(err.message, "error");
    },
  });

  const onSubmit = (data: any) => {
    createPlayer({
      variables: {
        input: {
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: new Date(data.birthDate), // Convertir a Date
          categoryId: data.categoryId,
          guardianId: data.guardianId,
          scholarship: data.scholarship === "true", // Convertir string a bool
          schoolId,
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#312E81]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Nuevo Jugador</h2>
            <p className="text-xs text-gray-500">
              Registra un alumno en la escuela
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loadingData ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          ) : (
            <form
              id="createPlayerForm"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Nombre
                  </label>
                  <input
                    {...register("firstName", { required: true })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] outline-none"
                    placeholder="Ej: Matías"
                  />
                  {errors.firstName && (
                    <span className="text-xs text-red-500">Requerido</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Apellido
                  </label>
                  <input
                    {...register("lastName", { required: true })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] outline-none"
                    placeholder="Ej: Fernández"
                  />
                </div>
              </div>

              {/* Fecha Nacimiento */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  {...register("birthDate", { required: true })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] outline-none"
                />
              </div>

              {/* Categoría y Beca */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Categoría
                  </label>
                  <div className="relative">
                    <select
                      {...register("categoryId", { required: true })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] outline-none bg-white appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      {formData?.categories?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {(!formData?.categories ||
                      formData.categories.length === 0) && (
                      <p className="text-[10px] text-red-500 mt-1">
                        ⚠️ Crea categorías primero
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                    <Trophy size={12} className="text-amber-500" /> Beca
                  </label>
                  <select
                    {...register("scholarship")}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] outline-none bg-white"
                  >
                    <option value="false">Pago Normal</option>
                    <option value="true">Becado (Gratuidad)</option>
                  </select>
                </div>
              </div>

              {/* Apoderado */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-xs font-bold text-[#312E81] uppercase mb-1.5 flex items-center gap-1">
                  <UserPlus size={14} /> Apoderado Responsable
                </label>
                <select
                  {...register("guardianId", { required: true })}
                  className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 text-sm focus:ring-2 focus:ring-[#312E81] outline-none bg-white"
                >
                  <option value="">Buscar apoderado registrado...</option>
                  {formData?.usersByRole?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-2">
                  * Si el apoderado no aparece, debes registrarlo primero en la
                  sección "Apoderados".
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="createPlayerForm"
            disabled={loading || loadingData}
            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#10B981] rounded-xl hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/10"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Guardar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
