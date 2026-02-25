"use client";

import React, { useState, useMemo, useEffect } from "react";
import { gql } from "@apollo/client";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  School,
  ChevronDown,
  Loader2,
  X,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { useUser } from "@/src/providers/me";
import { useMutation, useQuery } from "@apollo/client/react";

// --- GRAPHQL OPERATIONS ---
const GET_NOTICES = gql`
  query GetNotices($schoolId: ID!) {
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

const CREATE_NOTICE = gql`
  mutation CreateNotice($input: CreateNoticeInput!) {
    createNotice(input: $input) {
      id
    }
  }
`;

const UPDATE_NOTICE = gql`
  mutation UpdateNotice($id: ID!, $input: UpdateNoticeInput!) {
    updateNotice(id: $id, input: $input) {
      id
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

export default function DirectorNoticesPage() {
  const { user, loading: userLoading } = useUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Estados para Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  // --- LÓGICA DE SELECCIÓN DE ESCUELAS ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- CONSULTAS Y MUTACIONES ---
  const { data, loading, refetch }: any = useQuery(GET_NOTICES, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "cache-and-network",
  });

  const [deleteNotice] = useMutation(DELETE_NOTICE, {
    onCompleted: () => refetch(),
  });

  const notices = data?.notices || [];
  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  // --- FILTRADO EN CLIENTE ---
  const filteredNotices = notices.filter((n: any) => {
    const matchesSearch = n.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta noticia?")) {
      await deleteNotice({ variables: { id } });
    }
  };

  const handleOpenModal = (notice: any = null) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500 font-sans">
      {/* 1. HEADER & SELECTOR DE ESCUELAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-[#10B981]" />
            Vida del Club
          </h1>
          <p className="text-gray-500 text-lg">
            Muro social y noticias destacadas para la comunidad.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {availableSchools.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 flex items-center gap-3 min-w-[260px] w-full sm:w-auto">
              <div className="bg-indigo-50 p-2.5 rounded-lg">
                <School className="w-5 h-5 text-[#312E81]" />
              </div>
              <div className="relative flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Sede Seleccionada
                </span>
                {availableSchools.length > 1 ? (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="bg-transparent font-bold text-[#312E81] text-base outline-none w-full appearance-none cursor-pointer"
                  >
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-[#312E81] text-base block truncate">
                    {currentSchool?.name}
                  </span>
                )}
              </div>
              {availableSchools.length > 1 && (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95 w-full sm:w-auto"
          >
            <Plus size={20} strokeWidth={3} />
            Nueva Noticia
          </button>
        </div>
      </div>

      {/* 2. FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por título..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg text-sm font-semibold focus:outline-none w-full md:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
      </div>

      {/* 3. GRID DE NOTICIAS */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredNotices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotices.map((notice: any) => (
            <div
              key={notice.id}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Imagen con Badge */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {notice.image ? (
                  <img
                    src={notice.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  {notice.status === "published" ? (
                    <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-emerald-100">
                      <CheckCircle2 size={12} /> Publicado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-amber-100">
                      <Clock size={12} /> Borrador
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                    <Eye size={14} /> {notice.views}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-[#312E81] transition-colors">
                  {notice.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                  {notice.summary}
                </p>

                {/* Acciones */}
                <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(notice)}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Editar noticia"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar noticia"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button className="text-xs font-black text-indigo-600 hover:translate-x-1 transition-transform flex items-center gap-1">
                    LEER MÁS
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL DE CREACIÓN/EDICIÓN */}
      {isModalOpen && (
        <NoticeFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          notice={selectedNotice}
          schoolId={selectedSchoolId}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENTES AUXILIARES ---

function NoticeFormModal({
  isOpen,
  onClose,
  notice,
  schoolId,
  onSuccess,
}: any) {
  const [formData, setFormData] = useState({
    title: notice?.title || "",
    summary: notice?.summary || "",
    content: notice?.content || "",
    image: notice?.image || "",
    status: notice?.status || "draft",
  });

  const [create] = useMutation(CREATE_NOTICE);
  const [update] = useMutation(UPDATE_NOTICE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (notice) {
        await update({ variables: { id: notice.id, input: formData } });
      } else {
        await create({ variables: { input: { ...formData, schoolId } } });
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error al procesar la noticia");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-900">
            {notice ? "Editar Publicación" : "Crear Nueva Noticia"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-5 max-h-[80vh] overflow-y-auto hide-scrollbar"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Título de la noticia
            </label>
            <input
              required
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ej: ¡Campeones Copa Araucanía Sub-12!"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Resumen (Muro social)
            </label>
            <textarea
              required
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium h-20 resize-none"
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              placeholder="Descripción corta para atraer a los apoderados..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Contenido Extendido
            </label>
            <textarea
              required
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium h-44"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Escribe todo el detalle de la noticia aquí..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                URL de Imagen
              </label>
              <div className="relative">
                <ImageIcon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  size={18}
                />
                <input
                  className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://images.unsplash..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Estado
              </label>
              <select
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-[#312E81] outline-none"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="draft">Borrador (Solo tú)</option>
                <option value="published">Publicado (Toda la escuela)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-[#312E81] text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {notice ? "Guardar Cambios" : "Publicar Noticia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-[#312E81]" />
      <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">
        Cargando noticias...
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-96 bg-gray-50 animate-pulse rounded-[32px]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
      <div className="bg-white p-6 rounded-full shadow-sm mb-4">
        <Megaphone size={48} className="text-gray-200" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">No hay noticias aún</h3>
      <p className="text-gray-500 max-w-xs mt-2">
        ¡Comienza a publicar los logros de tu academia para motivar a los
        alumnos!
      </p>
    </div>
  );
}
