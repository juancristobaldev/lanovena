"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import Cookies from "js-cookie";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        role
      }
    }
  }
`;

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Estados para UX
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [register, { loading }] = useMutation(REGISTER_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor, verifícalas.");
      return;
    }

    try {
      const { data }: any = await register({
        variables: {
          input: {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
          },
        },
      });

      const { accessToken } = data.register;
      Cookies.set("token", accessToken, { expires: 7 });

      router.push("/onboarding");
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Unique constraint")) {
        setError(
          "Este correo electrónico ya está registrado en nuestro sistema.",
        );
      } else {
        setError(
          err.message ||
            "Ocurrió un error al crear tu cuenta. Intenta nuevamente.",
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. SECCIÓN IZQUIERDA (Inmersión de Marca) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F172A] overflow-hidden flex-col justify-between p-12 xl:p-20 text-white">
        {/* Decoración Gradiente */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#312E81] rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>

        {/* Imagen de fondo sutil */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop"
            alt="Canchas del Sur"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent"></div>
        </div>

        {/* Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-[#312E81] rounded-xl flex items-center justify-center shadow-lg border border-indigo-500/30">
            <span className="font-black text-2xl italic text-[#10B981]">
              IX
            </span>
          </div>
          <span className="font-black text-2xl tracking-tight text-white">
            La Novena
          </span>
        </div>

        {/* Mensaje de Valor */}
        <div className="relative z-10 max-w-lg mb-10 xl:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-yellow-400 text-xs font-bold uppercase tracking-wide mb-6 backdrop-blur-md">
            <Trophy size={16} /> Únete a los mejores
          </div>
          <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-6">
            Profesionaliza tu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-emerald-300">
              pasión por formar.
            </span>
          </h2>
          <p className="text-lg text-slate-300 font-medium leading-relaxed">
            Crea tu cuenta hoy y comienza a estructurar los pagos, asistencias y
            la comunicación de tu escuela de fútbol en minutos.
          </p>
        </div>

        {/* Footer legal */}
        <div className="relative z-10 text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} Tecnologías Deportivas La Novena SpA.
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA (Formulario de Registro) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-20 xl:px-32 bg-white relative overflow-y-auto py-12">
        {/* Elemento decorativo móvil */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 lg:hidden -z-10"></div>

        <div className="w-full max-w-[420px] mx-auto space-y-8">
          {/* Header Móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#312E81] rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-black text-xl italic text-[#10B981]">
                IX
              </span>
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">
              La Novena
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Crea tu Cuenta
            </h1>
            <p className="text-base text-slate-500 font-medium">
              El primer paso para transformar la gestión de tu club.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Input Nombre */}
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="block text-sm font-bold text-slate-700"
              >
                Nombre Completo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#312E81] transition-colors">
                  <User size={20} />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700"
              >
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#312E81] transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all"
                  placeholder="director@tuescuela.cl"
                />
              </div>
            </div>

            {/* Input Teléfono */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-bold text-slate-700"
              >
                Teléfono Móvil
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#312E81] transition-colors">
                  <Phone size={20} />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            {/* Inputs Contraseñas (Apilados para mejor respiro visual) */}
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-700"
                >
                  Crea una Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#312E81] transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:text-[#312E81]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-slate-700"
                >
                  Confirma tu Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#312E81] transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:text-[#312E81]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle
                  size={20}
                  className="text-red-600 mt-0.5 flex-shrink-0"
                />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Botón de Acción */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-white bg-[#10B981] hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-[#10B981]/30 font-black tracking-wide shadow-lg shadow-emerald-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 size={22} className="animate-spin" />
                  <span>Configurando cuenta...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Comenzar ahora</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
              )}
            </button>
          </form>

          {/* Footer Login */}
          <div className="pt-6 text-center border-t border-slate-100">
            <p className="text-base text-slate-500 font-medium">
              ¿Ya gestionas tu escuela aquí?{" "}
              <Link
                href="/login"
                className="font-black text-[#312E81] hover:text-indigo-900 transition-colors ml-1"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
