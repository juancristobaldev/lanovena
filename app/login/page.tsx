"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Cookies from "js-cookie";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        fullName
        role
        schoolId
      }
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data }: any = await login({
        variables: { input: { email, password } },
      });

      const { accessToken, user } = data?.login;

      Cookies.set("token", accessToken, { expires: 7 });
      Cookies.set("userRole", user.role);

      if (user.role === "SUPERADMIN") {
        router.push("/dashboard/director");
      } else if (user.role === "DIRECTOR") {
        router.push("/dashboard/director");
      } else {
        router.push("/dashboard/director");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        "Credenciales incorrectas. Por favor verifica tu correo y contraseña.",
      );
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. SECCIÓN IZQUIERDA (Inmersión de Marca - Heredado de la Landing) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F172A] overflow-hidden flex-col justify-between p-12 xl:p-20 text-white">
        {/* Decoración Gradiente */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#312E81] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10B981] rounded-full mix-blend-multiply filter blur-[100px] opacity-30"></div>

        {/* Imagen de fondo sutil (Opcional, mejora la inmersión) */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1200&auto=format&fit=crop"
            alt="Fondo Fútbol"
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[#10B981] text-xs font-bold uppercase tracking-wide mb-6 backdrop-blur-md">
            <ShieldCheck size={16} /> Acceso Seguro
          </div>
          <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-6">
            El centro de control de tu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-emerald-300">
              escuela.
            </span>
          </h2>
          <p className="text-lg text-slate-300 font-medium leading-relaxed">
            Ingresa a tu panel para gestionar pagos, actualizar asistencias y
            conectar con la comunidad de tu club en tiempo real.
          </p>
        </div>

        {/* Footer legal */}
        <div className="relative z-10 text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} Tecnologías Deportivas La Novena SpA.
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA (Formulario de Login) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-20 xl:px-32 bg-white relative">
        {/* Elemento decorativo móvil */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 lg:hidden -z-10"></div>

        <div className="w-full max-w-[420px] mx-auto space-y-8">
          {/* Header Móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
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
              Iniciar Sesión
            </h1>
            <p className="text-base text-slate-500 font-medium">
              Ingresa tus credenciales para acceder al sistema operativo.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all"
                  placeholder="director@escuela.cl"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-700"
                >
                  Contraseña
                </label>
                <Link
                  href="/auth/recovery"
                  className="text-sm font-bold text-[#312E81] hover:text-[#10B981] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#312E81] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-white bg-[#312E81] hover:bg-[#282566] focus:outline-none focus:ring-4 focus:ring-[#312E81]/30 font-black tracking-wide shadow-lg shadow-indigo-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 size={22} className="animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Ingresar a mi panel</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
              )}
            </button>
          </form>

          {/* Footer Registro */}
          <div className="pt-6 text-center border-t border-slate-100">
            <p className="text-base text-slate-500 font-medium">
              ¿Tu escuela aún no usa La Novena?{" "}
              <Link
                href="/register"
                className="font-black text-[#10B981] hover:text-emerald-600 transition-colors ml-1"
              >
                Crea una cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
