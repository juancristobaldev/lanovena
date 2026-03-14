"use client";

import React from "react";
import { gql } from "@apollo/client";
import { Building, Loader2, UserCheck, AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

const GET_MACRO_ENTITIES = gql`
  query GetMacroEntities {
    adminMacroEntities {
      id
      name
      type
      schoolsLimit
      admin {
        id
        fullName
        email
      }
      schools {
        id
      }
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

export default function InstitutionalsPage() {
  const { data, loading, error }: any = useQuery(GET_MACRO_ENTITIES, {
    fetchPolicy: "cache-and-network",
  });
  const [impersonateUser] = useMutation(IMPERSONATE_USER);

  const handleGodMode = async (userId: string, name: string) => {
    try {
      await impersonateUser({ variables: { userId } });
      alert(`Has iniciado sesión temporalmente como ${name} (SubAdmin).`);
      // Lógica de redirección a su panel aquí
    } catch (err: any) {
      alert("Error al suplantar identidad: " + err.message);
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

  const entities = data?.adminMacroEntities || [];

  return (
    <div className="flex-1 p-10 bg-slate-50 overflow-y-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
          <Building className="text-indigo-600" /> Gestión de Macro Entidades
        </h3>
        <p className="text-sm text-slate-500">
          Municipalidades, Ligas Privadas o Franquicias que agrupan múltiples
          escuelas.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Entidad Matriz
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Tipo
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Escuelas a Cargo
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Encargado (SubAdmin)
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entities.map((entity: any) => {
              const usagePercent = Math.min(
                (entity.schools.length / entity.schoolsLimit) * 100,
                100,
              );

              return (
                <tr
                  key={entity.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black">
                        {entity.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {entity.name}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          ID: {entity.id.split("-")[0]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                      {entity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-indigo-600">
                        {entity.schools.length} / {entity.schoolsLimit} Talleres
                      </span>
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entity.admin.fullName}
                    <br />
                    <span className="text-[10px] text-gray-400">
                      {entity.admin.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() =>
                        handleGodMode(entity.admin.id, entity.admin.fullName)
                      }
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 ml-auto"
                    >
                      <UserCheck size={14} /> God Mode
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
