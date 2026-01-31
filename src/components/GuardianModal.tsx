"use client";

import { useForm } from "react-hook-form";
import { X, Save, Loader2, Lock } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { CREATE_GUARDIAN } from "@/app/dashboard/director/guardian/page";

export default function GuardianModal({
  isOpen,
  onClose,
  schoolId,
  onSuccess,
}: any) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [createGuardian, { loading }] = useMutation(CREATE_GUARDIAN, {
    onCompleted: () => {
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert("Error al crear: " + error.message);
    },
  });

  const onSubmit = (data: any) => {
    // Aquí definimos una contraseña por defecto o generada.
    // Idealmente, el backend debería enviar un email de bienvenida.
    // Por ahora, usaremos una genérica "123456" o la que ponga el director.

    const input = { ...data, fullName: `${data.firstName} ${data.lastName}` };
    delete input.firstName;
    delete input.lastName;

    createGuardian({
      variables: {
        input: {
          ...input,
          schoolId,
          password: data.password || "lanovena123", // Fallback temporal
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="bg-[#312E81] px-6 py-4 flex justify-between items-center text-white rounded-t-2xl">
          <h2 className="font-bold text-lg">Nuevo Apoderado</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Nombre</label>
              <input
                {...register("firstName", { required: true })}
                className="input-base"
                placeholder="Juan"
              />
              {errors.firstName && (
                <span className="text-red-500 text-xs">Requerido</span>
              )}
            </div>
            <div>
              <label className="label-text">Apellido</label>
              <input
                {...register("lastName", { required: true })}
                className="input-base"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="label-text">Email (Usuario)</label>
            <input
              type="email"
              {...register("email", { required: true })}
              className="input-base"
              placeholder="juan.perez@email.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              Este email será su credencial de acceso.
            </p>
          </div>

          <div>
            <label className="label-text">Teléfono</label>
            <input
              {...register("phone")}
              className="input-base"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-2 mb-2 text-yellow-800 font-bold text-xs uppercase">
              <Lock size={12} /> Contraseña Inicial
            </div>
            <input
              type="text"
              {...register("password")}
              className="input-base bg-white"
              placeholder="Ej: lanovena2024 (Dejar vacío para default)"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Si dejas esto vacío, la contraseña será <b>lanovena123</b>. El
              usuario podrá cambiarla después.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Estilos utilitarios (puedes ponerlos en tu globals.css)
const styles = `
  .label-text { @apply block text-xs font-semibold text-gray-500 uppercase mb-1; }
  .input-base { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#312E81] outline-none transition-all; }
  .btn-primary { @apply px-4 py-2 text-sm bg-[#10B981] text-white font-bold rounded-lg hover:bg-emerald-600 transition shadow-sm; }
  .btn-secondary { @apply px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg; }
`;
