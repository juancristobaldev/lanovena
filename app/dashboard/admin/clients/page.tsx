"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  ShieldCheck,
  Plus,
  X,
  Calculator,
  Building2,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Mutación para crear Macro Entidades según tu Resolver
const CREATE_MACRO_ENTITY = gql`
  mutation AdminCreateMacroEntity($data: CreateMacroEntityInput!) {
    adminCreateMacroEntity(data: $data) {
      id
      name
    }
  }
`;

export default function ClientsHubPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenantLevel, setTenantLevel] = useState<"subadmin" | "director">(
    "director",
  );
  const [cupos, setCupos] = useState<number>(0);

  const [createMacroEntity, { loading }] = useMutation(CREATE_MACRO_ENTITY, {
    onCompleted: () => {
      alert("Macro Entidad creada con éxito. Se han enviado las credenciales.");
      setIsModalOpen(false);
    },
    onError: (err) => alert("Error al crear: " + err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantLevel === "subadmin") {
      // Datos mockeados para el ejemplo del formulario
      createMacroEntity({
        variables: {
          data: {
            name: "Nueva Macro Entidad",
            type: "Gubernamental",
            schoolsLimit: cupos,
            adminEmail: "admin@entidad.com",
            adminName: "Encargado",
          },
        },
      });
    } else {
      alert(
        "La mutación para crear Escuelas Individuales no está definida en el Resolver actual. ¡Requiere backend!",
      );
    }
  };

  return (
    <div className="flex-1 p-10 bg-slate-50 overflow-y-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Red de Clientes (Tenants)
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestión de asociaciones, municipalidades y escuelas individuales.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-900 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-black transition"
        >
          <Plus size={18} strokeWidth={3} /> CREAR CLIENTE
        </button>
      </div>

      {/* Tarjetas de Navegación Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/suadmin/clients/institutionals" className="group">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all h-full">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Macro Entidades (SubAdmins)
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Municipalidades, Asociaciones de Fútbol o Ligas Privadas que
              agrupan y financian múltiples escuelas bajo su propio entorno.
            </p>
          </div>
        </Link>

        <Link href="/suadmin/clients/schools" className="group">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all h-full">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Escuelas Base (Directores)
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Academias, talleres y clubes individuales. Control de
              suscripciones, modo Kill-Mode por morosidad y suplantación de
              identidad (God Mode).
            </p>
          </div>
        </Link>
      </div>

      {/* MODAL DE CREACIÓN DE CLIENTES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-950 text-white">
              <div>
                <h3 className="font-black text-xl">Alta de Nuevo Cliente</h3>
                <p className="text-xs text-indigo-300 mt-1">
                  Configura la jerarquía en la base de datos.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-indigo-300 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                1. Nivel Jerárquico
              </label>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="tenant"
                    value="subadmin"
                    className="peer sr-only"
                    checked={tenantLevel === "subadmin"}
                    onChange={() => setTenantLevel("subadmin")}
                  />
                  <div className="p-5 rounded-2xl border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 transition-all">
                    <h4 className="font-black text-slate-900 text-lg">
                      Macro Entidad
                    </h4>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1 mb-2">
                      Rol: SubAdmin
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Muni o Liga. Crean sus propias escuelas.
                    </p>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="tenant"
                    value="director"
                    className="peer sr-only"
                    checked={tenantLevel === "director"}
                    onChange={() => setTenantLevel("director")}
                  />
                  <div className="p-5 rounded-2xl border-2 border-slate-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all">
                    <h4 className="font-black text-slate-900 text-lg">
                      Escuela Individual
                    </h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1 mb-2">
                      Rol: Director
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Academia base. Gestiona alumnos y pagos.
                    </p>
                  </div>
                </label>
              </div>

              {tenantLevel === "subadmin" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <label className="block text-xs font-bold text-indigo-900 uppercase mb-3 flex items-center gap-2">
                      Límite de Escuelas Permitidas (Cupos)
                    </label>
                    <input
                      type="number"
                      value={cupos || ""}
                      onChange={(e) => setCupos(Number(e.target.value))}
                      placeholder="Ej: 20"
                      className="w-full md:w-1/2 px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm font-black outline-none text-indigo-900"
                    />
                    <div className="mt-4 p-4 bg-white rounded-xl flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                          <Calculator size={12} /> Sugerencia de Cobro
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          Cálculo:{" "}
                          <strong className="text-indigo-600">$40.000</strong>{" "}
                          base por escuela.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-indigo-700 leading-none">
                          ${(cupos * 40000).toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-colors ${tenantLevel === "subadmin" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {loading ? "Generando..." : "Generar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
