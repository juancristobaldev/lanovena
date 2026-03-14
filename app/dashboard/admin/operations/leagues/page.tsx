"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  Trophy,
  ShieldCheck,
  Coins,
  Plus,
  X,
  UserCheck,
  XCircle,
  Loader2,
  AlertTriangle,
  Sliders,
  Zap,
  Send,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_LEAGUES = gql`
  query GetAdminLeagues {
    adminLeagues {
      id
      name
      format
      status
      createdAt
      organizer {
        id
        fullName
        email
      }
    }
  }
`;

const CANCEL_LEAGUE = gql`
  mutation AdminCancelLeague($leagueId: String!) {
    adminCancelLeague(leagueId: $leagueId) {
      id
      status
    }
  }
`;

const IMPERSONATE_USER = gql`
  mutation AdminImpersonateUser($userId: String!) {
    adminImpersonateUser(userId: $userId) {
      id
    }
  }
`;

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export default function LeaguesMonitorPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leagueFormat, setLeagueFormat] = useState("none");

  const { data, loading, error, refetch }: any = useQuery(GET_LEAGUES, {
    fetchPolicy: "cache-and-network",
  });

  const [cancelLeague] = useMutation(CANCEL_LEAGUE, {
    onCompleted: () => refetch(),
    onError: (err: any) => alert("Error: " + err.message),
  });

  const [impersonateUser] = useMutation(IMPERSONATE_USER);

  // Funciones de Acciones
  const handleGodMode = async (userId: string, name: string) => {
    try {
      await impersonateUser({ variables: { userId } });
      alert(`Has iniciado sesión temporalmente como ${name} (Organizador).`);
    } catch (err: any) {
      alert("Error al suplantar identidad: " + err.message);
    }
  };

  const handleCancel = (id: string, name: string) => {
    if (window.confirm(`¿Seguro que deseas cancelar el torneo: ${name}?`)) {
      cancelLeague({ variables: { leagueId: id } });
    }
  };

  // Lógica del Cotizador Dinámico
  const getFormatDetails = () => {
    switch (leagueFormat) {
      case "largo":
        return {
          price: "$300.000",
          desc: "Ligas extensas anuales. Soporta alto volumen de partidos.",
        };
      case "corto":
        return {
          price: "$150.000",
          desc: "Ideal para campeonatos de verano o ligas municipales.",
        };
      case "copa":
        return {
          price: "$100.000",
          desc: "Torneos rápidos de fin de semana o feriados.",
        };
      default:
        return {
          price: "$0",
          desc: "Selecciona un formato para ver el precio base.",
        };
    }
  };

  const formatDetails = getFormatDetails();

  if (loading && !data)
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  if (error)
    return <div className="p-10 text-red-500">Error: {error.message}</div>;

  const leagues = data?.adminLeagues || [];
  const activeLeagues = leagues.filter(
    (l: any) => l.status !== "CANCELLED",
  ).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Monitor Global de Campeonatos
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Crea torneos a pedido, asigna administradores y controla la
            facturación por evento.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-900 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg hover:bg-black transition-colors"
        >
          <Plus size={18} strokeWidth={3} /> Crear Nuevo Torneo
        </button>
      </div>

      {/* KPIs DE TORNEOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Torneos Activos
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {activeLeagues}
            </h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Trophy size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between opacity-70">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Equipos Participando
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">--</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between opacity-70">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Ingresos por Ligas (Mes)
            </p>
            <h3 className="text-3xl font-black text-blue-600 mt-1">--</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* TABLA DE TORNEOS */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Nombre del Campeonato
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Organizador (Admin)
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Formato
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leagues.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-slate-500 font-medium"
                >
                  No hay torneos registrados.
                </td>
              </tr>
            ) : (
              leagues.map((league: any) => (
                <tr
                  key={league.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">
                      {league.name}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">
                      Creado: {new Date(league.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {league.organizer?.fullName || "Sin Asignar"}
                    <br />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {league.organizer?.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-[10px] font-black border border-indigo-100 uppercase tracking-widest">
                      {league.format.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {league.status === "CANCELLED" ? (
                      <span className="text-red-500 font-bold text-xs">
                        Cancelado
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold text-xs">
                        {league.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button
                        onClick={() =>
                          handleGodMode(
                            league.organizer.id,
                            league.organizer.fullName,
                          )
                        }
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                      >
                        <UserCheck size={14} /> God Mode
                      </button>
                      {league.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancel(league.id, league.name)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          title="Cancelar Liga"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* MODAL: GENERADOR DE TORNEOS                */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-950 text-white shrink-0">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2">
                  <Trophy className="text-yellow-400" size={24} /> Generador de
                  Torneos
                </h3>
                <p className="text-xs text-indigo-300 mt-1 font-medium">
                  Crea el espacio y configúrale las reglas de juego al
                  organizador.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-indigo-300 hover:text-white transition-colors"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Nombre del Campeonato
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Copa de Verano 2026"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white font-bold text-slate-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Correo del Organizador (Admin)
                  </label>
                  <input
                    type="email"
                    placeholder="organizador@correo.cl"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    Se enviará el acceso a la plataforma de gestión a este
                    correo.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-3">
                  Tipo de Contrato / Formato
                </label>
                <select
                  value={leagueFormat}
                  onChange={(e) => setLeagueFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 shadow-sm cursor-pointer transition-all"
                >
                  <option value="none">
                    Seleccione el formato principal...
                  </option>
                  <option value="largo">Liga Regular (Campeonato Largo)</option>
                  <option value="corto">
                    Campeonato Corto (Fase de Grupos + Playoffs)
                  </option>
                  <option value="copa">
                    Copa Relámpago (Eliminación Directa)
                  </option>
                </select>

                {/* OPCIONES DINÁMICAS */}
                {leagueFormat !== "none" && (
                  <div className="mt-5 border-t border-slate-200 pt-5 animate-in slide-in-from-top-4 duration-300">
                    {/* LIGA REGULAR */}
                    {leagueFormat === "largo" && (
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <Sliders size={14} /> Ajustes de Liga
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-2">
                              Cantidad de Ruedas
                            </label>
                            <select className="w-full text-xs font-bold text-slate-700 p-3 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 bg-white shadow-sm">
                              <option>1 Rueda</option>
                              <option selected>2 Ruedas (Ida y Vuelta)</option>
                              <option>3 Ruedas</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-2">
                              Cupos de Ascenso
                            </label>
                            <select className="w-full text-xs font-bold text-emerald-700 p-3 rounded-xl border border-emerald-200 bg-emerald-50 outline-none focus:ring-2 focus:ring-emerald-500/20">
                              <option>0 (Sin Ascenso)</option>
                              <option>1 Directo</option>
                              <option selected>
                                2 (1 Directo + 1 Liguilla)
                              </option>
                              <option>3 Directos</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-2">
                              Cupos de Descenso
                            </label>
                            <select className="w-full text-xs font-bold text-red-700 p-3 rounded-xl border border-red-200 bg-red-50 outline-none focus:ring-2 focus:ring-red-500/20">
                              <option>0 (Sin Descenso)</option>
                              <option>1 Directo</option>
                              <option selected>2 Directos</option>
                              <option>3 Directos</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CAMPEONATO CORTO */}
                    {leagueFormat === "corto" && (
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <Sliders size={14} /> Ajustes de Fases
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="text-[10px] font-bold text-slate-500 block mb-2">
                              Formato Llaves (Cuartos/Semis)
                            </label>
                            <select className="w-full text-sm font-bold text-slate-700 p-2.5 rounded-lg border border-slate-200 outline-none cursor-pointer focus:border-indigo-500 bg-slate-50">
                              <option>Partido Único</option>
                              <option selected>Ida y Vuelta</option>
                            </select>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-yellow-400">
                            <label className="text-[10px] font-bold text-slate-500 block mb-2">
                              Formato de la Gran Final
                            </label>
                            <select className="w-full text-sm font-bold text-slate-700 p-2.5 rounded-lg border border-slate-200 outline-none cursor-pointer focus:border-yellow-500 bg-slate-50">
                              <option selected>
                                Final Única (Cancha Neutral)
                              </option>
                              <option>Final Ida y Vuelta</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium italic">
                          * La plataforma generará automáticamente la fase de
                          grupos inicial.
                        </p>
                      </div>
                    )}

                    {/* COPA RELÁMPAGO */}
                    {leagueFormat === "copa" && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                          <Zap size={24} fill="currentColor" />
                        </div>
                        <div>
                          <h5 className="text-sm font-black text-orange-900">
                            Eliminación Directa
                          </h5>
                          <p className="text-xs text-orange-800 mt-1.5 leading-relaxed">
                            El sistema armará un bracket (llaves) a{" "}
                            <strong className="font-black text-orange-950">
                              partido único
                            </strong>{" "}
                            desde el inicio. En caso de empate, el sistema
                            habilitará automáticamente la definición a penales
                            en la planilla del árbitro.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* COTIZADOR INTERNO */}
              <div className="mt-6 p-5 bg-white rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Coins size={14} /> Cotizador Interno
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    {formatDetails.desc}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-black text-indigo-700 leading-none tracking-tight">
                    {formatDetails.price}
                  </p>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1.5">
                    Cobro por Torneo
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setLeagueFormat("none");
                }}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert(
                    "¡Torneo configurado y generado! (Mock UI: Mutación backend en desarrollo). Se enviaría un correo con las credenciales de Organizador.",
                  );
                  setIsModalOpen(false);
                  setLeagueFormat("none");
                }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Send size={16} strokeWidth={3} /> Crear y Enviar Accesos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
