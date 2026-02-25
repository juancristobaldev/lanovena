"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  CalendarDays,
  Search,
  AlertCircle,
  Loader2,
  Newspaper,
  ChevronRight,
  Eye,
  X,
  Clock,
} from "lucide-react";
import { useUser } from "@/src/providers/me";
import { useQuery } from "@apollo/client/react";

// --- GRAPHQL QUERY ---
const GET_GUARDIAN_NOTICES = gql`
  query GetGuardianNotices($schoolId: ID!) {
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

export default function GuardianNoticesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const { data, loading, error }: any = useQuery(GET_GUARDIAN_NOTICES, {
    variables: { schoolId: user?.schoolId },
    skip: !user?.schoolId,
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) return <LoadingView />;
  if (error) return <ErrorView message={error.message} />;
  if (!user?.schoolId)
    return <ErrorView message="No tienes una escuela asignada." />;

  // Filtrar solo los publicados
  const notices: Notice[] = (data?.notices || []).filter(
    (n: Notice) => n.status === "published",
  );

  // Búsqueda
  const filteredNotices = notices.filter((notice) => {
    const term = searchTerm.toLowerCase();
    return (
      notice.title.toLowerCase().includes(term) ||
      notice.summary.toLowerCase().includes(term)
    );
  });

  // Ordenar por fecha (más recientes primero)
  const sortedNotices = [...filteredNotices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Separar el aviso destacado (el más reciente) del resto
  const featuredNotice = sortedNotices.length > 0 ? sortedNotices[0] : null;
  const regularNotices = sortedNotices.length > 1 ? sortedNotices.slice(1) : [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
            <Newspaper className="text-[#312E81]" size={32} />
            Mural de Noticias
          </h1>
          <p className="text-gray-500 font-medium">
            Entérate de las últimas novedades, eventos y comunicados de la
            escuela.
          </p>
        </div>

        <div className="w-full md:w-96 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#10B981] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar noticias..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#10B981]/30 focus:ring-4 focus:ring-[#10B981]/10 outline-none transition-all font-medium text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {sortedNotices.length === 0 ? (
        <EmptyState hasSearchTerm={searchTerm.length > 0} />
      ) : (
        <div className="space-y-8">
          {/* AVISO DESTACADO (Hero) */}
          {featuredNotice && !searchTerm && (
            <section>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 px-2">
                Lo más reciente
              </h2>
              <div
                onClick={() => setSelectedNotice(featuredNotice)}
                className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col md:flex-row"
              >
                {/* Imagen Destacada */}
                <div className="md:w-1/2 lg:w-3/5 h-64 md:h-auto relative overflow-hidden bg-gray-100">
                  {featuredNotice.image ? (
                    <img
                      src={featuredNotice.image}
                      alt={featuredNotice.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#312E81] to-[#10B981] opacity-90 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                      <Newspaper size={64} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md">
                      Nuevo
                    </span>
                  </div>
                </div>

                {/* Contenido Destacado */}
                <div className="p-8 md:p-10 flex flex-col justify-center md:w-1/2 lg:w-2/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <CalendarDays size={16} className="text-[#312E81]" />
                    {format(new Date(featuredNotice.createdAt), "d 'de' MMMM", {
                      locale: es,
                    })}
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4 group-hover:text-[#312E81] transition-colors">
                    {featuredNotice.title}
                  </h3>

                  <p className="text-gray-500 font-medium leading-relaxed mb-8 line-clamp-3">
                    {featuredNotice.summary}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[#312E81] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Leer comunicado completo <ChevronRight size={18} />
                    </span>
                    <span className="flex items-center gap-1 text-gray-300 text-xs font-bold">
                      <Eye size={14} /> {featuredNotice.views}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* GRILLA DE AVISOS ANTERIORES */}
          {regularNotices.length > 0 && (
            <section>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 px-2">
                {searchTerm ? "Resultados de búsqueda" : "Noticias Anteriores"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularNotices.map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => setSelectedNotice(notice)}
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
                  >
                    {/* Imagen Card */}
                    <div className="h-48 relative overflow-hidden bg-gray-50">
                      {notice.image ? (
                        <img
                          src={notice.image}
                          alt={notice.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                          <Newspaper size={40} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Contenido Card */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <CalendarDays size={14} />
                        {format(new Date(notice.createdAt), "d MMM, yyyy", {
                          locale: es,
                        })}
                      </div>

                      <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-[#312E81] transition-colors line-clamp-2">
                        {notice.title}
                      </h3>

                      <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2 flex-1">
                        {notice.summary}
                      </p>

                      <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between text-xs font-bold">
                        <span className="text-[#10B981] group-hover:text-emerald-600 transition-colors">
                          Leer más
                        </span>
                        <span className="text-gray-300 flex items-center gap-1">
                          <Eye size={12} /> {notice.views}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* MODAL DE LECTURA DE NOTICIA */}
      {selectedNotice && (
        <NoticeModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function NoticeModal({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  // Bloquear el scroll del body cuando el modal está abierto
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Contenedor Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Botón Cerrar Flotante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/10 hover:bg-black/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {/* Cabecera / Imagen */}
          {notice.image ? (
            <div className="w-full h-64 sm:h-80 relative">
              <img
                src={notice.image}
                alt={notice.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />{" "}
                    {format(
                      new Date(notice.createdAt),
                      "EEEE d 'de' MMMM, yyyy",
                      { locale: es },
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />{" "}
                    {format(new Date(notice.createdAt), "HH:mm")}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  {notice.title}
                </h2>
              </div>
            </div>
          ) : (
            <div className="px-8 pt-12 pb-6 bg-gradient-to-br from-indigo-50 to-emerald-50">
              <div className="flex items-center gap-3 text-[#312E81]/60 text-xs font-bold uppercase tracking-wider mb-4">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} />{" "}
                  {format(
                    new Date(notice.createdAt),
                    "EEEE d 'de' MMMM, yyyy",
                    { locale: es },
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />{" "}
                  {format(new Date(notice.createdAt), "HH:mm")}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#312E81] leading-tight">
                {notice.title}
              </h2>
            </div>
          )}

          {/* Cuerpo de la Noticia */}
          <div className="p-8 sm:p-10">
            <div className="prose prose-lg prose-indigo max-w-none">
              <p className="text-xl font-medium text-gray-600 leading-relaxed mb-8 border-l-4 border-[#10B981] pl-4">
                {notice.summary}
              </p>

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {notice.content}
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
            <Eye size={16} /> Visto {notice.views} veces
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasSearchTerm }: { hasSearchTerm: boolean }) {
  return (
    <div className="py-24 px-6 bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <Bell className="text-gray-300" size={40} />
      </div>
      <h3 className="text-gray-900 font-black text-2xl mb-2">
        No hay noticias
      </h3>
      <p className="text-gray-500 font-medium max-w-md">
        {hasSearchTerm
          ? "No encontramos ninguna noticia que coincida con tu búsqueda. Intenta con otras palabras."
          : "El mural está vacío por ahora. Te avisaremos cuando la escuela publique nuevos comunicados."}
      </p>
    </div>
  );
}

// --- VISTAS DE ESTADO ---

function LoadingView() {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 bg-[#312E81] blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2
          className="animate-spin text-[#312E81] relative z-10"
          size={56}
          strokeWidth={2.5}
        />
      </div>
      <p className="text-gray-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
        Cargando mural...
      </p>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto p-8 text-center bg-red-50 rounded-[2rem] border border-red-100 mt-12 shadow-sm">
      <AlertCircle className="mx-auto text-red-500 mb-4" size={56} />
      <h2 className="text-red-700 font-black text-2xl mb-2 tracking-tight">
        Error de conexión
      </h2>
      <p className="text-red-500/80 font-medium">{message}</p>
    </div>
  );
}
