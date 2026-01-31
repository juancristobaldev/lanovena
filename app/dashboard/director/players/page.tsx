// src/graphql/queries/players.ts
"use client";

import { gql } from "@apollo/client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Edit, Filter } from "lucide-react";
import { hasRole, UserRole, useUser } from "@/src/providers/me";
import { useQuery } from "@apollo/client/react";
import PlayerModal from "@/src/components/PlayerModal";

export const GET_PLAYERS_BY_SCHOOL = gql`
  query PlayersBySchool($schoolId: String!) {
    playersBySchool(schoolId: $schoolId) {
      id
      firstName
      lastName
      active
      scholarship
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

export const GET_PLAYER_DETAILS = gql`
  query PlayerProfile($playerId: String!) {
    playerProfile(playerId: $playerId) {
      id
      firstName
      lastName
      birthDate
      photoUrl
      medicalInfo
      active
      scholarship
      qrCodeToken
      category {
        id
        name
      }
      guardian {
        id
        fullName
        email
        phone
      }
    }
  }
`;

// Necesario para el Select del SuperAdmin
export const GET_ALL_SCHOOLS = gql`
  query schoolsByDirector {
    schoolsByDirector {
      id
      name
    }
  }
`;

export default function PlayersPage() {
  const { user } = useUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Obtener Escuelas (Solo si es SuperAdmin)
  const { data: schoolsData }: any = useQuery(GET_ALL_SCHOOLS);

  // 2. Determinar qué ID de escuela usar
  const querySchoolId = selectedSchoolId;
  // 3. Obtener Jugadores
  const {
    data: playersData,
    loading,
    refetch,
  }: any = useQuery(GET_PLAYERS_BY_SCHOOL, {
    variables: { schoolId: querySchoolId },
    skip: !querySchoolId, // No consultar si no hay escuela definida
  });

  const players = playersData?.playersBySchool || [];

  // Filtrado simple en cliente
  const filteredPlayers = players.filter((p: any) =>
    `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* HEADER & FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="text-gray-500 text-sm">
            Gestión de plantilla y fichas médicas
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Select de Escuela (Solo SuperAdmin) */}
          {hasRole(user, [UserRole.SUPERADMIN, UserRole.DIRECTOR]) && (
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#312E81]"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
            >
              <option value="">Seleccionar Escuela...</option>
              {schoolsData?.schoolsByDirector.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#312E81] hover:bg-indigo-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ml-auto"
          >
            <Plus size={16} />
            Nuevo Jugador
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Buscar por nombre o apellido..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981]/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLA DE JUGADORES */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Apoderado</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    Cargando jugadores...
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    No se encontraron jugadores.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player: any) => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {player.firstName} {player.lastName}
                      {player.scholarship && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Becado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {player.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {player.guardian?.fullName || "Sin Asignar"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          player.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {player.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Botón de Edición Rápida (Modal) - Opcional, aquí abre el detalle mejor */}
                        <Link
                          href={`/dashboard/players/${player.id}`}
                          className="p-2 text-gray-400 hover:text-[#312E81] hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver Ficha Completa"
                        >
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <PlayerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          schoolId={querySchoolId}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
