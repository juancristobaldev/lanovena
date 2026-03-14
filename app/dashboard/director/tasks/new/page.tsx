"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ArrowLeft,
  Loader2,
  Flag,
  Calendar,
  AlignLeft,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/src/providers/me";

const CREATE_TASK = gql`
  mutation CreateTask(
    $schoolId: String!
    $title: String!
    $priority: TaskPriority!
    $description: String
    $dueDate: DateTime
    $assignedToUserId: String
  ) {
    createTask(
      schoolId: $schoolId
      title: $title
      priority: $priority
      dueDate: $dueDate
      assignedToUserId: $assignedToUserId

      description: $description
    ) {
      id
    }
  }
`;

const GET_COACH_BY_SCHOOL_ID = gql`
  query getCoachsBySchoolId($schoolId: String!) {
    getCoachsBySchoolId(schoolId: $schoolId) {
      id
      fullName
      email
      role
      coachProfile {
        categories {
          id
          name
        }
      }
    }
  }
`;

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useUser();

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedToUserId: "",
    dueDate: today,
  });
  const [createTask, { loading: isCreating }] = useMutation(CREATE_TASK);

  // Fallback para schoolId. En un entorno real idealmente se extrae de un Store global.
  const activeSchoolId =
    user?.schools?.[0]?.school?.id || user?.schools?.[0]?.id;

  const { data, loading, error }: any = useQuery(GET_COACH_BY_SCHOOL_ID, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
    fetchPolicy: "cache-and-network",
  });

  const coachs = useMemo(() => {
    if (!data || loading) return null;
    if (data && !loading) {
      const coachs: any = data.getCoachsBySchoolId?.length
        ? data.getCoachsBySchoolId
        : [];
      return coachs?.map((c: any) => ({
        label: c.fullName,
        value: c.id,
      }));
    }
  }, [data, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !activeSchoolId) return;

    console.log({ formData });
    try {
      await createTask({
        variables: {
          schoolId: activeSchoolId,
          title: formData.title.trim(),
          assignedToUserId: formData.assignedToUserId || null,
          description: formData.description.trim() || null,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
        },
      });
      router.push("/dashboard/director/tasks");
      router.refresh();
    } catch (err) {
      console.error("Error al crear la tarea:", err);
      // Aquí podrías usar un toast notification en lugar del alert nativo
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Botón Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard/director/tasks"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#312E81] transition-colors"
        >
          <ArrowLeft size={16} /> Volver al tablero
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden"
      >
        {/* Header del Formulario */}
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-black text-slate-900">
            Registrar Nueva Tarea
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Asigna actividades y haz seguimiento al trabajo del cuerpo técnico.
          </p>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-8 space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> Título de la tarea
            </label>
            <input
              type="text"
              autoFocus
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all font-bold"
              placeholder="Ej. Revisar inventario de petos categoría Sub-12..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          {/* Título */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> Responsable
            </label>
            <select
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all font-bold appearance-none cursor-pointer"
              value={formData.assignedToUserId}
              onChange={(e) => {
                console.log(e.target.value);
                setFormData({ ...formData, assignedToUserId: e.target.value });
              }}
            >
              <option value={""}>Ninguno</option>
              {coachs?.map((c: any, i: number) => (
                <option key={i} label={`${c.label} - Coach`} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </div>

          {/* Fila: Prioridad y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Flag size={14} /> Prioridad
              </label>
              <select
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all font-bold appearance-none cursor-pointer"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="LOW">Baja - Sin apuro</option>
                <option value="MEDIUM">Media - Seguimiento normal</option>
                <option value="HIGH">Alta - Requiere atención urgente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Fecha Límite (Opcional)
              </label>
              <input
                type="date"
                min={today}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 transition-all font-bold"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlignLeft size={14} /> Descripción / Notas
            </label>
            <textarea
              rows={4}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] transition-all font-medium resize-none leading-relaxed"
              placeholder="Añade instrucciones, enlaces a documentos o contexto necesario para completar esta tarea..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* Footer / Acciones */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/director/tasks"
            className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!formData.title.trim() || isCreating}
            className="px-6 py-3 bg-[#312E81] text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-[#282566] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Guardando...
              </>
            ) : (
              "Crear Tarea"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
