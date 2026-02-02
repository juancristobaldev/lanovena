"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  School,
  ChevronDown,
  Save,
  Building2,
  CreditCard,
  ShieldCheck,
  Globe,
  AlertTriangle,
  Lock,
  Unlock,
  UploadCloud,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";
import { PLANS } from "@/src/utils/plans";
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

  // State
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    bankDetails: "",
    logoUrl: "",
  });

  // --- ESCUELAS ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // @ts-ignore
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERY ---
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
  }, [data, loading]);

  // --- MUTATION ---
  const [updateSchool, { loading: saving }] = useMutation(UPDATE_SCHOOL);

  // --- HANDLERS ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;

    if (formState.slug.length < 3)
      return showAlert("La URL debe tener al menos 3 caracteres", "warning");

    try {
      await updateSchool({
        variables: {
          id: selectedSchoolId,
          input: {
            name: formState.name,
            slug: formState.slug,
            bankDetails: formState.bankDetails,
          },
        },
      });
      showAlert("Configuración guardada exitosamente", "success");
      setIsSlugLocked(true);
      refetch();
    } catch (error: any) {
      console.error(error);
      const msg = error.message.includes("Unique constraint")
        ? "Esa URL ya está en uso por otra escuela"
        : error.message;
      showAlert(msg, "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert("URL copiada al portapapeles", "success");
  };

  // --- RENDER ---
  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando configuración...
        </p>
      </div>
    );
  }

  const school = data?.school;
  const isCommercial = school?.mode === "COMMERCIAL";
  const fullUrl = `lanovena.cl/escuelas/${formState.slug}`;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            Configuración General
          </h1>
          <p className="text-gray-500 text-lg">
            Administra la identidad pública y los datos operativos.
          </p>
        </div>

        {availableSchools.length > 0 && (
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 min-w-[200px]">
            <div className="bg-indigo-50 p-2 rounded-lg">
              <School className="w-4 h-4 text-[#312E81]" />
            </div>
            <div className="relative flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Escuela
              </span>
              {availableSchools.length > 1 ? (
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="bg-transparent font-bold text-[#312E81] text-sm outline-none w-full appearance-none cursor-pointer"
                >
                  {availableSchools.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-bold text-[#312E81] text-sm block truncate">
                  {availableSchools[0].name}
                </span>
              )}
            </div>
            {availableSchools.length > 1 && (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* === COLUMNA PRINCIPAL (FORMULARIOS) === */}
          <div className="lg:col-span-2 space-y-8">
            {/* CARD: IDENTIDAD */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-[#312E81] rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Identidad de la Escuela
                  </h3>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                  ID: {school?.id.substring(0, 8)}...
                </span>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Logo Placeholder */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                    {formState.logoUrl ? (
                      <img
                        src={formState.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <School size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Logotipo Oficial
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Se usará en los carnets digitales y en el portal de
                      apoderados.
                    </p>
                    <button
                      type="button"
                      disabled
                      className="text-xs font-bold text-[#312E81] bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed"
                    >
                      <UploadCloud size={14} /> Subir Imagen (Pronto)
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nombre del Club / Escuela
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none transition-all"
                    placeholder="Ej: Club Deportivo Los Leones"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">
                      URL Personalizada
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSlugLocked(!isSlugLocked)}
                      className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors ${
                        isSlugLocked
                          ? "text-gray-500 hover:bg-gray-100"
                          : "text-amber-600 bg-amber-50"
                      }`}
                    >
                      {isSlugLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      {isSlugLocked
                        ? "Desbloquear edición"
                        : "Edición habilitada"}
                    </button>
                  </div>

                  <div
                    className={`flex items-center border rounded-xl overflow-hidden transition-all ${
                      isSlugLocked
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-amber-300 ring-4 ring-amber-50"
                    }`}
                  >
                    <div className="bg-gray-100 px-4 py-3 border-r border-gray-200 text-gray-500 text-sm font-medium select-none">
                      lanovena.cl/escuelas/
                    </div>
                    <input
                      type="text"
                      disabled={isSlugLocked}
                      value={formState.slug}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-"),
                        })
                      }
                      className={`w-full px-4 py-3 text-sm font-mono outline-none bg-transparent ${
                        isSlugLocked
                          ? "text-gray-500 cursor-not-allowed"
                          : "text-[#312E81] font-bold"
                      }`}
                    />
                    {isSlugLocked && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fullUrl)}
                        className="p-3 text-gray-400 hover:text-[#312E81] hover:bg-gray-200 transition-colors border-l border-gray-200"
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </div>

                  {!isSlugLocked && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>
                        <strong>¡Cuidado!</strong> Cambiar la URL hará que los
                        códigos QR impresos anteriormente dejen de funcionar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CARD: BANCO (Condicional) */}
            {isCommercial ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Datos de Transferencia
                  </h3>
                </div>
                <div className="p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">
                        Información Bancaria
                      </label>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Datos para que los apoderados transfieran manualmente.
                      </p>
                      <textarea
                        rows={5}
                        value={formState.bankDetails}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            bankDetails: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono resize-none bg-gray-50 focus:bg-white transition-colors"
                        placeholder={`Banco:\nTipo de Cuenta:\nNúmero:\nRUT:\nEmail:`}
                      />
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white shadow-xl flex flex-col justify-between min-h-[180px]">
                      <div className="flex justify-between items-start opacity-50">
                        <CreditCard size={24} />
                        <span className="text-xs font-mono uppercase tracking-widest">
                          Vista Previa
                        </span>
                      </div>
                      <div className="space-y-1 font-mono text-xs text-gray-300 overflow-hidden">
                        {formState.bankDetails ? (
                          formState.bankDetails
                            .split("\n")
                            .slice(0, 5)
                            .map((line, i) => (
                              <p key={i} className="truncate">
                                {line}
                              </p>
                            ))
                        ) : (
                          <>
                            <p>Banco: ---</p>
                            <p>Cuenta: ---</p>
                            <p>RUT: ---</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-2 bg-gray-200 text-gray-500 rounded-lg shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-600">
                    Módulo Financiero Desactivado
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-lg">
                    Tu escuela está en modo <strong>INSTITUTIONAL</strong>. Las
                    funciones de cobranza y datos bancarios están ocultas.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#312E81] hover:bg-indigo-800 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Guardar Configuración
              </button>
            </div>
          </div>

          {/* === COLUMNA LATERAL (INFO REAL USANDO PLANS) === */}
          <div className="space-y-6">
            {/* PLAN CARD LOGIC */}
            {(() => {
              // 1. Obtener configuración del plan actual desde la constante global PLANS
              const currentPlanType = school?.planType || "SEMILLERO";
              const planConfig =
                PLANS.find((p) => p.id === currentPlanType) || PLANS[0];

              // 2. Datos actuales
              const currentPlayers = school?._count?.players || 0;
              const currentCoaches = school?._count?.coaches || 0;

              // 3. Helpers para límites
              const parseLimit = (val: number | string) =>
                val === "Ilimitados" || val === "Ilimitadas"
                  ? Infinity
                  : Number(val);
              const maxPlayers = parseLimit(planConfig.limits.players);
              const maxCoaches = parseLimit(planConfig.limits.coaches);

              // 4. Cálculo de porcentajes
              const calculatePercent = (current: number, max: number) => {
                if (max === Infinity) return 5; // Muestra un 5% visual si es ilimitado
                return Math.min(Math.round((current / max) * 100), 100);
              };

              const playerPercent = calculatePercent(
                currentPlayers,
                maxPlayers,
              );
              const coachPercent = calculatePercent(currentCoaches, maxCoaches);

              return (
                <div className="bg-[#312E81] rounded-2xl shadow-xl text-white overflow-hidden relative">
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 scale-150 pointer-events-none">
                    <ShieldCheck size={180} />
                  </div>

                  <div className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">
                          Tu Suscripción
                        </p>
                        <h2 className="text-2xl font-black">
                          {planConfig.name}
                        </h2>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border ${
                          school?.subscriptionStatus === "ACTIVE"
                            ? "bg-emerald-500 text-white border-emerald-400"
                            : "bg-amber-500 text-white border-amber-400"
                        }`}
                      >
                        {school?.subscriptionStatus === "ACTIVE"
                          ? "ACTIVO"
                          : "PENDIENTE"}
                      </span>
                    </div>

                    <div className="space-y-5 mb-8">
                      {/* Barra Progreso Jugadores */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-indigo-200">
                            Jugadores Matriculados
                          </span>
                          <span className="font-bold">
                            {currentPlayers} /{" "}
                            {maxPlayers === Infinity ? "∞" : maxPlayers}
                          </span>
                        </div>
                        <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden border border-indigo-500/30">
                          <div
                            className={`h-full transition-all duration-1000 ease-out ${
                              maxPlayers === Infinity
                                ? "bg-emerald-400"
                                : playerPercent > 90
                                  ? "bg-red-400"
                                  : playerPercent > 75
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                            }`}
                            style={{ width: `${playerPercent}%` }}
                          ></div>
                        </div>
                        {maxPlayers !== Infinity && playerPercent >= 90 && (
                          <p className="text-[10px] text-amber-300 mt-1">
                            ⚠️ Estás llegando al límite de tu plan.
                          </p>
                        )}
                      </div>

                      {/* Barra Progreso Staff */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-indigo-200">Staff Técnico</span>
                          <span className="font-bold">
                            {currentCoaches} /{" "}
                            {maxCoaches === Infinity ? "∞" : maxCoaches}
                          </span>
                        </div>
                        <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden border border-indigo-500/30">
                          <div
                            className="h-full bg-blue-400 transition-all duration-1000 ease-out"
                            style={{ width: `${coachPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 size={16} />
                      {maxPlayers === Infinity
                        ? "Ver detalles del Plan"
                        : "Mejorar Plan"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* SUPPORT CARD */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" /> Soporte Técnico
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                ¿Necesitas cambiar el modo de la escuela (Comercial /
                Institucional) o reportar un problema?
              </p>
              <a
                href="mailto:soporte@lanovena.cl"
                className="text-sm font-bold text-[#312E81] hover:underline flex items-center gap-1"
              >
                soporte@lanovena.cl
              </a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
