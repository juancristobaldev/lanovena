"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  School,
  ChevronDown,
  Users,
  Trophy,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useUser } from "@/src/providers/me";
import PlayerModal from "@/src/components/PlayerModal";

// === GRAPHQL ===
export const GET_PLAYERS_BY_SCHOOL = gql`
  query PlayersBySchool($schoolId: String!) {
    playersBySchool(schoolId: $schoolId) {
      id
      firstName
      lastName
      active
      scholarship
      photoUrl # Asumiendo que existe, sino se usa fallback
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

// === COMPONENTE PRINCIPAL ===
export default function PlayersPage() {
  const { user, loading: userLoading } = useUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Lógica de Escuelas (Reutilizable)
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

  // 2. Query de Jugadores
  const { data, loading, refetch }: any = useQuery(GET_PLAYERS_BY_SCHOOL, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "network-only",
  });

  const players = data?.playersBySchool || [];

  // 3. Filtrado y Estadísticas
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    return players.filter(
      (p: any) =>
        `${p.firstName} ${p.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        p.guardian?.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
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

  // --- RENDER ---
  if (userLoading)
    return <div className="p-10 text-center text-indigo-900">Cargando...</div>;

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            Plantilla de Jugadores
          </h1>
          <p className="text-gray-500 text-lg">
            Gestión de fichas deportivas, matrículas y estados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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
                    {currentSchool?.name}
                  </span>
                )}
              </div>
              {availableSchools.length > 1 && (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
          >
            <Plus strokeWidth={3} className="w-5 h-5" />
            <span className="hidden sm:inline">Matricular Jugador</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Jugadores"
          value={stats.total}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          icon={Activity}
          label="Activos"
          value={stats.active}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon={Trophy}
          label="Becados"
          value={stats.scholarships}
          color="bg-amber-50 text-amber-700"
        />
      </div>

      {/* CONTROLES Y TABLA */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Barra de Búsqueda */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o apoderado..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#312E81] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Jugador</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Apoderado</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400">
                    Cargando plantilla...
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-10 h-10 text-gray-200 mb-2" />
                      <p className="text-gray-500 font-medium">
                        No se encontraron jugadores
                      </p>
                      <p className="text-gray-400 text-xs">
                        Intenta ajustar los filtros o registra uno nuevo.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player: any) => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar / Iniciales */}
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-[#312E81] flex items-center justify-center font-bold text-xs border border-indigo-200">
                          {player.firstName.charAt(0)}
                          {player.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {player.firstName} {player.lastName}
                            {player.scholarship && (
                              <span
                                className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded border border-amber-200"
                                title="Becado"
                              >
                                ⭐
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {player.category?.name || "Sin Categoría"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {player.guardian ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          {player.guardian.fullName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs flex items-center gap-1">
                          <AlertCircle size={12} /> Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          player.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${player.active ? "bg-emerald-500" : "bg-red-500"}`}
                        ></span>
                        {player.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/director/players/${player.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#312E81] hover:bg-indigo-50 transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <PlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolId={selectedSchoolId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

// Subcomponente simple para KPIs
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}
