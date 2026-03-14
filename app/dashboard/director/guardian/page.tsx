"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Mail,
  Phone,
  MessageCircle,
  ShieldCheck,
  Users,
  Edit2,
  UserPlus,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useUser } from "@/src/providers/me";

const GET_GUARDIANS = gql`
  query GetGuardians($schoolId: ID!) {
    guardians(schoolId: $schoolId) {
      id
      fullName
      email
      phone
      role
      managedPlayers {
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

export default function GuardiansListPage() {
  const { user, loading: userLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Derivamos la escuela activa del usuario logueado
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const { data: guardiansData, loading: loadingGuardians }: any = useQuery(
    GET_GUARDIANS,
    {
      variables: { schoolId: activeSchoolId },
      skip: !activeSchoolId,
      fetchPolicy: "network-only",
    },
  );

  const filteredGuardians = useMemo(() => {
    if (!guardiansData?.guardians) return [];
    if (!searchTerm) return guardiansData.guardians;

    const lowerTerm = searchTerm.toLowerCase();
    return guardiansData.guardians.filter(
      (g: any) =>
        g.fullName.toLowerCase().includes(lowerTerm) ||
        g.email.toLowerCase().includes(lowerTerm) ||
        g.managedPlayers?.some(
          (p: any) =>
            p.firstName.toLowerCase().includes(lowerTerm) ||
            p.lastName.toLowerCase().includes(lowerTerm),
        ),
    );
  }, [guardiansData, searchTerm]);

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  if (userLoading || loadingGuardians) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-medium animate-pulse">
          Cargando padrón de familias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de Búsqueda */}
      <div className="relative max-w-lg">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por apoderado, hijo o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all shadow-sm font-medium text-slate-900"
        />
      </div>

      {/* Grid de Apoderados */}
      {filteredGuardians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGuardians.map((guardian: any) => (
            <div
              key={guardian.id}
              className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Header de la Tarjeta */}
              <div className="p-6 flex items-start justify-between border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#312E81] font-black text-xl border border-indigo-100 shadow-inner">
                      {guardian.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm">
                      <ShieldCheck className="w-5 h-5 text-[#10B981] fill-emerald-100" />
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-bold text-slate-900 text-base leading-tight mb-1 truncate max-w-[120px]"
                      title={guardian.fullName}
                    >
                      {guardian.fullName}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest">
                      Familia
                    </span>
                  </div>
                </div>
                <Link
                  href={`/dashboard/director/guardian/${guardian.id}/edit`}
                  className="text-slate-400 hover:text-[#312E81] p-2 rounded-xl hover:bg-indigo-50 transition-colors bg-white border border-slate-100 shadow-sm"
                >
                  <Edit2 size={16} />
                </Link>
              </div>

              {/* Información de Contacto */}
              <div className="px-6 py-5 space-y-3 flex-1">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate" title={guardian.email}>
                    {guardian.email}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div className="flex items-center justify-between w-full">
                    <span>{guardian.phone || "Sin registrar"}</span>
                    {guardian.phone && (
                      <button
                        onClick={() => openWhatsApp(guardian.phone)}
                        className="text-[#10B981] hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors border border-emerald-100"
                      >
                        <MessageCircle size={12} /> WA
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Hijos Asociados */}
              <div className="bg-slate-50 border-t border-slate-100 p-5 mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users size={14} /> Jugadores Vinculados
                </p>
                <div className="flex flex-wrap gap-2">
                  {guardian.managedPlayers?.length > 0 ? (
                    guardian.managedPlayers.map((player: any) => (
                      <span
                        key={player.id}
                        className="px-3 py-1.5 bg-white text-[#312E81] text-xs rounded-lg border border-slate-200 font-bold shadow-sm"
                      >
                        {player.firstName}{" "}
                        <span className="text-slate-400 font-medium">
                          ({player.category?.name})
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium">
                      Sin jugadores asignados
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="bg-slate-50 p-5 rounded-2xl mb-4 border border-slate-100">
            <UserPlus size={36} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchTerm ? "Sin resultados" : "Aún no hay familias registradas"}
          </h3>
          <p className="text-slate-500 max-w-sm text-center mb-6 font-medium">
            {searchTerm
              ? `Nadie coincide con la búsqueda "${searchTerm}".`
              : "Registra a los apoderados para que usen su App móvil y reciban avisos."}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/director/guardian/create"
              className="text-[#312E81] font-bold hover:underline"
            >
              Registrar familia &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
