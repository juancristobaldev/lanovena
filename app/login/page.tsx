"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Cookies from "js-cookie";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";

// 2. Definición de la Mutación
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        fullName
        role
        schoolId # Importante para saber dónde redirigir
      }
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 3. Hook de Apollo
  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 4. Ejecutar Login
      const { data }: any = await login({
        variables: {
          input: { email, password },
        },
      });

      const { accessToken, user } = data?.login;

      // 5. Guardar Token
      Cookies.set("token", accessToken, { expires: 7 }); // Expira en 7 días
      Cookies.set("userRole", user.role); // Útil para middleware (opcional)

      // 6. Redirección Inteligente
      if (user.role === "SUPERADMIN") {
        router.push("/admin/dashboard");
      } else if (!user.schoolId) {
        // Si no tiene escuela, debe crearla
        router.push("/onboarding");
      } else {
        // Flujo normal
        router.push("/dashboard/director");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Credenciales inválidas.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* SECCIÓN VISUAL (Izquierda) */}
      <div className="hidden md:flex md:w-1/2 bg-indigoix relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg- opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        <div className="relative z-10 max-w-md text-center">
          <h2 className="text-4xl font-extrabold mb-6 tracking-tight">
            IX <span className="text-novena-green">LA NOVENA</span>
          </h2>
          <p className="text-lg text-indigo-100 mb-8 leading-relaxed">
            La plataforma integral para profesionalizar tu escuela de fútbol.
          </p>
        </div>
      </div>

      {/* SECCIÓN FORMULARIO (Derecha) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Ingresa a tu panel de control
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  placeholder="director@escuela.cl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-novena-indigo hover:bg-indigo-900 transition-all ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                "Ingresando..."
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar al Portal <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-novena-green hover:text-emerald-600 transition"
            >
              Registra tu escuela aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
