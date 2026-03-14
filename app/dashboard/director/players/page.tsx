"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Edit2,
  Users,
  Trophy,
  Activity,
  AlertCircle,
  Loader2,
  UserPlus,
  Eye,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useUser } from "@/src/providers/me";
import { POSITIONS } from "./create/page";

const GET_PLAYERS_BY_SCHOOL = gql`
  query PlayersBySchool($schoolId: String!) {
    playersBySchool(schoolId: $schoolId) {
      id
      firstName
      lastName
      active
      scholarship
      position
      category {
        id
        name
      }
      guardian {
        id
        fullName
      }
    }
  }
`;

export default function PlayersListPage() {
  const { user, loading: userLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Derivamos la escuela activa del Layout
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const { data, loading }: any = useQuery(GET_PLAYERS_BY_SCHOOL, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
    fetchPolicy: "network-only",
  });

  const players = data?.playersBySchool || [];

  // Filtrado y Estadísticas
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    const term = searchTerm.toLowerCase();
    return players.filter(
      (p: any) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
        p.guardian?.fullName.toLowerCase().includes(term),
    );
  }, [players, searchTerm]);

  const stats = useMemo(
    () => ({
      total: players.length,
      active: players.filter((p: any) => p.active).length,
      scholarships: players.filter((p: any) => p.scholarship).length,
    }),
    [players],
  );

  if (userLoading || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-medium animate-pulse">
          Cargando plantilla...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Total Jugadores"
          value={stats.total}
          colorClass="bg-indigo-50 text-[#312E81] border-indigo-100"
        />
        <StatCard
          icon={Activity}
          label="Activos"
          value={stats.active}
          colorClass="bg-emerald-50 text-[#10B981] border-emerald-100"
        />
        <StatCard
          icon={Trophy}
          label="Becados"
          value={stats.scholarships}
          colorClass="bg-amber-50 text-amber-600 border-amber-100"
        />
      </div>

      {/* 2. TABLA DE JUGADORES */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Barra de Búsqueda Integrada */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por alumno o apoderado..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Contenedor de Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 rounded-tl-[2rem]">Jugador</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5">Posición</th>

                <th className="px-6 py-5">Familia Responsable</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-8 py-5 text-right rounded-tr-[2rem]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-2xl mb-4 border border-slate-100">
                        <UserPlus size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-bold text-lg mb-1">
                        {searchTerm ? "Sin coincidencias" : "Plantilla vacía"}
                      </p>
                      <p className="text-slate-500 font-medium">
                        {searchTerm
                          ? "Intenta con otro nombre."
                          : "Comienza matriculando a tu primer alumno."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player: any) => (
                  <tr
                    key={player.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#312E81] flex items-center justify-center font-black text-sm border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                          {player.firstName.charAt(0)}
                          {player.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2 text-base">
                            {player.firstName} {player.lastName}
                            {player.scholarship && (
                              <span
                                className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-black tracking-wider border border-amber-200"
                                title="100% Becado"
                              >
                                BECA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {player.category?.name || "Sin Categoría"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {POSITIONS.find((p) => p.id === player.position)
                          ?.full || "Sin Posición"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {player.guardian ? (
                        <span className="text-slate-600 font-medium">
                          {player.guardian.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-medium flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
                          <AlertCircle size={14} /> Sin apoderado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          player.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${player.active ? "bg-[#10B981]" : "bg-red-500"}`}
                        ></span>
                        {player.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link
                        href={`/dashboard/director/players/player/${player.id}`}
                        className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-[#312E81] hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente para las tarjetas de estadísticas
function StatCard({ icon: Icon, label, value, colorClass }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colorClass}`}
      >
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-900 leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}
