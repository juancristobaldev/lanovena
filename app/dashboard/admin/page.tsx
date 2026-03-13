"use client";

import React from "react";
import {
  Users,
  Building2,
  Coins,
  AlertCircle,
  TrendingUp,
  MapPin,
  LineChart,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Query para obtener los stats que definimos en el AdminResolver
const GET_ADMIN_STATS = gql`
  query GetAdminGlobalStats {
    adminGlobalStats {
      totalPlayers
      totalSchools
      projectedMRR
      droppedSubscriptions
    }
  }
`;

export default function AdminDashboardPage() {
  const { data, loading, error }: any = useQuery(GET_ADMIN_STATS);

  if (loading)
    return (
      <div className="p-10 animate-pulse text-slate-400 font-medium">
        Cargando métricas globales...
      </div>
    );

  if (error)
    return (
      <div className="p-10 text-red-500 font-medium">
        Error al cargar estadísticas: {error.message}
      </div>
    );

  const stats = data?.adminGlobalStats || {
    totalPlayers: 0,
    totalSchools: 0,
    projectedMRR: 0,
    droppedSubscriptions: 0,
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* 4 CARDS PRINCIPALES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Jugadores */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 text-emerald-500 opacity-10 z-0 group-hover:scale-110 transition-transform">
            <Users size={120} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Jugadores Inscritos
            </p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">
              {stats.totalPlayers.toLocaleString()}
            </h3>
            <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingUp size={16} /> +120 este mes
            </p>
          </div>
        </div>

        {/* Escuelas */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 text-indigo-500 opacity-10 z-0 group-hover:scale-110 transition-transform">
            <Building2 size={120} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Escuelas Totales
            </p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">
              {stats.totalSchools}
            </h3>
            <p className="text-xs font-bold text-indigo-500 mt-2">
              Bajo Macro-Entidades
            </p>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden border-l-4 border-l-blue-500 group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 text-blue-500 opacity-10 z-0 group-hover:scale-110 transition-transform">
            <Coins size={120} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              MRR Proyectado
            </p>
            <h3 className="text-4xl font-black text-blue-600 mt-2">
              ${stats.projectedMRR.toLocaleString("es-CL")}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-2">
              Suscripciones La Novena
            </p>
          </div>
        </div>

        {/* Cuentas Caídas */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden border-l-4 border-l-red-500 group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 text-red-500 opacity-10 z-0 group-hover:scale-110 transition-transform">
            <AlertCircle size={120} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Suscripciones Caídas
            </p>
            <h3 className="text-4xl font-black text-red-500 mt-2">
              {stats.droppedSubscriptions}
            </h3>
            <p className="text-xs font-bold text-red-400 mt-2 animate-pulse">
              Requieren Kill-Mode
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS Y MAPA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Crecimiento MRR */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
            <LineChart className="text-indigo-500" size={18} />
            Crecimiento Ingresos (MRR)
          </h3>
          <div className="flex-1 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium">
            [Componente de Gráfico: GrowthChart]
          </div>
        </div>

        {/* Cobertura Mapa */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
              <MapPin className="text-emerald-500" size={18} />
              Cobertura de Escuelas
            </h3>
            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-black uppercase tracking-widest">
              IX Región
            </span>
          </div>
          <div className="w-full flex-1 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium overflow-hidden">
            [Componente de Mapa: SchoolsMap]
          </div>
        </div>
      </div>
    </div>
  );
}
