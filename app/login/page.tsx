"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Cookies from "js-cookie";

// Importamos los iconos de Lucide React
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

// --- GRAPHQL ---
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

  // Estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Apollo Hook
  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data }: any = await login({
        variables: { input: { email, password } },
      });

      const { accessToken, user } = data?.login;

      // Guardar sesión
      Cookies.set("token", accessToken, { expires: 7 });
      Cookies.set("userRole", user.role);

      // Redirección por Rol
      if (user.role === "SUPERADMIN") {
        router.push("/admin/dashboard");
      } else if (!user.schoolId) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard/director");
      }
    } catch (err: any) {
      console.error(err);
      setError("Credenciales incorrectas. Por favor intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      {/* 1. SECCIÓN IZQUIERDA (Branding & Identidad) */}
      <div className="hidden lg:flex w-1/2 bg-[#312E81] relative overflow-hidden flex-col justify-between p-16 text-white">
        {/* Patrón de Fondo sutil */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Decoración Gradiente (Efecto 'Glow') */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4338CA] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10B981] rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

        {/* Logo */}
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            IX <span className="text-[#10B981]">LA NOVENA</span>
          </h2>
        </div>

        {/* Mensaje de Valor */}
        <div className="relative z-10 max-w-lg">
          <blockquote className="text-2xl font-medium leading-relaxed mb-6">
            "La plataforma que profesionaliza el fútbol formativo en el sur de
            Chile."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-[#10B981] rounded-full"></div>
            <p className="text-indigo-200 text-sm">
              Gestión · Pagos · Rendimiento
            </p>
          </div>
        </div>

        {/* Footer legal */}
        <div className="relative z-10 text-indigo-300 text-xs">
          © {new Date().getFullYear()} La Novena SaaS. Todos los derechos
          reservados.
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA (Formulario) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-gray-50 lg:bg-white">
        <div className="w-full max-w-sm space-y-8">
          {/* Header Móvil (Logo visible solo en móvil) */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-3xl font-extrabold text-[#312E81]">
              IX LA NOVENA
            </h2>
          </div>

          {/* Título Formulario */}
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              ¡Bienvenido de vuelta!
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#312E81] transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:border-transparent transition-all shadow-sm"
                  placeholder="director@escuela.cl"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link
                  href="/auth/recovery"
                  className="text-xs font-medium text-[#312E81] hover:text-[#10B981] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#312E81] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  tabIndex={-1} // Evita que el tabulador se detenga en el ojo antes del submit
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-pulse">
                <AlertCircle
                  size={20}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Botón de Acción */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white bg-[#312E81] hover:bg-[#282566] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#312E81] font-bold shadow-lg shadow-indigo-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Validando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Ingresar al Portal</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </div>
              )}
            </button>
          </form>

          {/* Footer Registro */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿Quieres usar La Novena en tu escuela?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
              >
                Solicita una demo
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
