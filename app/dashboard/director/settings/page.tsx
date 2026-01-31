"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  School,
  ChevronDown,
  Save,
  Building,
  CreditCard,
  ShieldCheck,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// === GRAPHQL OPERATIONS ===

const GET_SCHOOL_SETTINGS = gql`
  query GetSchoolSettings($schoolId: ID!) {
    school(id: $schoolId) {
      id
      name
      slug
      logoUrl
      mode
      bankDetails
      planType
      subscriptionStatus
      _count {
        players
        coaches
      }
    }
  }
`;

const UPDATE_SCHOOL = gql`
  mutation UpdateSchool($id: ID!, $input: UpdateSchoolInput!) {
    updateSchool(id: $id, input: $input) {
      id
      name
      bankDetails
      slug
    }
  }
`;

export default function SettingsPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();

  // Estados
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // Form State
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    bankDetails: "",
    logoUrl: "",
  });

  // --- SELECCIÓN DE ESCUELA ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // @ts-ignore
    return user.schools || (user.school ? [user.school] : []);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERIES ---
  const { data, loading, refetch }: any = useQuery(GET_SCHOOL_SETTINGS, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (data?.school && !loading) {
      setFormState({
        name: data.school.name || "",
        slug: data.school.slug || "",
        bankDetails: data.school.bankDetails || "",
        logoUrl: data.school.logoUrl || "",
      });
    }
  }, [data]);

  // --- MUTATIONS ---
  const [updateSchool, { loading: saving }] = useMutation(UPDATE_SCHOOL);

  // --- HANDLERS ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;

    try {
      await updateSchool({
        variables: {
          id: selectedSchoolId,
          input: {
            name: formState.name,
            slug: formState.slug, // Nota: Cambiar el slug puede romper links existentes
            bankDetails: formState.bankDetails,
            // logoUrl: formState.logoUrl // Habilitar si implementas upload de imágenes
          },
        },
      });
      showAlert("Configuración actualizada correctamente", "success");
      refetch();
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al guardar cambios", "error");
    }
  };

  // --- RENDER HELPERS ---
  if (userLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-indigo-900" />
      </div>
    );

  const school = data?.school;
  const isCommercial = school?.mode === "COMMERCIAL";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Configuración</h1>
          <p className="text-gray-600">
            Administra la identidad y datos operativos de tu escuela.
          </p>
        </div>

        {availableSchools.length > 1 && (
          <div className="relative group bg-white border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
            <School className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold text-indigo-900 cursor-pointer appearance-none pr-6"
            >
              {availableSchools.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* COLUMNA IZQUIERDA: GENERAL */}
          <div className="lg:col-span-2 space-y-6">
            {/* TARJETA: IDENTIDAD */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-900">
                  Identidad de la Escuela
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nombre Oficial
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: Escuela de Fútbol Los Leones"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    URL Personalizada (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-gray-500 text-sm">
                      lanovena.cl/escuelas/
                    </span>
                    <input
                      type="text"
                      value={formState.slug}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        })
                      }
                      className="w-full border border-gray-300 rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm text-indigo-700"
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Advertencia: Cambiar esto invalidará los códigos QR
                    antiguos.
                  </p>
                </div>
              </div>
            </div>

            {/* TARJETA: FINANZAS (Solo Comercial) */}
            {isCommercial ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">
                    Datos Bancarios (Para Apoderados)
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                    <p className="text-xs text-blue-800">
                      Esta información aparecerá en el portal de los apoderados
                      cuando seleccionen "Pagar con Transferencia".
                    </p>
                  </div>
                  <textarea
                    rows={5}
                    value={formState.bankDetails}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        bankDetails: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                    placeholder={`Banco: Banco Estado\nCuenta: Vista/RUT\nN°: 12345678\nNombre: Club Deportivo...\nEmail: pagos@lanovena.cl`}
                  />
                </div>
              </div>
            ) : (
              // Mensaje para Institucional
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-start gap-4 opacity-75">
                <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-600">
                    Configuración Financiera Desactivada
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tu escuela está en modo <strong>INSTITUTIONAL</strong>. Las
                    funciones de cobranza y datos bancarios no son necesarias.
                  </p>
                </div>
              </div>
            )}

            {/* BOTÓN GUARDAR */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-900 hover:bg-indigo-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: PLAN Y ESTADO */}
          <div className="space-y-6">
            {/* TARJETA: PLAN */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
                  Plan Actual
                </p>
                <h2 className="text-2xl font-bold mb-4">
                  {school?.planType?.replace("_", " ") || "GRATUITO"}
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm border-b border-indigo-700 pb-2">
                    <span className="text-indigo-200">Jugadores</span>
                    <span className="font-bold">
                      {school?._count?.players || 0} / --
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-indigo-700 pb-2">
                    <span className="text-indigo-200">Entrenadores</span>
                    <span className="font-bold">
                      {school?._count?.coaches || 0} / --
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-200">Estado</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/50">
                      {school?.subscriptionStatus || "ACTIVO"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors border border-white/20"
                >
                  Mejorar Plan
                </button>
              </div>
            </div>

            {/* TARJETA: AYUDA */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Si necesitas cambiar el Logo, el Modo de la escuela
                (Comercial/Institucional) o tienes problemas técnicos.
              </p>
              <a
                href="mailto:soporte@lanovena.cl"
                className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                Contactar a Soporte <Globe className="w-3 h-3" />
              </a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
