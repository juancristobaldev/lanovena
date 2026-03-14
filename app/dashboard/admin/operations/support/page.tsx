"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  LifeBuoy,
  Loader2,
  AlertTriangle,
  Reply,
  Clock,
  User,
  Mail,
  CheckCircle2,
  Ticket,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_SUPPORT_TICKETS = gql`
  query GetSupportTickets {
    adminSupportTickets {
      id
      title
      message
      createdAt
      user {
        fullName
        email
        role
      }
    }
  }
`;

// ==========================================
// 2. TIPOS DE DATOS
// ==========================================
interface SupportUser {
  fullName: string;
  email: string;
  role: string;
}

interface SupportTicket {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  user: SupportUser;
}

// Diccionario de roles para las etiquetas visuales
const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  DIRECTOR: { label: "Director", color: "bg-emerald-100 text-emerald-700" },
  COACH: { label: "Entrenador", color: "bg-blue-100 text-blue-700" },
  PLAYER: {
    label: "Apoderado/Jugador",
    color: "bg-orange-100 text-orange-700",
  },
  SUBADMIN: { label: "Macro Entidad", color: "bg-indigo-100 text-indigo-700" },
  SUPERADMIN: { label: "Staff", color: "bg-slate-800 text-white" },
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function SupportPage() {
  const { data, loading, error, refetch }: any = useQuery(GET_SUPPORT_TICKETS, {
    fetchPolicy: "cache-and-network",
  });

  // Utilidad para formatear fechas
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr`;
    return `Hace ${diffDays} días`;
  };

  if (loading && !data) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-rose-600" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Cargando bandeja de soporte...
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
            <h3 className="font-black text-lg">Error al cargar tickets</h3>
            <p className="text-sm font-medium mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const tickets: SupportTicket[] = data?.adminSupportTickets || [];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="text-rose-500" /> Mesa de Ayuda (Soporte
            Técnico)
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Atención de reportes, dudas y fallos del sistema reportados por los
            usuarios.
          </p>
        </div>

        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Ticket size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Tickets Abiertos
            </p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {tickets.length}
            </p>
          </div>
        </div>
      </div>

      {/* BANDEJA DE TICKETS */}
      <div className="space-y-4 max-w-5xl">
        {tickets.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="font-black text-xl text-slate-800">
              ¡Bandeja al día!
            </h3>
            <p className="font-medium text-slate-500 mt-2">
              No hay tickets de soporte pendientes por responder en este
              momento.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const roleBadge = ROLE_BADGES[ticket.user.role] || {
              label: ticket.user.role,
              color: "bg-slate-100 text-slate-600",
            };

            return (
              <div
                key={ticket.id}
                className="bg-white p-6 rounded-[1.5rem] border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md hover:border-l-rose-600 transition-all group"
              >
                <div className="flex items-start gap-5 flex-1">
                  {/* Avatar / Inicial */}
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black text-lg shrink-0 border border-slate-200 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                    {ticket.user.fullName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info del Ticket */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-black text-lg text-slate-900 leading-tight">
                        {ticket.title}
                      </h4>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                        ID: {ticket.id.split("-")[0]}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{ticket.message}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User size={14} className="text-slate-400" />
                        {ticket.user.fullName}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md ${roleBadge.color}`}
                      >
                        {roleBadge.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {formatTimeAgo(ticket.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0 items-center md:items-stretch">
                  <a
                    href={`mailto:${ticket.user.email}?subject=RE: ${ticket.title} (Ticket Soporte La Novena)`}
                    className="flex-1 flex justify-center items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    <Reply size={16} strokeWidth={3} /> Responder
                  </a>
                  <button
                    onClick={() =>
                      alert(`Copiando correo: ${ticket.user.email}`)
                    }
                    className="flex justify-center items-center gap-2 bg-white text-slate-500 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    title="Copiar correo"
                  >
                    <Mail size={16} /> Correo
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
