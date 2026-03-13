"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  School,
  Save,
  Building2,
  CreditCard,
  ShieldCheck,
  Globe,
  AlertTriangle,
  Lock,
  Unlock,
  UploadCloud,
  Copy,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";
import { PLANS } from "@/src/utils/plans";

const GET_SCHOOL_SETTINGS = gql`
  query GetSchoolSettings($schoolId: String!) {
    getSettings(schoolId: $schoolId) {
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

  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    bankDetails: "",
    logoUrl: "",
  });

  // Derivamos la escuela activa (heredado silenciosamente del Layout)
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const { data, loading, refetch }: any = useQuery(GET_SCHOOL_SETTINGS, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    const school = data?.getSettings;
    console.log({ school });
    if (school && !loading) {
      setFormState({
        name: school.name || "",
        slug: school.slug || "",
        bankDetails: school.bankDetails || "",
        logoUrl: school.logoUrl || "",
      });
    }
  }, [data, loading]);

  const [updateSchool, { loading: saving }] = useMutation(UPDATE_SCHOOL);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchoolId) return;

    if (formState.slug.length < 3) {
      return showAlert("La URL debe tener al menos 3 caracteres", "warning");
    }

    try {
      await updateSchool({
        variables: {
          id: activeSchoolId,
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
      const msg = error.message.includes("Unique constraint")
        ? "Esa URL ya está en uso por otra escuela. Intenta con otra."
        : error.message;
      showAlert(msg, "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert("URL copiada al portapapeles", "success");
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-medium animate-pulse">
          Cargando configuración...
        </p>
      </div>
    );
  }

  const school = data?.getSettings;
  const isCommercial = school?.mode === "COMMERCIAL";
  const fullUrl = `lanovena.cl/escuelas/${formState.slug}`;

  // Lógica de Planes
  const currentPlanType = school?.planType || "SEMILLERO";
  const planConfig = PLANS.find((p) => p.id === currentPlanType) || PLANS[0];
  const currentPlayers = school?._count?.players || 0;
  const currentCoaches = school?._count?.coaches || 0;

  const parseLimit = (val: number | string) =>
    val === "Ilimitados" || val === "Ilimitadas" ? Infinity : Number(val);
  const maxPlayers = parseLimit(planConfig.limits.players);
  const maxCoaches = parseLimit(planConfig.limits.coaches);

  const calculatePercent = (current: number, max: number) =>
    max === Infinity ? 5 : Math.min(Math.round((current / max) * 100), 100);
  const playerPercent = calculatePercent(currentPlayers, maxPlayers);
  const coachPercent = calculatePercent(currentCoaches, maxCoaches);

  return (
    <div className="space-y-8 animate-fade-in">
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
      >
        {/* === COLUMNA IZQUIERDA: FORMULARIOS === */}
        <div className="xl:col-span-2 space-y-8">
          {/* Tarjeta: Identidad Visual */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl border border-indigo-100">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    Identidad de la Escuela
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Datos públicos y presentación gráfica.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                ID: {school?.id.substring(0, 8)}
              </span>
            </div>

            <div className="p-8 space-y-8">
              {/* Logo Upload (Mock) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-24 h-24 rounded-[1.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden relative group">
                  {formState.logoUrl ? (
                    <img
                      src={formState.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <School size={32} />
                  )}
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud size={24} className="text-[#312E81]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">
                    Escudo / Logotipo Oficial
                  </label>
                  <p className="text-sm text-slate-500 mb-4 max-w-md">
                    Visible en carnets digitales y portal de apoderados. Formato
                    cuadrado recomendado.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 cursor-not-allowed"
                  >
                    <UploadCloud size={16} /> Próximamente
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              {/* Formulario Nombres y URL */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre del Club
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all shadow-sm"
                    placeholder="Ej: Club Deportivo Los Leones"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">
                      URL del Portal de Apoderados
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSlugLocked(!isSlugLocked)}
                      className={`text-xs flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition-colors ${
                        isSlugLocked
                          ? "text-slate-500 hover:bg-slate-100"
                          : "text-amber-700 bg-amber-100 border border-amber-200"
                      }`}
                    >
                      {isSlugLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      {isSlugLocked ? "Modificar enlace" : "Edición habilitada"}
                    </button>
                  </div>

                  <div
                    className={`flex items-stretch border rounded-xl overflow-hidden transition-all shadow-sm ${
                      isSlugLocked
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white border-amber-300 ring-4 ring-amber-50"
                    }`}
                  >
                    <div className="bg-slate-100 px-4 py-3.5 border-r border-slate-200 text-slate-500 text-sm font-medium select-none flex items-center">
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
                      className={`w-full px-4 py-3.5 text-sm font-mono outline-none bg-transparent ${
                        isSlugLocked
                          ? "text-slate-500 cursor-not-allowed"
                          : "text-[#312E81] font-bold"
                      }`}
                    />
                    {isSlugLocked && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fullUrl)}
                        className="px-4 text-slate-400 hover:text-[#312E81] hover:bg-indigo-50 transition-colors border-l border-slate-200 flex items-center justify-center"
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </div>

                  {!isSlugLocked && (
                    <div className="mt-3 flex items-start gap-3 text-xs text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="font-black">Atención:</strong> Si
                        cambias tu URL, los códigos QR que ya hayas impreso o
                        compartido dejarán de funcionar. Hazlo con precaución.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta: Banco (Modo Comercial) */}
          {isCommercial ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-[#10B981] rounded-xl border border-emerald-100">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    Finanzas y Cobranza
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Datos para pagos de apoderados.
                  </p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">
                      Información de Transferencia
                    </label>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                      Estos datos aparecerán en la App de los apoderados cuando
                      su semáforo de pagos esté en rojo.
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
                      className="w-full border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none font-mono resize-none bg-slate-50 focus:bg-white transition-all shadow-sm leading-relaxed"
                      placeholder={`Banco: Estado\nTipo: Cuenta RUT\nNúmero: 12345678\nRUT: 12.345.678-9\nCorreo: pagos@club.cl`}
                    />
                  </div>

                  {/* Vista Previa Móvil (Vibe Landing) */}
                  <div className="bg-gradient-to-br from-slate-900 to-[#312E81] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-center opacity-70 mb-4 relative z-10">
                      <CreditCard size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                        Vista Apoderado
                      </span>
                    </div>
                    <div className="space-y-1.5 font-mono text-sm text-indigo-100 relative z-10">
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
                        <div className="opacity-50 space-y-2">
                          <p>Banco: ---</p>
                          <p>Cuenta: ---</p>
                          <p>RUT: ---</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 flex items-start gap-5">
              <div className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm shrink-0 border border-slate-100">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Módulo Financiero Oculto
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  El sistema opera en modo{" "}
                  <strong className="text-slate-700">
                    Institucional / Municipal
                  </strong>
                  . Las funciones de cobranza, deudas y datos bancarios están
                  desactivadas para toda la comunidad.
                </p>
              </div>
            </div>
          )}

          {/* Botón Flotante/Sticky de Guardar */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#312E81] hover:bg-indigo-900 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* === COLUMNA DERECHA: INFO Y SOPORTE === */}
        <div className="space-y-6">
          {/* Tarjeta de Suscripción */}
          <div className="bg-gradient-to-br from-[#312E81] to-slate-900 rounded-[2rem] shadow-xl text-white overflow-hidden relative border border-indigo-800">
            <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 scale-150 pointer-events-none">
              <ShieldCheck size={180} />
            </div>

            <div className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Plan Contratado
                  </p>
                  <h2 className="text-3xl font-black tracking-tight">
                    {planConfig.name}
                  </h2>
                </div>
                <span
                  className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg shadow-sm border ${
                    school?.subscriptionStatus === "ACTIVE"
                      ? "bg-[#10B981] text-white border-emerald-400"
                      : "bg-amber-500 text-white border-amber-400"
                  }`}
                >
                  {school?.subscriptionStatus === "ACTIVE"
                    ? "Al día"
                    : "Pendiente"}
                </span>
              </div>

              <div className="space-y-6 mb-10">
                {/* Progreso Jugadores */}
                <div>
                  <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-indigo-200">
                      Matrículas Utilizadas
                    </span>
                    <span className="font-bold bg-white/10 px-2 py-0.5 rounded">
                      {currentPlayers} /{" "}
                      {maxPlayers === Infinity ? "∞" : maxPlayers}
                    </span>
                  </div>
                  <div className="h-2.5 bg-indigo-950/50 rounded-full overflow-hidden border border-indigo-800/50">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${
                        maxPlayers === Infinity
                          ? "bg-[#10B981]"
                          : playerPercent > 90
                            ? "bg-red-400"
                            : playerPercent > 75
                              ? "bg-amber-400"
                              : "bg-[#10B981]"
                      }`}
                      style={{ width: `${playerPercent}%` }}
                    ></div>
                  </div>
                  {maxPlayers !== Infinity && playerPercent >= 90 && (
                    <p className="text-[10px] text-red-300 mt-2 font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> Límite de capacidad cercano.
                    </p>
                  )}
                </div>

                {/* Progreso Profesores */}
                <div>
                  <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-indigo-200">Profesores / Staff</span>
                    <span className="font-bold bg-white/10 px-2 py-0.5 rounded">
                      {currentCoaches} /{" "}
                      {maxCoaches === Infinity ? "∞" : maxCoaches}
                    </span>
                  </div>
                  <div className="h-2.5 bg-indigo-950/50 rounded-full overflow-hidden border border-indigo-800/50">
                    <div
                      className="h-full bg-blue-400 transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${coachPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {maxPlayers === Infinity ? (
                  <>
                    <CheckCircle2 size={18} /> Plan Élite Activo
                  </>
                ) : (
                  <>
                    Mejorar Capacidad <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tarjeta de Soporte */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 text-center sm:text-left">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
              <Globe size={24} className="text-[#312E81]" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Soporte y Ayuda</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              ¿Necesitas cambiar el modo operativo de la escuela, eliminar
              registros o reportar un error del sistema?
            </p>
            <a
              href="mailto:soporte@lanovena.cl"
              className="inline-flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl transition-colors"
            >
              Contactar a soporte
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
