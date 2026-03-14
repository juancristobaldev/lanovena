"use client";

import React, { useState, useEffect } from "react";
import { gql } from "@apollo/client";
import {
  Settings,
  Tags,
  Plug,
  AlertTriangle,
  Loader2,
  Edit3,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_SYSTEM_SETTINGS = gql`
  query GetSystemSettingsAndPlans {
    adminPlanLimits {
      planType
      maxStudents
      maxCategories
      maxCoaches
      allowsStore
      allowsGlobalLib
      allowsFinance
    }
    adminSystemSettings {
      key
      value
      updatedAt
    }
  }
`;

const TOGGLE_MAINTENANCE = gql`
  mutation AdminToggleMaintenance($enabled: Boolean!) {
    adminToggleMaintenance(enabled: $enabled)
  }
`;

const UPDATE_SETTING = gql`
  mutation AdminUpdateSystemSetting($key: String!, $value: String!) {
    adminUpdateSystemSetting(key: $key, value: $value) {
      key
      value
    }
  }
`;

// ==========================================
// 2. TIPOS Y MAPEOS VISUALES
// ==========================================
const PLAN_INFO: Record<
  string,
  { title: string; price: string; color: string; border: string; bg: string }
> = {
  BASIC: {
    title: "Plan Básico (Semillero)",
    price: "$35.000",
    color: "text-slate-900",
    border: "border-slate-200",
    bg: "bg-slate-50",
  },
  GOLD: {
    title: "Plan Gold (Estándar)",
    price: "$50.000",
    color: "text-indigo-900",
    border: "border-indigo-200 border-2",
    bg: "bg-indigo-50",
  },
  PLATINUM: {
    title: "Plan Platino (Élite)",
    price: "$80.000",
    color: "text-slate-900",
    border: "border-slate-200",
    bg: "bg-slate-50",
  },
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function SystemSettingsPage() {
  const { data, loading, error, refetch }: any = useQuery(GET_SYSTEM_SETTINGS, {
    fetchPolicy: "cache-and-network",
  });

  const [toggleMaintenance, { loading: toggling }] =
    useMutation(TOGGLE_MAINTENANCE);
  const [updateSetting] = useMutation(UPDATE_SETTING);

  const [isMaintenanceEnabled, setIsMaintenanceEnabled] = useState(false);

  // Mapear los settings de la base de datos
  const settingsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (data?.adminSystemSettings) {
      data.adminSystemSettings.forEach((s: any) => {
        map[s.key] = s.value;
      });
    }
    return map;
  }, [data]);

  // Sincronizar el estado del toggle con la BD al cargar
  useEffect(() => {
    if (settingsMap["MAINTENANCE_MODE"] === "true") {
      setIsMaintenanceEnabled(true);
    } else {
      setIsMaintenanceEnabled(false);
    }
  }, [settingsMap]);

  // Manejadores de Eventos
  const handleToggleMaintenance = async () => {
    const newState = !isMaintenanceEnabled;
    const confirmMsg = newState
      ? "¡CUIDADO! Activar el modo mantenimiento desconectará a todos los usuarios y mostrará una pantalla de 'En construcción'. ¿Deseas continuar?"
      : "¿Deseas desactivar el modo mantenimiento y permitir el acceso nuevamente a la plataforma?";

    if (window.confirm(confirmMsg)) {
      setIsMaintenanceEnabled(newState); // Optimistic Update
      try {
        await toggleMaintenance({ variables: { enabled: newState } });
        refetch();
      } catch (err: any) {
        setIsMaintenanceEnabled(!newState); // Revertir si falla
        alert("Error cambiando estado del sistema: " + err.message);
      }
    }
  };

  const handleUpdateAPIKey = async (
    key: string,
    currentValue: string,
    friendlyName: string,
  ) => {
    const newValue = window.prompt(
      `Ingresa la nueva API Key para ${friendlyName}:`,
      currentValue || "",
    );
    if (newValue !== null && newValue !== currentValue) {
      try {
        await updateSetting({ variables: { key, value: newValue } });
        refetch();
        alert(
          `La integración de ${friendlyName} se ha actualizado correctamente.`,
        );
      } catch (err: any) {
        alert("Error actualizando configuración: " + err.message);
      }
    }
  };

  if (loading && !data)
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-red-500">
        Error cargando configuraciones: {error.message}
      </div>
    );

  const plans = data?.adminPlanLimits || [];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-slate-700" /> Ajustes Globales del Sistema
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Configuración central del SaaS, planes de suscripción e
            integraciones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========================================== */}
        {/* ========================================== */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <Tags className="text-indigo-600" /> Planes de Suscripción (SaaS)
          </h4>

          <div className="space-y-4 flex-1">
            {plans.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No hay planes configurados en el sistema.
              </p>
            ) : (
              plans.map((plan: any) => {
                const ui = PLAN_INFO[plan.planType] || PLAN_INFO["BASIC"];
                const studentLimit =
                  plan.maxStudents === 99999
                    ? "Ilimitado"
                    : `${plan.maxStudents} Alumnos`;

                return (
                  <div
                    key={plan.planType}
                    className={`p-4 rounded-xl flex justify-between items-center ${ui.bg} ${ui.border}`}
                  >
                    <div>
                      <p className={`font-bold ${ui.color}`}>{ui.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Límite: {studentLimit} • {plan.maxCategories} Categorías
                      </p>
                    </div>
                    <div className="text-right">
                      {/* Nota: Precio real idealmente vendría del backend, aquí se mokea basado en tu HTML */}
                      <p className="font-black text-indigo-600 text-lg">
                        {ui.price}
                      </p>
                      <button
                        onClick={() =>
                          alert(
                            `Abriendo editor de límites para el plan ${plan.planType}`,
                          )
                        }
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mt-1 flex items-center justify-end gap-1 w-full"
                      >
                        <Edit3 size={10} /> Editar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className="w-full mt-6 py-3.5 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2">
            Crear Nuevo Plan
          </button>
        </div>

        {/* ========================================== */}
        {/* ========================================== */}
        <div className="space-y-8">
          {/* INTEGRACIONES API */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
              <Plug className="text-emerald-500" /> Integraciones (API Keys)
            </h4>
            <div className="space-y-5">
              {/* Reveniu */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <KeyRound size={12} /> Reveniu (Pagos Recurrentes)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={
                      settingsMap["REVENIU_API_KEY"] ||
                      "rev_live_not_configured_yet"
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-mono text-slate-500"
                    disabled
                  />
                  <button
                    onClick={() =>
                      handleUpdateAPIKey(
                        "REVENIU_API_KEY",
                        settingsMap["REVENIU_API_KEY"],
                        "Reveniu",
                      )
                    }
                    className="bg-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>

              {/* LibreDTE */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <KeyRound size={12} /> Facturación SII (LibreDTE)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={
                      settingsMap["LIBREDTE_API_KEY"] ||
                      "dte_key_not_configured"
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-mono text-slate-500"
                    disabled
                  />
                  <button
                    onClick={() =>
                      handleUpdateAPIKey(
                        "LIBREDTE_API_KEY",
                        settingsMap["LIBREDTE_API_KEY"],
                        "LibreDTE",
                      )
                    }
                    className="bg-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ZONA DE PELIGRO (Mantenimiento) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm bg-red-50/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 text-red-100 opacity-50 transform translate-x-1/4 -translate-y-1/4">
              <ShieldAlert size={120} />
            </div>

            <div className="relative z-10">
              <h4 className="font-black text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Zona de Peligro
              </h4>
              <p className="text-xs text-red-600 mb-6 font-medium">
                Acciones críticas del sistema que afectan a toda la red de
                usuarios.
              </p>

              <label
                className={`flex items-center justify-between cursor-pointer p-5 bg-white rounded-2xl border transition-colors ${isMaintenanceEnabled ? "border-red-400 shadow-md" : "border-red-200 shadow-sm"}`}
              >
                <div>
                  <span className="text-sm font-black text-gray-800">
                    Modo Mantenimiento
                  </span>
                  <p className="text-[11px] font-medium text-gray-500 mt-1 max-w-[200px]">
                    Deshabilita el acceso a todos los usuarios mostrando una
                    pantalla de actualización.
                  </p>
                </div>

                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isMaintenanceEnabled}
                    onChange={handleToggleMaintenance}
                    disabled={toggling}
                  />
                  {/* Custom Toggle Switch */}
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
