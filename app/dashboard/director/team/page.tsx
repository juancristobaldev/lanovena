"use client";

import React, { useState, useMemo, useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  School,
  ChevronDown,
  Loader2,
  Briefcase,
  Users,
  Star,
  Mail,
  Medal,
  Phone,
  User,
  Baby,
} from "lucide-react";
import { useUser } from "@/src/providers/me";

// --- GRAPHQL QUERY ---
const GET_SCHOOL_DIRECTORY = gql`
  query GetSchoolDirectory($schoolId: String!) {
    getSchoolDirectory(schoolId: $schoolId) {
      coaches {
        id
        fullName
        email
        role
        coachProfile {
          categories {
            id
            name
          }
        }
      }
      guardians {
        id
        fullName
        email
        phone
        managedPlayers {
          id
          firstName
          lastName
        }
      }
      players {
        id
        firstName
        lastName
        category {
          name
        }
      }
    }
  }
`;

// --- TYPES ---
interface Category {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  fullName: string;
  email: string;
  role: string;
  coachProfile?: {
    categories: Category[];
  };
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  category?: {
    name: string;
  };
}

interface Guardian {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  managedPlayers: Player[];
}

interface DirectoryData {
  getSchoolDirectory: {
    coaches: Coach[];
    guardians: Guardian[];
    players: Player[];
  };
}

export default function DirectorDirectoryPage() {
  const { user, loading: userLoading } = useUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // --- ESCUELAS (Lógica de Director) ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERY ---
  const { data, loading, error } = useQuery<DirectoryData>(
    GET_SCHOOL_DIRECTORY,
    {
      variables: { schoolId: selectedSchoolId },
      skip: !selectedSchoolId,
      fetchPolicy: "cache-and-network",
    },
  );

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  // Helper para generar etiquetas de especialidad (Formativa vs Selectiva)
  const getSpecialtyTags = (coach: Coach) => {
    if (!coach.coachProfile?.categories) return [];

    const tags = new Set<string>();
    coach.coachProfile.categories.forEach((cat) => {
      const name = cat.name.toLowerCase();
      if (
        name.includes("selectiva") ||
        name.includes("pro") ||
        name.includes("elite") ||
        name.includes("competición")
      ) {
        tags.add("SELECTIVA");
      } else {
        tags.add("FORMATIVA");
      }
    });

    return Array.from(tags);
  };

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando directorio...
        </p>
      </div>
    );
  }

  const {
    coaches = [],
    guardians = [],
    players = [],
  } = data?.getSchoolDirectory || {};

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-10 animate-fade-in font-sans">
      {/* 1. HEADER & SELECTOR DE ESCUELAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#10B981]" />
            Directorio del Club
          </h1>
          <p className="text-gray-500 text-lg">
            Gestión de entrenadores, apoderados y jugadores.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {availableSchools.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 flex items-center gap-3 min-w-[260px] w-full sm:w-auto">
              <div className="bg-indigo-50 p-2.5 rounded-lg">
                <School className="w-5 h-5 text-[#312E81]" />
              </div>
              <div className="relative flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Visualizando Escuela
                </span>
                {availableSchools.length > 1 ? (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="bg-transparent font-bold text-[#312E81] text-base outline-none w-full appearance-none cursor-pointer"
                  >
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-[#312E81] text-base block truncate">
                    {currentSchool?.name}
                  </span>
                )}
              </div>
              {availableSchools.length > 1 && (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-center py-12 px-6 bg-red-50 rounded-2xl border border-red-100">
          <h3 className="text-red-500 font-bold mb-2">Error de carga</h3>
          <p className="text-sm text-red-400 mb-4">
            No pudimos obtener la información del directorio.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* SECCIÓN 1: CUERPO TÉCNICO */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#10B981] p-2 rounded-lg text-white">
                <Briefcase size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Cuerpo Técnico ({coaches.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.length > 0 ? (
                coaches.map((coach) => (
                  <CoachCard
                    key={coach.id}
                    coach={coach}
                    specialties={getSpecialtyTags(coach)}
                  />
                ))
              ) : (
                <EmptyState
                  message="No hay entrenadores registrados."
                  icon={<Briefcase />}
                />
              )}
            </div>
          </section>

          {/* LÍNEA SEPARADORA */}
          <div className="h-px w-full bg-gray-200"></div>

          {/* SECCIÓN 2: APODERADOS */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#312E81] p-2 rounded-lg text-white">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Apoderados ({guardians.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guardians.length > 0 ? (
                guardians.map((guardian) => (
                  <GuardianCard key={guardian.id} guardian={guardian} />
                ))
              ) : (
                <EmptyState
                  message="No hay apoderados registrados."
                  icon={<Users />}
                />
              )}
            </div>
          </section>

          {/* LÍNEA SEPARADORA */}
          <div className="h-px w-full bg-gray-200"></div>

          {/* SECCIÓN 3: JUGADORES */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-500 p-2 rounded-lg text-white">
                <Baby size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Jugadores Registrados ({players.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.length > 0 ? (
                players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))
              ) : (
                <EmptyState
                  message="No hay jugadores registrados."
                  icon={<Baby />}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function CoachCard({
  coach,
  specialties,
}: {
  coach: Coach;
  specialties: string[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group">
      <div className="h-16 bg-emerald-500 relative">
        {specialties.map((spec, idx) => (
          <div
            key={idx}
            className={`absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-black tracking-wider text-white shadow-sm flex items-center gap-1 ${spec === "SELECTIVA" ? "bg-orange-500" : "bg-white/20 backdrop-blur-md border border-white/30"}`}
          >
            {spec === "SELECTIVA" && <Star size={10} className="fill-white" />}
            {spec}
          </div>
        ))}
      </div>
      <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-md p-1.5 absolute -top-8 border border-gray-100">
          <div className="w-full h-full rounded-xl flex items-center justify-center font-black text-xl bg-gray-50 text-emerald-600">
            {coach.fullName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="mt-10 mb-4">
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
            {coach.fullName}
          </h3>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-3 bg-emerald-50 text-emerald-700">
            Entrenador Formador
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Mail size={14} className="text-gray-400" />
            <span className="truncate">{coach.email}</span>
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Medal size={14} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Series a cargo
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coach.coachProfile?.categories &&
            coach.coachProfile.categories.length > 0 ? (
              coach.coachProfile.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200"
                >
                  {cat.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">Sin asignar</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GuardianCard({ guardian }: { guardian: Guardian }) {
  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-lg transition-all duration-300 p-5 flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0 border border-indigo-100">
          {guardian.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {guardian.fullName}
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            Apoderado
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Mail size={14} className="text-gray-400" />
          <span className="truncate">{guardian.email}</span>
        </div>
        {guardian.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Phone size={14} className="text-gray-400" />
            <span>{guardian.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Jugadores a cargo
        </div>
        <div className="flex flex-col gap-1">
          {guardian.managedPlayers && guardian.managedPlayers.length > 0 ? (
            guardian.managedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200"
              >
                <User size={12} className="text-gray-400" />
                {player.firstName} {player.lastName}
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              No tiene jugadores asignados
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-amber-300 transition-colors p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold shrink-0">
        {player.firstName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-gray-900 truncate">
          {player.firstName} {player.lastName}
        </h4>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
          {player.category?.name || "Sin Categoría"}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="col-span-full py-10 px-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 mb-3 shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse shadow-sm p-6"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
