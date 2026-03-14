"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, Search, Mail, Edit2, Trophy, UserCog } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useUser } from "@/src/providers/me";

const GET_COACHES = gql`
  query GetCoaches($schoolId: ID!) {
    coaches(schoolId: $schoolId) {
      id
      fullName
      email
      role
      coachProfile {
        id
        categories {
          id
          name
        }
      }
    }
  }
`;

export default function CoachesListPage() {
  const { user, loading: userLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Derivamos la escuela por defecto (Nota: Idealmente esto debería venir de un Context
  // si quieres que el selector del Layout controle la data de la página).
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools[0]?.school?.id || schools[0]?.id || null;
  }, [user]);

  const { data: coachesData, loading: loadingCoaches }: any = useQuery(
    GET_COACHES,
    {
      variables: { schoolId: activeSchoolId },
      skip: !activeSchoolId,
      fetchPolicy: "network-only",
    },
  );

  const filteredCoaches = useMemo(() => {
    if (!coachesData?.coaches) return [];
    if (!searchTerm) return coachesData.coaches;
    return coachesData.coaches.filter(
      (c: any) =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [coachesData, searchTerm]);

  if (userLoading || loadingCoaches) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-medium animate-pulse">
          Cargando staff técnico...
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
          placeholder="Buscar profesor por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all shadow-sm font-medium text-slate-900"
        />
      </div>

      {/* Grid de Entrenadores */}
      {filteredCoaches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach: any) => (
            <div
              key={coach.id}
              className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Header de la Tarjeta (Gradient Landing) */}
              <div className="h-24 bg-gradient-to-r from-slate-900 to-[#312E81] relative">
                <div className="absolute -bottom-8 left-6">
                  <div className="w-16 h-16 bg-white p-1 rounded-2xl shadow-lg">
                    <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-[#312E81] font-black text-2xl border border-indigo-100">
                      {coach.fullName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Link
                    href={`/dashboard/director/coachs/coach/${coach.id}`}
                    className="bg-white/10 hover:bg-white text-white hover:text-[#312E81] p-2.5 rounded-xl transition-colors backdrop-blur-sm block"
                  >
                    <Edit2 size={16} />
                  </Link>
                </div>
              </div>

              {/* Contenido */}
              <div className="pt-12 px-6 pb-6 flex-1 flex flex-col">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                    {coach.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{coach.email}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={14} className="text-[#10B981]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Series a cargo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coach.coachProfile?.categories?.length > 0 ? (
                      coach.coachProfile.categories.map((cat: any) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-[#312E81] border border-indigo-100/50"
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">
                        Sin asignaciones
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
            <UserCog size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchTerm ? "Sin resultados" : "Tu cuerpo técnico está vacío"}
          </h3>
          <p className="text-slate-500 max-w-sm text-center mb-6 font-medium">
            {searchTerm
              ? `No encontramos a nadie llamado "${searchTerm}".`
              : "Comienza a estructurar tu escuela invitando a tu primer profesor."}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/director/coachs/new"
              className="text-[#312E81] font-bold hover:underline"
            >
              Invitar ahora &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
