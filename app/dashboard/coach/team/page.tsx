"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  Target,
  Zap,
  ChevronRight,
  Search,
  Loader2,
  Award,
  Info,
} from "lucide-react";
import { useUser } from "@/src/providers/me";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";

export const GET_COACH_TEAM = gql`
  query GetCoachTeam {
    meCoach {
      coachProfile {
        categories {
          id
          name
          players {
            id
            firstName
            lastName
            photoUrl
            position
            scholarship
            birthDate
          }
        }
      }
    }
  }
`;

// Configuración de visualización por posición
const POSITION_CONFIG = {
  GK: {
    label: "Arqueros",
    icon: ShieldCheck,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  DEF: {
    label: "Defensas",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  MID: {
    label: "Volantes",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  FW: {
    label: "Delanteros",
    icon: Target,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
};

export default function CoachTeamPage() {
  const { user } = useUser(); // Hook global del sistema
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, error }: any = useQuery(GET_COACH_TEAM, {
    fetchPolicy: "cache-and-network",
  });

  // Manejo de estado inicial para la primera categoría disponible
  useEffect(() => {
    const firstCategory = data?.meCoach?.coachProfile?.categories?.[0];
    if (firstCategory && !selectedCategoryId) {
      setSelectedCategoryId(firstCategory.id);
    }
  }, [data, selectedCategoryId]);

  const categories = data?.meCoach?.coachProfile?.categories || [];
  const activeCategory = categories.find(
    (c: any) => c.id === selectedCategoryId,
  );

  // Agrupación táctica de jugadores
  const groupedPlayers = useMemo(() => {
    if (!activeCategory?.players) return {};

    const filtered = activeCategory.players.filter((p: any) =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );

    return filtered.reduce((acc: any, player: any) => {
      const pos = player.position || "DEF"; // Fallback a Defensa si no está definida
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(player);
      return acc;
    }, {});
  }, [activeCategory, searchTerm]);

  if (loading && !data) return <LoadingView />;
  if (error) return <ErrorView message={error.message} />;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER: Identidad y Selector de Categorías */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Users className="text-[#10B981]" size={32} />
            Gestión de Plantel
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Visualiza tu equipo asignado por bloques tácticos.
          </p>
        </div>

        {/* TABS DE CATEGORÍAS */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto hide-scrollbar border border-gray-200 shadow-inner">
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-wider ${
                selectedCategoryId === cat.id
                  ? "bg-white text-[#312E81] shadow-md scale-[1.02]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#312E81] transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar jugador por nombre o apellido..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[20px] focus:ring-4 focus:ring-[#312E81]/5 outline-none transition-all shadow-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CUERPO: Grupo por Posiciones */}
      <div className="space-y-12">
        {Object.entries(POSITION_CONFIG).map(([posKey, config]) => {
          const players = groupedPlayers[posKey] || [];
          if (players.length === 0 && searchTerm) return null;

          return (
            <section key={posKey} className="space-y-5">
              <div className="flex items-center gap-3 px-2">
                <div
                  className={`p-2.5 rounded-xl ${config.bg} ${config.color} border ${config.border} shadow-sm`}
                >
                  <config.icon size={22} />
                </div>
                <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">
                  {config.label}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent ml-2" />
                <span className="bg-gray-100 text-gray-400 text-[10px] px-3 py-1 rounded-full font-black">
                  {players.length} JUGADORES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {players.length > 0 ? (
                  players.map((player: any) => (
                    <PlayerCard key={player.id} player={player} />
                  ))
                ) : (
                  <div className="col-span-full py-8 px-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex items-center gap-3 text-gray-400 italic text-sm">
                    <Info size={18} /> No hay jugadores registrados en esta
                    línea.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// COMPONENTE: Tarjeta de Jugador
function PlayerCard({ player }: { player: any }) {
  const birthYear = new Date(player.birthDate).getFullYear();

  return (
    <Link href={`/dashboard/coach/team/${player?.id}`}>
      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col items-center text-center">
        {/* Badge de Becado - Marketing Directo */}
        {player.scholarship && (
          <div
            className="absolute top-0 right-0 bg-[#10B981] text-white px-3 py-1 rounded-bl-2xl shadow-sm z-10"
            title="Jugador Becado"
          >
            <Award size={14} className="fill-white" />
          </div>
        )}

        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-4 border-white shadow-md overflow-hidden mb-4 shrink-0 group-hover:scale-105 transition-transform">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#312E81] font-black text-2xl">
              {player.firstName.charAt(0)}
            </div>
          )}
        </div>

        <div className="w-full">
          <h3 className="font-bold text-gray-900 group-hover:text-[#312E81] transition-colors leading-tight">
            {player.firstName} {player.lastName}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            AÑO {birthYear}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 w-full flex justify-center">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600/40 group-hover:text-indigo-600 transition-colors">
            VER FICHA <ChevronRight size={14} strokeWidth={3} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Vistas de Estado
function LoadingView() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#312E81]" size={48} />
      <p className="text-gray-400 font-black text-xs uppercase tracking-[0.2em]">
        Sincronizando Plantel...
      </p>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100 m-6">
      <h2 className="text-red-600 font-black mb-2 uppercase">
        Error de Conexión
      </h2>
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}
