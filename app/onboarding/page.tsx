"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client"; // 1. Importamos Apollo
import {
  Building2,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Cookies from "js-cookie";
import { useMutation } from "@apollo/client/react";

// 2. Definición de la Mutación
const CREATE_SCHOOL_MUTATION = gql`
  mutation CreateSchool($input: CreateSchoolInput!) {
    createSchool(input: $input) {
      id
      name
      slug
      mode
      # Importante: Si tu backend devuelve un nuevo token con el schoolId actualizado, pídelo aquí.
      # Si no, tendrás que refrescar el usuario o reloguear silenciosamente.
    }
  }
`;

// Si tu backend tiene un endpoint 'refreshToken' o 'me', úsalo para actualizar el contexto.
// Por ahora asumiremos que el backend vincula la escuela al usuario actual automáticamente.

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Hook de Apollo
  const [createSchool] = useMutation(CREATE_SCHOOL_MUTATION);

  const [schoolData, setSchoolData] = useState({
    name: "",
    slug: "",
    mode: "COMMERCIAL",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    setSchoolData({ ...schoolData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 3. Ejecutar la mutación real
      const { data } = await createSchool({
        variables: {
          input: {
            name: schoolData.name,
            slug: schoolData.slug,
            mode: schoolData.mode, // "COMMERCIAL" o "INSTITUTIONAL"
            // address: "", // Agrega campos opcionales si tu input los requiere
            // phone: "",
            // 👇 AGREGA ESTA LÍNEA
            subscriptionStatus:
              schoolData.mode === "INSTITUTIONAL" ? "ACTIVE" : "PENDING",
          },
        },
      });

      // Opcional: Forzar recarga del usuario para que el nuevo token/contexto traiga el schoolId
      // await client.refetchQueries({ include: ['Me'] });

      // 4. Lógica de Redirección
      if (schoolData.mode === "COMMERCIAL") {
        // Redirigir al flujo de pago
        router.push("/dashboard/director/subscription?onboarding=true");
      } else {
        // Redirigir al dashboard (ya que es gratis/institucional)
        // Usamos window.location.href para forzar un refresh completo y que el Apollo Client
        // actualice los headers/contexto si es necesario.
        window.location.href = "/dashboard/director";
      }
    } catch (error: any) {
      console.error("Error creando escuela:", error);
      alert("Error al crear la escuela: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Barra de Progreso */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between text-sm font-medium text-gray-500">
        <div className="flex items-center gap-2 text-novena-green">
          <CheckCircle2 className="h-5 w-5" /> Registro
        </div>
        <div className="h-0.5 w-16 bg-novena-green"></div>
        <div className="flex items-center gap-2 text-novena-indigo">
          <div className="h-5 w-5 rounded-full bg-novena-indigo text-white flex items-center justify-center text-xs">
            2
          </div>
          Datos de Escuela
        </div>
        <div className="h-0.5 w-16 bg-gray-300"></div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-xs">
            3
          </div>
          {schoolData.mode === "COMMERCIAL" ? "Suscripción" : "Listo"}
        </div>
      </div>

      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-novena-indigo p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            Configura tu Escuela
          </h1>
          <p className="text-indigo-200 mt-2">
            Personaliza tu espacio en La Novena
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Nombre y URL */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Oficial de la Escuela
              </label>
              <input
                type="text"
                required
                value={schoolData.name}
                onChange={handleNameChange}
                placeholder="Ej: Escuela de Fútbol Los Leones"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-novena-green outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu dirección web (Slug)
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  lanovena.pro/
                </span>
                <input
                  type="text"
                  required
                  value={schoolData.slug}
                  onChange={(e) =>
                    setSchoolData({ ...schoolData, slug: e.target.value })
                  }
                  className="flex-1 block w-full px-4 py-3 border border-gray-300 rounded-none rounded-r-lg focus:ring-2 focus:ring-novena-green outline-none"
                />
              </div>
            </div>
          </div>

          {/* Selección de Modo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Administración
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div
                onClick={() =>
                  setSchoolData({ ...schoolData, mode: "COMMERCIAL" })
                }
                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all ${
                  schoolData.mode === "COMMERCIAL"
                    ? "border-novena-green bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`p-3 rounded-full mb-3 ${schoolData.mode === "COMMERCIAL" ? "bg-novena-green text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Academia Privada</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Cobros mensuales y gestión financiera.
                </p>
              </div>

              <div
                onClick={() =>
                  setSchoolData({ ...schoolData, mode: "INSTITUTIONAL" })
                }
                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all ${
                  schoolData.mode === "INSTITUTIONAL"
                    ? "border-novena-indigo bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`p-3 rounded-full mb-3 ${schoolData.mode === "INSTITUTIONAL" ? "bg-novena-indigo text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Municipal / ONG</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Gratuito. Enfoque en asistencia.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-novena-indigo hover:bg-indigo-900 transition-all transform hover:scale-[1.02] ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                "Creando Escuela..."
              ) : (
                <span className="flex items-center gap-2">
                  {schoolData.mode === "COMMERCIAL"
                    ? "Guardar e Ir al Pago"
                    : "Finalizar y Entrar"}
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </button>

            {schoolData.mode === "COMMERCIAL" && (
              <p className="text-center text-xs text-gray-400 mt-4">
                * Serás redirigido a Flow para activar tu suscripción.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
