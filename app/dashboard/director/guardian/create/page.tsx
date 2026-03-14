"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Key,
  ShieldCheck,
} from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

const CREATE_GUARDIAN = gql`
  mutation CreateGuardian($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      fullName
    }
  }
`;

export default function CreateGuardianPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const [createGuardian, { loading: isSaving }] = useMutation(CREATE_GUARDIAN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchoolId)
      return showAlert("Error: Escuela no identificada", "error");

    try {
      await createGuardian({
        variables: {
          input: {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role: "GUARDIAN",
            schoolId: activeSchoolId,
          },
        },
      });

      showAlert("Apoderado registrado exitosamente", "success");
      router.push("/dashboard/director/guardian");
    } catch (error: any) {
      const msg = error.message.includes("Unique constraint")
        ? "El correo ingresado ya pertenece a un usuario."
        : error.message || "Error al registrar apoderado.";
      showAlert(msg, "error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Volver a familias
      </button>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Nuevo Apoderado
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Crea la cuenta para que el tutor pueda acceder a la plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* 1. Datos Personales */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserIcon size={16} className="text-[#312E81]" /> Identificación
            </h3>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Roberto Gómez"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="familia@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Teléfono WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Seguridad */}
          <section className="space-y-4 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#10B981]" /> Acceso App
              Móvil
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
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-3">
                * Con su email y esta contraseña, el apoderado podrá ver la
                ficha de su hijo y su código QR.
              </p>
            </div>
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
              className="px-8 py-3 rounded-xl font-bold text-white bg-[#10B981] hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
