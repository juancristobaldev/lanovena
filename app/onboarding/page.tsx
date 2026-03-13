"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Building2,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Globe,
  Trophy,
} from "lucide-react";

const CREATE_SCHOOL_MUTATION = gql`
  mutation CreateSchool($input: CreateSchoolInput!) {
    createSchool(input: $input) {
      id
      name
      slug
      mode
    }
  }
`;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createSchool] = useMutation(CREATE_SCHOOL_MUTATION);

  const [schoolData, setSchoolData] = useState({
    name: "",
    slug: "",
    mode: "INSTITUTIONAL",
  });

  // Generador de slug en tiempo real y limpieza de caracteres
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD") // Descompone acentos
      .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
      .replace(/[^a-z0-9]+/g, "-") // Reemplaza espacios y símbolos por guiones
      .replace(/^-+|-+$/g, ""); // Limpia guiones al inicio o final

    setSchoolData({ ...schoolData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await createSchool({
        variables: {
          input: {
            name: schoolData.name,
            slug: schoolData.slug,
            mode: schoolData.mode,
            subscriptionStatus: "PENDING",
          },
        },
      });

      router.push("/dashboard/director");
    } catch (err: any) {
      console.error("Error creando escuela:", err);
      setError(
        err.message ||
          "Ocurrió un problema al configurar tu escuela. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decoración de Fondo (Inmersión de marca heredada) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#10B981] rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#312E81] rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* Barra de Progreso Minimalista */}
        <div className="w-full mb-8 flex items-center justify-between text-sm font-bold max-w-md mx-auto">
          <div className="flex flex-col items-center gap-2 text-[#10B981]">
            <CheckCircle2 size={24} />
            <span className="text-xs uppercase tracking-widest">Cuenta</span>
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-[#10B981] to-[#312E81] mx-4 rounded-full"></div>
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="h-6 w-6 rounded-full bg-[#312E81] border-2 border-indigo-400 flex items-center justify-center text-xs shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              2
            </div>
            <span className="text-xs uppercase tracking-widest text-indigo-200">
              Escuela
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-800 mx-4 rounded-full"></div>
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="h-6 w-6 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs">
              3
            </div>
            <span className="text-xs uppercase tracking-widest">Listo</span>
          </div>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white w-full rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
          {/* Header de la Tarjeta */}
          <div className="bg-slate-50 border-b border-slate-100 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#10B981] rounded-b-full"></div>
            <Trophy className="mx-auto text-[#312E81] mb-4" size={32} />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Inaugura tu Escuela
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Configura el espacio de trabajo digital para tu club.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            {/* Sección: Datos Básicos */}
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="schoolName"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  Nombre Oficial de la Escuela
                </label>
                <input
                  id="schoolName"
                  type="text"
                  required
                  value={schoolData.name}
                  onChange={handleNameChange}
                  placeholder="Ej: Escuela de Fútbol Los Leones"
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all font-medium"
                />
              </div>

              <div>
                <label
                  htmlFor="schoolSlug"
                  className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"
                >
                  <Globe size={16} className="text-slate-400" /> Tu dirección
                  web única
                </label>
                <div className=" opacity-90 flex rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-[#312E81]/20 focus-within:border-[#312E81] focus-within:bg-white transition-all bg-slate-50 overflow-hidden">
                  <span className="inline-flex items-center px-4 border-r border-slate-200 text-slate-400 text-sm font-medium bg-slate-100/50 select-none">
                    lanovena.pro/
                  </span>
                  <input
                    disabled={true}
                    id="schoolSlug"
                    type="text"
                    required
                    value={schoolData.slug}
                    onChange={(e) =>
                      setSchoolData({
                        ...schoolData,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="flex-1 block w-full px-4 py-3.5 bg-transparent outline-none text-slate-400 font-medium placeholder-slate-300"
                    placeholder="los-leones"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Tus apoderados usarán este enlace para ver sus pagos y
                  perfiles.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Sección: Tipo de Administración (Accesible via Radio Buttons) */}
            {/*
            <fieldset>
              <legend className="block text-sm font-bold text-slate-700 mb-4">
                Modelo de Administración
              </legend>
              <div className="grid sm:grid-cols-2 gap-4">
           
                <label
                  className={`relative cursor-pointer rounded-2xl p-5 flex flex-col border-2 transition-all ${
                    schoolData.mode === "COMMERCIAL"
                      ? "border-[#10B981] bg-emerald-50/50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="COMMERCIAL"
                    className="sr-only"
                    checked={schoolData.mode === "COMMERCIAL"}
                    onChange={() =>
                      setSchoolData({ ...schoolData, mode: "COMMERCIAL" })
                    }
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${schoolData.mode === "COMMERCIAL" ? "bg-[#10B981] text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      <Building2 size={24} />
                    </div>
                    {schoolData.mode === "COMMERCIAL" && (
                      <CheckCircle2 className="text-[#10B981]" size={20} />
                    )}
                  </div>
                  <h3
                    className={`font-black text-lg ${schoolData.mode === "COMMERCIAL" ? "text-slate-900" : "text-slate-600"}`}
                  >
                    Privada
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                    Cobro de mensualidades, matrículas y control de morosidad.
                  </p>
                </label>

                <label
                  className={`relative cursor-pointer rounded-2xl p-5 flex flex-col border-2 transition-all ${
                    schoolData.mode === "INSTITUTIONAL"
                      ? "border-[#312E81] bg-indigo-50/50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="INSTITUTIONAL"
                    className="sr-only"
                    checked={schoolData.mode === "INSTITUTIONAL"}
                    onChange={() =>
                      setSchoolData({ ...schoolData, mode: "INSTITUTIONAL" })
                    }
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${schoolData.mode === "INSTITUTIONAL" ? "bg-[#312E81] text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      <GraduationCap size={24} />
                    </div>
                    {schoolData.mode === "INSTITUTIONAL" && (
                      <CheckCircle2 className="text-[#312E81]" size={20} />
                    )}
                  </div>
                  <h3
                    className={`font-black text-lg ${schoolData.mode === "INSTITUTIONAL" ? "text-slate-900" : "text-slate-600"}`}
                  >
                    Municipal u ONG
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                    100% Gratuito. Enfocado en asistencia y reportes sociales.
                  </p>
                </label>
              </div>
            </fieldset>
           */}

            {/* Manejo de Errores Inline */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle
                  size={20}
                  className="text-red-600 mt-0.5 flex-shrink-0"
                />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Acción Final */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl text-white bg-[#312E81] hover:bg-[#282566] focus:outline-none focus:ring-4 focus:ring-[#312E81]/30 font-black tracking-wide shadow-lg shadow-indigo-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 size={22} className="animate-spin" />
                    <span>Configurando entorno...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>{"Finalizar y Entrar al Panel"}</span>
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </div>
                )}
              </button>

              {schoolData.mode === "COMMERCIAL" && (
                <p className="text-center text-xs font-bold text-slate-400 mt-5 uppercase tracking-wider">
                  Siguiente paso: Configuration de tu primer escuela
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
