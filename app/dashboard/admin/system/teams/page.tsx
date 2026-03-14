"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Power,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_ADMIN_USERS = gql`
  query GetAdminUsers {
    adminUsers {
      id
      email
      fullName
      role
      isActive
      createdAt
    }
  }
`;

const DEACTIVATE_USER = gql`
  mutation AdminDeactivateUser($userId: String!) {
    adminDeactivateUser(userId: $userId) {
      id
      isActive
    }
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation AdminUpdateUserRole($userId: String!, $role: String!) {
    adminUpdateUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`;

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export default function SaaSInternalTeamPage() {
  const { data, loading, error, refetch }: any = useQuery(GET_ADMIN_USERS, {
    fetchPolicy: "cache-and-network",
  });

  const [deactivateUser] = useMutation(DEACTIVATE_USER);
  const [updateRole] = useMutation(UPDATE_USER_ROLE);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manejador para activar/desactivar un administrador
  const handleToggleStatus = async (
    userId: string,
    currentStatus: boolean,
    name: string,
  ) => {
    const action = currentStatus ? "desactivar" : "reactivar";
    if (window.confirm(`¿Seguro que deseas ${action} el acceso de ${name}?`)) {
      try {
        await deactivateUser({ variables: { userId } });
        refetch();
      } catch (err: any) {
        alert("Error cambiando el estado del usuario: " + err.message);
      }
    }
  };

  // Manejador para degradar de rol (quitar SuperAdmin)
  const handleRevokeAdmin = async (userId: string, name: string) => {
    if (
      window.confirm(
        `¿Estás completamente seguro de quitarle el rol SUPERADMIN a ${name}? Perderá el acceso a este panel.`,
      )
    ) {
      try {
        await updateRole({ variables: { userId, role: "USER" } });
        alert(`Se han revocado los permisos de ${name}.`);
        refetch();
      } catch (err: any) {
        alert("Error al actualizar el rol: " + err.message);
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Cargando equipo directivo...
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
            <h3 className="font-black text-lg">Error cargando usuarios</h3>
            <p className="text-sm font-medium mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filtramos para mostrar idealmente solo a los SUPERADMIN, o todos los que retorne la query si ya viene filtrada del backend
  const teamMembers =
    data?.adminUsers?.filter((u: any) => u.role === "SUPERADMIN") || [];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-indigo-600" /> Equipo Directivo (La Novena
            SpA)
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Cuentas de confianza con acceso administrativo total a la
            plataforma.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-colors"
        >
          <UserPlus size={18} strokeWidth={2.5} /> Nuevo Administrador
        </button>
      </div>

      {/* TABLA DE MIEMBROS */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Miembro del Equipo
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Cargo en la Empresa
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Nivel de Acceso
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                Estado & Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teamMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-8 text-slate-500 font-medium"
                >
                  No se encontraron administradores.
                </td>
              </tr>
            ) : (
              teamMembers.map((member: any) => (
                <tr
                  key={member.id}
                  className={`transition-colors ${member.isActive ? "hover:bg-slate-50 bg-indigo-50/10" : "bg-red-50/30"}`}
                >
                  {/* Avatar y Datos Personales */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=312E81&color=fff`}
                        alt={member.fullName}
                        className={`w-10 h-10 rounded-full shadow-sm ${!member.isActive && "grayscale"}`}
                      />
                      <div>
                        <p
                          className={`font-bold ${member.isActive ? "text-slate-900" : "text-slate-500"}`}
                        >
                          {member.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cargo Ficticio (Asumimos roles genéricos ya que no hay tabla de 'Job Titles') */}
                  <td className="px-6 py-4">
                    <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                      {member.email.includes("felipe")
                        ? "CEO / Fundador"
                        : "Staff / Operaciones"}
                    </span>
                  </td>

                  {/* Nivel de Acceso */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-indigo-600 flex items-center justify-center gap-1">
                      <ShieldAlert size={14} /> Acceso Total (SuperAdmin)
                    </span>
                  </td>

                  {/* Estado y Acciones */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {member.isActive ? (
                        <span className="text-emerald-500 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          <CheckCircle2 size={14} /> Activo
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold text-xs flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                          <XCircle size={14} /> Inactivo
                        </span>
                      )}

                      {/* Dropdown de Acciones simulado con botones */}
                      <button
                        onClick={() =>
                          handleRevokeAdmin(member.id, member.fullName)
                        }
                        className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors bg-white rounded shadow-sm border border-slate-200"
                        title="Quitar privilegios de SuperAdmin"
                      >
                        <ShieldAlert size={14} />
                      </button>
                      <button
                        onClick={() =>
                          handleToggleStatus(
                            member.id,
                            member.isActive,
                            member.fullName,
                          )
                        }
                        className={`p-1.5 transition-colors bg-white rounded shadow-sm border ${member.isActive ? "text-slate-400 hover:text-red-500 border-slate-200" : "text-emerald-500 hover:text-emerald-600 border-emerald-200"}`}
                        title={
                          member.isActive
                            ? "Desactivar usuario"
                            : "Reactivar usuario"
                        }
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* NOTA DE ARQUITECTURA */}
      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <Info className="text-blue-500 mt-0.5 shrink-0" size={24} />
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1.5">
            Nota de Arquitectura para el MVP:
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            Para optimizar tiempos y costos en esta primera etapa,{" "}
            <strong>
              no se requiere programación de sub-roles jerárquicos a nivel
              interno de "La Novena"
            </strong>
            . Todas las cuentas listadas aquí tienen el rol de{" "}
            <code className="bg-blue-100 px-1 py-0.5 rounded text-indigo-700">
              SUPERADMIN
            </code>{" "}
            en la base de datos y ven exactamente el mismo panel y las mismas
            métricas de forma transparente.
          </p>
        </div>
      </div>

      {/* MODAL MOCKUP PARA "NUEVO ADMINISTRADOR" */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus size={40} strokeWidth={2} />
            </div>

            <h3 className="font-black text-xl text-slate-900 mb-2">
              Promover Usuario
            </h3>
            <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
              Actualmente, para añadir a un nuevo miembro al equipo directivo,
              el usuario debe <strong>crear una cuenta normal</strong> primero
              en la plataforma.
              <br />
              <br />
              Una vez registrada, puedes promover su cuenta utilizando su ID en
              la consola, o se habilitará un buscador en la próxima
              actualización.
            </p>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-slate-900 text-white font-black text-sm py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
            >
              Entendido, Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
