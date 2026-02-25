"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Calendar,
  ChevronRight,
  Loader2,
  Megaphone,
  Search,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  ImageIcon,
} from "lucide-react";
import { useUser } from "@/src/providers/me";
import { useQuery } from "@apollo/client/react";

// --- GRAPHQL QUERY ---
// Actualizado para reflejar el modelo Prisma Notice
const GET_SCHOOL_NOTICES = gql`
  query GetSchoolNotices($schoolId: ID!) {
    notices(schoolId: $schoolId) {
      id
      title
      summary
      content
      image
      status
      views
      createdAt
    }
  }
`;

// --- INTERFACES ---
interface Notice {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string | null;
  status: string;
  views: number;
  createdAt: string;
}

export default function CoachNoticesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, error }: any = useQuery(GET_SCHOOL_NOTICES, {
    variables: { schoolId: user?.schoolId },
    skip: !user?.schoolId,
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) return <LoadingView />;
  if (error) return <ErrorView message={error.message} />;
  if (!user?.schoolId)
    return <ErrorView message="No tienes una escuela asignada." />;

  // Filtrar solo los publicados (los drafts los gestionaría un admin/director)
  const notices: Notice[] = (data?.notices || []).filter(
    (n: Notice) => n.status === "published",
  );

  // Lógica de búsqueda por título o resumen
  const filteredNotices = notices.filter((notice) => {
    const term = searchTerm.toLowerCase();
    return (
      notice.title.toLowerCase().includes(term) ||
      notice.summary.toLowerCase().includes(term) ||
      notice.content.toLowerCase().includes(term)
    );
  });

  // Ordenar por fecha de creación (más recientes primero)
  const sortedNotices = [...filteredNotices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Megaphone className="text-[#10B981]" size={36} />
            Tablón de Anuncios
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Mantente al día con las últimas comunicaciones de tu escuela.
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#312E81] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar en comunicados por título, resumen o contenido..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#312E81]/20 outline-none transition-all font-medium text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA DE AVISOS */}
      <div className="space-y-6">
        {sortedNotices.length > 0 ? (
          sortedNotices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))
        ) : (
          <div className="py-20 px-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
              <Bell className="text-gray-300" size={36} />
            </div>
            <h3 className="text-gray-900 font-bold text-xl">
              No hay comunicados
            </h3>
            <p className="text-gray-400 font-medium mt-2 max-w-md">
              {searchTerm
                ? "No encontramos ningún aviso que coincida con tu búsqueda."
                : "No hay comunicados publicados en este momento."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

function NoticeCard({ notice }: { notice: Notice }) {
  const formattedDate = format(
    new Date(notice.createdAt),
    "EEEE d 'de' MMMM, yyyy",
    { locale: es },
  );
  const formattedTime = format(new Date(notice.createdAt), "HH:mm");

  return (
    <div className="bg-white rounded-3xl border border-gray-100 hover:border-indigo-100 transition-all duration-300 hover:shadow-xl relative overflow-hidden group flex flex-col md:flex-row">
      {/* IMAGEN (Si existe) */}
      {notice.image && (
        <div className="md:w-1/3 lg:w-1/4 h-48 md:h-auto relative overflow-hidden shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100">
          <img
            src={notice.image}
            alt={notice.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* CONTENIDO */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Metadatos (Fecha, Vistas) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-3">
            <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-indigo-500">
                <Calendar size={14} />{" "}
                <span className="capitalize">{formattedDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold bg-gray-50 px-2.5 py-1 rounded-lg">
              <Eye size={14} /> {notice.views} vistas
            </div>
          </div>

          {/* Títulos y Textos */}
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-2 group-hover:text-[#312E81] transition-colors">
              {notice.title}
            </h2>
            <p className="text-[#10B981] font-bold text-sm mb-4 leading-snug">
              {notice.summary}
            </p>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {notice.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- VISTAS DE ESTADO ---

function LoadingView() {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2
          className="animate-spin text-[#312E81] relative z-10"
          size={56}
          strokeWidth={2.5}
        />
      </div>
      <p className="text-gray-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
        Cargando comunicados...
      </p>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto p-8 text-center bg-red-50 rounded-3xl border border-red-100 mt-12 shadow-sm">
      <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
      <h2 className="text-red-700 font-black text-xl mb-2 uppercase tracking-tight">
        Error al cargar los avisos
      </h2>
      <p className="text-red-500/80 font-medium">{message}</p>
    </div>
  );
}
