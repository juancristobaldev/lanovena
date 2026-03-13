"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/src/providers/me";

// NOTA: Para editar, idealmente tendrías un query GET_NOTICE_BY_ID.
// Aquí simularemos el uso de las mutaciones.
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

const NoticeEditorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeId = searchParams.get("id"); // Si hay ID, es modo edición
  const { user } = useUser();

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    image: "",
    status: "draft",
  });

  const [create, { loading: creating }] = useMutation(CREATE_NOTICE);
  const [update, { loading: updating }] = useMutation(UPDATE_NOTICE);

  const isProcessing = creating || updating;

  // Lógica de escuela (Mismo concepto, requiere conexión real con tu store)
  const schoolId = user?.schools?.[0]?.school?.id || user?.schools?.[0]?.id;

  const handleSubmit = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    if (!schoolId) return alert("Error: No se encontró la escuela activa.");

    const finalStatus = forceStatus || formData.status;
    const inputPayload = { ...formData, status: finalStatus, schoolId };

    try {
      if (noticeId) {
        await update({ variables: { id: noticeId, input: inputPayload } });
      } else {
        await create({ variables: { input: inputPayload } });
      }
      router.push("/dashboard/director/notices");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la noticia.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Botón Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard/director/notices"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#312E81] transition-colors"
        >
          <ArrowLeft size={16} /> Volver al muro
        </Link>
      </div>

      <form
        onSubmit={(e) => handleSubmit(e)}
        className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden"
      >
        {/* Editor Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {noticeId ? "Editar Comunicado" : "Redactar Nuevo Comunicado"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              La información publicada será visible para todos los apoderados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
            >
              <Save size={16} /> Guardar Borrador
            </button>
            <button
              type="submit"
              onClick={() =>
                setFormData((prev) => ({ ...prev, status: "published" }))
              }
              disabled={isProcessing}
              className="px-5 py-2.5 bg-[#312E81] text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-[#282566] transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Publicar Ahora
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="p-8 space-y-8">
          {/* Título Principal */}
          <div>
            <input
              required
              type="text"
              className="w-full text-3xl font-black text-slate-900 placeholder-slate-300 outline-none bg-transparent"
              placeholder="Escribe un título impactante aquí..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <hr className="border-slate-100" />

          {/* Resumen & URL Imagen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Resumen Breve
              </label>
              <textarea
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 outline-none font-medium text-sm h-24 resize-none transition-all"
                placeholder="Un par de líneas introductorias para captar la atención..."
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Portada (URL de la imagen)
              </label>
              <div className="relative">
                <ImageIcon
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  type="url"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 outline-none font-medium text-sm transition-all"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                />
              </div>
              {formData.image && (
                <div className="mt-2 h-14 rounded-lg overflow-hidden border border-slate-200 relative w-24">
                  {/* Vista previa miniatura */}
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cuerpo de la Noticia */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Contenido Completo
            </label>
            <textarea
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#312E81]/20 outline-none font-medium leading-relaxed min-h-[300px] resize-y transition-all"
              placeholder="Desarrolla el contenido completo del comunicado. Soporta múltiples párrafos..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NoticeEditorPage />
    </Suspense>
  );
}
