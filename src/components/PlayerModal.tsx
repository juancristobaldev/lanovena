"use client";

import { useForm } from "react-hook-form";
import { X, Save, Loader2 } from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

// Queries auxiliares para llenar los selects del formulario
const GET_FORM_DATA = gql`
  query GetFormData($schoolId: String!) {
    # Asumiendo que existen estas queries o similares
    categories(schoolId: $schoolId) {
      id
      name
    }
    # Listar usuarios con rol GUARDIAN para asignar
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
    formState: { errors },
  }: any = useForm();

  const { data: formData }: any = useQuery(GET_FORM_DATA, {
    variables: { schoolId },
    skip: !schoolId,
  });

  const [createPlayer, { loading }] = useMutation(CREATE_PLAYER, {
    onCompleted: () => {
      onSuccess();
      onClose();
    },
  });

  const onSubmit = (data: any) => {
    createPlayer({
      variables: {
        input: {
          ...data,
          // Convertir fecha string a objeto Date si es necesario o formato ISO
          birthDate: new Date(data.birthDate),
          scholarship: data.scholarship === "true",
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-[#312E81] px-6 py-4 flex justify-between items-center text-white">
          <h2 className="font-bold text-lg">Nuevo Jugador</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Nombre
              </label>
              <input
                {...register("firstName", { required: true })}
                className="input-base"
                placeholder="Ej: Matías"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Apellido
              </label>
              <input
                {...register("lastName", { required: true })}
                className="input-base"
                placeholder="Ej: Fernández"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              {...register("birthDate", { required: true })}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Categoría
              </label>
              <select
                {...register("categoryId", { required: true })}
                className="input-base bg-white"
              >
                <option value="">Seleccionar...</option>
                {formData?.categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Beca
              </label>
              <select
                {...register("scholarship")}
                className="input-base bg-white"
              >
                <option value="false">No</option>
                <option value="true">Sí (Gratuidad)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Apoderado Responsable
            </label>
            <select
              {...register("guardianId", { required: true })}
              className="input-base bg-white"
            >
              <option value="">Buscar apoderado...</option>
              {formData?.usersByRole?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              * El apoderado debe estar registrado previamente.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#10B981] text-white font-bold rounded-lg hover:bg-emerald-600 transition flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Guardar Jugador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
