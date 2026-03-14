"use client";

import React from "react";
import { gql } from "@apollo/client";
import {
  ShieldCheck,
  Loader2,
  Power,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

const GET_SCHOOLS = gql`
  query GetAdminSchools {
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

const TOGGLE_KILL_MODE = gql`
  mutation AdminToggleKillMode($schoolId: String!, $activate: Boolean!) {
    adminToggleKillMode(schoolId: $schoolId, activate: $activate) {
      id
      isActive
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

export default function SchoolsPage() {
  const { data, loading, error, refetch }: any = useQuery(GET_SCHOOLS, {
    fetchPolicy: "cache-and-network",
  });
  const [toggleKillMode] = useMutation(TOGGLE_KILL_MODE);
  const [impersonateUser] = useMutation(IMPERSONATE_USER);

  const handleKillMode = async (
    schoolId: string,
    currentStatus: boolean,
    name: string,
  ) => {
    const action = currentStatus ? "DESACTIVAR" : "ACTIVAR";
    if (
      window.confirm(
        `¿Estás seguro de que deseas ${action} el acceso a ${name}?`,
      )
    ) {
      try {
        await toggleKillMode({
          variables: { schoolId, activate: !currentStatus },
        });
        refetch();
      } catch (err: any) {
        alert("Error cambiando estado: " + err.message);
      }
    }
  };

  if (loading)
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  if (error)
    return <div className="p-10 text-red-500">Error: {error.message}</div>;

  const schools = data?.adminSchools || [];

  return (
    <div className="flex-1 p-10 bg-slate-50 overflow-y-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" /> Directorio de Escuelas
          Base
        </h3>
        <p className="text-sm text-slate-500">
          Administración de clientes finales, planes y bloqueos de acceso (Kill
          Mode).
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Escuela
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Plan / Volumen
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Estado Financiero
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Acciones de Soporte
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schools.map((school: any) => (
              <tr
                key={school.id}
                className={`hover:bg-slate-50 transition-colors ${!school.isActive ? "bg-red-50/30" : ""}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${school.isActive ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
                    >
                      {school.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{school.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Slug: /{school.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-black tracking-widest border border-indigo-100">
                    {school.planType}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">
                    {school.counts.players} Alumnos
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {school.subscriptionStatus === "ACTIVE" ? (
                    <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> Al día
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 flex items-center justify-center gap-1 w-max mx-auto">
                      <AlertTriangle size={14} /> Moroso
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        alert(
                          "God Mode: Obteniendo ID del Director principal de esta escuela...",
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <UserCheck size={14} /> God Mode
                    </button>

                    <button
                      onClick={() =>
                        handleKillMode(school.id, school.isActive, school.name)
                      }
                      className={`px-3 py-1.5 font-bold text-xs rounded-lg border flex items-center gap-1 transition-colors ${
                        school.isActive
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          : "bg-slate-800 text-white border-slate-900 hover:bg-black"
                      }`}
                    >
                      <Power size={14} />{" "}
                      {school.isActive ? "KILL MODE" : "REACTIVAR"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
