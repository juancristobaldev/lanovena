"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  Watch,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  Activity,
  Ruler,
  CheckCircle2,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL
// ==========================================
const GET_TEST_PROTOCOLS = gql`
  query GetAdminTestProtocols {
    getAvailableTestProtocols {
      id
      name
      description
      category
      unit
      isGlobal
    }
  }
`;

const CREATE_TEST_PROTOCOL = gql`
  mutation AdminCreateTestProtocol($input: CreateTestProtocolInput!) {
    createTestProtocol(input: $input) {
      id
      name
      category
      unit
    }
  }
`;

// ==========================================
// 2. TIPOS DE DATOS Y MAPEOS
// ==========================================
interface TestProtocol {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  isGlobal: boolean;
}

// Diccionarios para mostrar textos amigables al administrador
const UNIT_LABELS: Record<string, string> = {
  SECONDS: "Segundos (Tiempo)",
  METERS: "Metros (Distancia)",
  CENTIMETERS: "Centímetros (Distancia)",
  POINTS: "Puntos (Puntuación)",
  PERCENTAGE: "Porcentaje (%)",
  COUNT: "Repeticiones / Niveles",
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  PHYSICAL: { label: "Físico", color: "bg-blue-100 text-blue-700" },
  TECHNICAL: { label: "Técnico", color: "bg-emerald-100 text-emerald-700" },
  TACTICAL: { label: "Táctico", color: "bg-indigo-100 text-indigo-700" },
  PSYCHOLOGICAL: {
    label: "Psicológico",
    color: "bg-purple-100 text-purple-700",
  },
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function TestsBankPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "PHYSICAL",
    unit: "SECONDS",
    isGlobal: true,
  });

  const { data, loading, error, refetch }: any = useQuery(GET_TEST_PROTOCOLS, {
    fetchPolicy: "cache-and-network",
  });

  const [createTest, { loading: creating }] = useMutation(
    CREATE_TEST_PROTOCOL,
    {
      onCompleted: () => {
        alert("Protocolo de evaluación creado exitosamente.");
        setIsModalOpen(false);
        setFormData({
          name: "",
          description: "",
          category: "PHYSICAL",
          unit: "SECONDS",
          isGlobal: true,
        });
        refetch();
      },
      onError: (err: any) => alert("Error al crear el test: " + err.message),
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTest({
      variables: {
        input: formData,
      },
    });
  };

  if (loading && !data) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Cargando banco de pruebas...
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
            <h3 className="font-black text-lg">Error de conexión</h3>
            <p className="text-sm font-medium mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const protocols: TestProtocol[] = data?.getAvailableTestProtocols || [];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Watch className="text-emerald-500" /> Banco de Evaluaciones
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Crea los estándares de medición (Físicos, Técnicos) que todos los
            entrenadores usarán.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition"
        >
          <Plus size={18} strokeWidth={3} /> Crear Nuevo Test
        </button>
      </div>

      {/* LISTA DE PROTOCOLOS */}
      {protocols.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center shadow-sm max-w-md mx-auto border border-slate-200 mt-10">
          <Watch className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-800 text-xl">
            Sin pruebas registradas
          </h3>
          <p className="text-slate-500 mt-2 text-sm">
            Aún no has creado ningún protocolo de evaluación global para las
            escuelas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols.map((test) => {
            const catInfo = CATEGORY_LABELS[test.category] || {
              label: test.category,
              color: "bg-slate-100 text-slate-700",
            };

            return (
              <div
                key={test.id}
                className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors flex flex-col"
              >
                <span
                  className={`absolute top-5 right-5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${catInfo.color}`}
                >
                  {catInfo.label}
                </span>

                <h4 className="text-lg font-black text-slate-900 mb-1 pr-16 leading-tight">
                  {test.name}
                </h4>
                <p className="text-xs text-slate-500 mb-6 line-clamp-3 leading-relaxed flex-1">
                  {test.description}
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Ruler size={12} /> Métrica Principal
                  </p>
                  <p className="text-sm font-bold text-indigo-600">
                    {UNIT_LABELS[test.unit] || test.unit}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  {test.isGlobal && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest">
                      <CheckCircle2 size={12} /> Global
                    </span>
                  )}
                  <button className="py-2 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors ml-auto">
                    Editar Protocolo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CREACIÓN DE TEST */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2">
                  <Activity className="text-emerald-400" /> Nuevo Protocolo
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura los parámetros de la evaluación deportiva.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nombre del Test
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Velocidad 20 Metros, Yo-Yo Test..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 text-slate-900 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 text-slate-700 cursor-pointer"
                  >
                    <option value="PHYSICAL">
                      Físico (Resistencia, Velocidad...)
                    </option>
                    <option value="TECHNICAL">
                      Técnico (Pases, Dominio...)
                    </option>
                    <option value="TACTICAL">Táctico</option>
                    <option value="PSYCHOLOGICAL">Psicológico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 text-slate-700 cursor-pointer"
                  >
                    <option value="SECONDS">Segundos (Tiempo)</option>
                    <option value="METERS">Metros (Distancia Larga)</option>
                    <option value="CENTIMETERS">
                      Centímetros (Saltos/Flexibilidad)
                    </option>
                    <option value="COUNT">Repeticiones / Niveles</option>
                    <option value="POINTS">Puntos de calificación</option>
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Descripción e Instrucciones
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explica cómo se debe ejecutar el test, desde dónde se parte, qué cuenta como falta, etc."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-emerald-500 text-slate-700 resize-none transition-colors"
                ></textarea>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) =>
                      setFormData({ ...formData, isGlobal: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <label htmlFor="isGlobal" className="cursor-pointer">
                  <p className="text-sm font-black text-emerald-900">
                    Distribuir Globalmente
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Si está activo, todas las escuelas y entrenadores de la red
                    La Novena tendrán acceso inmediato a este test.
                  </p>
                </label>
              </div>
            </form>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? "Guardando..." : "Guardar Protocolo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
