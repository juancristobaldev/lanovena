"use client";

import React, { useMemo } from "react";
import { gql } from "@apollo/client";
import {
  Funnel,
  Clock,
  CheckCircle2,
  Building2,
  Users,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_CRM_DATA = gql`
  query GetCRMSchools {
    adminSchools {
      id
      name
      slug
      subscriptionStatus
      planType
      isActive
      nextBillingDate
      counts {
        players
        coaches
      }
    }
  }
`;

// ==========================================
// 2. TIPOS DE DATOS
// ==========================================
interface SchoolCRM {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: string; // Ej: "NEW", "TRIAL", "ACTIVE", "EXPIRED"
  planType: string;
  isActive: boolean;
  nextBillingDate?: string;
  counts: {
    players: number;
    coaches: number;
  };
}

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function CRMFunnelPage() {
  const { data, loading, error }: any = useQuery(GET_CRM_DATA, {
    fetchPolicy: "cache-and-network",
  });

  // Procesamiento y categorización de datos para el Kanban
  const { newLeads, inTrial, wonClients, metrics } = useMemo(() => {
    const schools: SchoolCRM[] = data?.adminSchools || [];

    const newLeads: SchoolCRM[] = [];
    const inTrial: SchoolCRM[] = [];
    const wonClients: SchoolCRM[] = [];

    schools.forEach((school) => {
      // Categorización basada en tu lógica de negocio.
      // Ajusta los strings de 'subscriptionStatus' a los que uses en Prisma.
      if (
        school.subscriptionStatus === "NEW" ||
        school.subscriptionStatus === "PENDING"
      ) {
        newLeads.push(school);
      } else if (school.subscriptionStatus === "TRIAL") {
        inTrial.push(school);
      } else if (
        school.subscriptionStatus === "ACTIVE" ||
        school.subscriptionStatus === "PAID"
      ) {
        wonClients.push(school);
      }
    });

    const conversionRate =
      schools.length > 0
        ? Math.round((wonClients.length / schools.length) * 100)
        : 0;

    return {
      newLeads,
      inTrial,
      wonClients,
      metrics: {
        totalTrials: inTrial.length,
        totalWon: wonClients.length,
        conversionRate,
      },
    };
  }, [data]);

  // Utilidad para calcular días restantes del Trial
  const getTrialDaysLeft = (nextBillingDate?: string) => {
    if (!nextBillingDate) return { days: 0, percentage: 100, isWarning: false };

    const end = new Date(nextBillingDate).getTime();
    const now = new Date().getTime();
    const diffTime = end - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Asumiendo un trial estándar de 14 días
    const maxTrialDays = 14;
    const percentage = Math.max(
      0,
      Math.min(100, ((maxTrialDays - daysLeft) / maxTrialDays) * 100),
    );

    return {
      days: daysLeft > 0 ? daysLeft : 0,
      percentage,
      isWarning: daysLeft <= 3 && daysLeft > 0, // Alerta si quedan 3 días o menos
    };
  };

  if (loading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Cargando Embudo CRM...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-slate-50 flex-1">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-lg">Error cargando prospectos</h3>
            <p className="text-sm font-medium mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500">
      {/* HEADER & METRICS */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Funnel className="text-indigo-600" /> Embudo de Suscripciones
            (Trials)
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Seguimiento de escuelas que crearon cuenta desde la landing.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                En Trial
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {metrics.totalTrials}
              </p>
            </div>
          </div>
          <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Conversión
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {metrics.conversionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh]">
        {/* COLUMNA 1: RECIÉN REGISTRADOS */}
        <div className="bg-slate-100/50 p-5 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              1. Recién Registrados
            </h4>
            <span className="bg-white text-slate-600 border border-slate-200 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
              {newLeads.length}
            </span>
          </div>

          {newLeads.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              No hay registros nuevos hoy.
            </div>
          )}

          {newLeads.map((school) => (
            <div
              key={school.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase mb-3 inline-block">
                Evaluando plataforma
              </span>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Building2
                  size={14}
                  className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                />{" "}
                {school.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">/{school.slug}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {school.counts.players} alumnos
                </span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {school.planType}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* COLUMNA 2: EN PRUEBA GRATUITA (TRIAL) */}
        <div className="bg-orange-50/50 p-5 rounded-[2rem] border-2 border-dashed border-orange-200 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              2. En Prueba Gratuita
            </h4>
            <span className="bg-white text-orange-600 border border-orange-200 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
              {inTrial.length}
            </span>
          </div>

          {inTrial.length === 0 && (
            <div className="text-center py-10 text-orange-400/70 text-sm font-medium">
              No hay escuelas en Trial activo.
            </div>
          )}

          {inTrial.map((school) => {
            const trial = getTrialDaysLeft(school.nextBillingDate);

            return (
              <div
                key={school.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 size={14} className="text-orange-400" />{" "}
                  {school.name}
                </p>

                <div className="mt-4 mb-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${trial.isWarning ? "bg-red-500" : "bg-orange-500"}`}
                    style={{ width: `${trial.percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Clock size={12} /> {trial.days} días restantes
                  </p>
                  {trial.isWarning && (
                    <p className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse border border-red-100">
                      ¡Cerca de vencer!
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {school.counts.players} alumnos
                  </span>
                  <button className="text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors">
                    Contactar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUMNA 3: CLIENTE GANADO */}
        <div className="bg-emerald-50/50 p-5 rounded-[2rem] border-2 border-dashed border-emerald-200 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              3. Cliente Ganado
            </h4>
            <span className="bg-white text-emerald-600 border border-emerald-200 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
              {wonClients.length}
            </span>
          </div>

          {wonClients.length === 0 && (
            <div className="text-center py-10 text-emerald-400/70 text-sm font-medium">
              Aún no hay conversiones este mes.
            </div>
          )}

          {wonClients.map((school) => (
            <div
              key={school.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>

              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 size={14} className="text-emerald-500" />{" "}
                  {school.name}
                </p>
              </div>

              <p className="text-[10px] font-black text-emerald-700 mt-2 bg-emerald-50 border border-emerald-100 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md uppercase tracking-widest">
                <CheckCircle2 size={12} strokeWidth={3} /> Suscripción Activa
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {school.counts.players} alumnos
                </span>
                <span className="text-slate-500">Plan {school.planType}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
