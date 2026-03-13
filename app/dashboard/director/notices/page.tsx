"use client";

import React, { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Megaphone,
} from "lucide-react";
import { useUser } from "@/src/providers/me";
import { useRouter } from "next/navigation";

const GET_NOTICES = gql`
  query GetNotices($schoolId: ID!) {
    notices(schoolId: $schoolId) {
      id
      title
      summary
      image
      status
      views
      createdAt
    }
  }
`;

const DELETE_NOTICE = gql`
  mutation DeleteNotice($id: ID!) {
    deleteNotice(id: $id) {
      id
    }
  }
`;

export default function NoticesListPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // NOTA DEV: En un entorno real, este selectedSchoolId debería venir de la URL o un Global Store
  // que es actualizado por el Layout. Aquí usamos un fallback seguro.
  const selectedSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools.length > 0 ? schools[0].school?.id || schools[0].id : null;
  }, [user]);

  const { data, loading, refetch }: any = useQuery(GET_NOTICES, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "cache-and-network",
  });

  const [deleteNotice] = useMutation(DELETE_NOTICE, {
    onCompleted: () => refetch(),
  });

  const notices = data?.notices || [];

  const filteredNotices = notices.filter((n: any) => {
    const matchesSearch = n.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    // TODO: Reemplazar por un Modal de Confirmación UI nativo
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar permanentemente esta noticia?",
      )
    ) {
      await deleteNotice({ variables: { id } });
    }
  };

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* BARRA DE HERRAMIENTAS (Filtros y Búsqueda) */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar comunicados..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 pr-2">
          <select
            className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 w-full sm:w-48 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
          </select>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredNotices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNotices.map((notice: any) => (
            <article
              key={notice.id}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col"
            >
              {/* Imagen (Aspect Ratio forzado para evitar rotura de layout) */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                {notice.image ? (
                  // Idealmente usar <Image /> de next/image
                  <img
                    src={notice.image}
                    alt={notice.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 bg-slate-50">
                    <ImageIcon size={40} strokeWidth={1.5} />
                  </div>
                )}

                {/* Badge de Estado */}
                <div className="absolute top-4 left-4">
                  {notice.status === "published" ? (
                    <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-[#10B981] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-emerald-100">
                      <CheckCircle2 size={12} strokeWidth={3} /> Publicado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-amber-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-amber-100">
                      <Clock size={12} strokeWidth={3} /> Borrador
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(notice.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                    <Eye size={14} /> {notice.views || 0}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#312E81] transition-colors">
                  {notice.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed font-medium">
                  {notice.summary}
                </p>

                {/* Acciones Footer */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1 -ml-2">
                    {/* El botón editar te lleva a la vista nueva pasándole el ID */}
                    <Link
                      href={`/dashboard/director/notices/new?id=${notice.id}`}
                      className="p-2 text-slate-400 hover:text-[#312E81] hover:bg-indigo-50 rounded-lg transition-all"
                      title="Editar noticia"
                    >
                      <Pencil size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar noticia"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button className="text-[11px] font-black text-[#312E81] uppercase tracking-widest hover:text-[#10B981] transition-colors">
                    Ver Detalle
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// Subcomponentes de UI...
function LoadingSpinner() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-80 bg-white border border-slate-100 shadow-sm animate-pulse rounded-3xl"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-24 flex flex-col items-center text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
      <div className="bg-slate-50 p-6 rounded-full shadow-inner mb-4">
        <Megaphone size={40} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-black text-slate-900">
        No hay comunicados activos
      </h3>
      <p className="text-slate-500 max-w-sm mt-2 font-medium">
        Mantén a tu comunidad informada. Crea tu primera noticia para que los
        apoderados la vean en su app.
      </p>
    </div>
  );
}
