"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User, Phone } from "lucide-react";
import Cookies from "js-cookie";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// 1. Mutación de Registro
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
  const [error, setError] = useState("");

  // 2. Hook Apollo
  const [register, { loading }] = useMutation(REGISTER_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones Locales
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      // 3. Ejecutar Registro
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

      // 4. Guardar Token (Auto-Login)
      const { accessToken } = data.register;
      Cookies.set("token", accessToken, { expires: 7 });

      // 5. Redirigir al Onboarding (Paso siguiente obligatorio)
      router.push("/onboarding");
    } catch (err: any) {
      console.error(err);
      // Manejo de error específico (ej: email duplicado)
      if (err.message.includes("Unique constraint")) {
        setError("Este correo ya está registrado.");
      } else {
        setError(err.message || "Error al registrar.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* SECCIÓN VISUAL (Izquierda) */}
      <div className="hidden md:flex md:w-1/2 bg-novena-indigo relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-novena-green opacity-10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 max-w-lg text-center">
          <h2 className="text-4xl font-extrabold mb-6 tracking-tight">
            Profesionaliza tu <br />
            <span className="text-novena-green">Pasión por Formar</span>
          </h2>
          <p className="text-sm text-indigo-300">
            Únete a las escuelas líderes de la IX Región.
          </p>
        </div>
      </div>

      {/* SECCIÓN FORMULARIO (Derecha) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Crea tu Cuenta
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Primer paso para gestionar tu escuela
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Campos del Formulario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  placeholder="director@tuescuela.cl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  placeholder="+56 9 ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repetir
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-novena-green hover:bg-emerald-600 transition-all ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                "Creando cuenta..."
              ) : (
                <span className="flex items-center gap-2">
                  Continuar <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-novena-indigo hover:text-indigo-900 transition"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
