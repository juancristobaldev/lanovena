"use client";

import React, { useState } from "react";
import {
  Send,
  BellRing,
  Smartphone,
  Mail,
  Loader2,
  History,
  CheckCircle2,
} from "lucide-react";

export default function ComunicationsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    target: "DIRECTORS",
    title: "",
    message: "",
    sendPush: true,
    sendEmail: false,
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sendPush && !formData.sendEmail) {
      alert("Debes seleccionar al menos un método de envío (Push o Email).");
      return;
    }

    setLoading(true);
    setSuccess(false);

    // Simulación de envío a backend (Reemplazar con useMutation cuando exista en GraphQL)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);

      // Limpiar formulario tras éxito
      setFormData((prev) => ({ ...prev, title: "", message: "" }));

      // Ocultar mensaje de éxito después de 4 segundos
      setTimeout(() => setSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-10 custom-scrollbar animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Send className="text-indigo-600" /> Central de Comunicaciones
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Envía alertas Push y Correos Masivos segmentados a tu red de
            usuarios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========================================== */}
        {/* FORMULARIO DE REDACCIÓN Y ENVÍO            */}
        {/* ========================================== */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Overlay de Éxito */}
          {success && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                ¡Comunicado Enviado!
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Las notificaciones están en cola de entrega.
              </p>
            </div>
          )}

          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <BellRing className="text-indigo-600" /> Redactar Aviso
          </h4>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Público Objetivo (Destinatarios)
              </label>
              <select
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm outline-none bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 cursor-pointer transition-all"
              >
                <option value="DIRECTORS">
                  A todos los Directores (Panel Escuelas)
                </option>
                <option value="COACHES">
                  A todos los Entrenadores (App Cancha)
                </option>
                <option value="PARENTS">
                  A todos los Apoderados (App Familia)
                </option>
                <option value="GLOBAL">
                  Aviso Global (Absolutamente a todos)
                </option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Título de la Notificación
              </label>
              <input
                required
                type="text"
                maxLength={50}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Mantenimiento programado hoy a las 00:00"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:font-normal transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium text-right">
                {formData.title.length}/50 caracteres
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Cuerpo del Mensaje
              </label>
              <textarea
                required
                rows={4}
                maxLength={150}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Escribe tu comunicado aquí de forma clara y directa..."
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm font-medium outline-none bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none text-slate-700 transition-all"
              ></textarea>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium text-right">
                {formData.message.length}/150 caracteres (Recomendado para Push)
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                Canales de Entrega
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.sendPush ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.sendPush}
                    onChange={(e) =>
                      setFormData({ ...formData, sendPush: e.target.checked })
                    }
                  />
                  <Smartphone size={16} /> App (Push)
                </label>

                <label
                  className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.sendEmail ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.sendEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, sendEmail: e.target.checked })
                    }
                  />
                  <Mail size={16} /> Correo Email
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!formData.sendPush && !formData.sendEmail)}
              className="w-full mt-2 py-4 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  PROCESANDO ENVÍO...
                </>
              ) : (
                <>
                  <Send size={18} />
                  ENVIAR AHORA
                </>
              )}
            </button>
          </form>
        </div>

        {/* ========================================== */}
        {/* HISTORIAL DE ENVÍOS (MOCKUP VISUAL)        */}
        {/* ========================================== */}
        <div className="bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200 border-dashed flex flex-col">
          <h4 className="font-black text-slate-500 mb-6 flex items-center gap-2">
            <History size={18} /> Historial Reciente (Mock)
          </h4>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md tracking-widest">
                  Directores
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Hace 3 días
                </span>
              </div>
              <p className="text-sm font-black text-slate-800 mb-1">
                Cierre de Facturación Mensual
              </p>
              <p className="text-xs text-slate-500 line-clamp-2">
                Recuerden que este viernes se emitirán las facturas automáticas
                mediante LibreDTE. Por favor revisar los alumnos activos.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                  <Mail size={12} /> Email
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md tracking-widest">
                  Apoderados
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Hace 1 semana
                </span>
              </div>
              <p className="text-sm font-black text-slate-800 mb-1">
                Nuevo Material en Escuela para Padres
              </p>
              <p className="text-xs text-slate-500 line-clamp-2">
                Hemos subido un nuevo artículo de psicología deportiva sobre
                cómo manejar la frustración en los niños. Revísenlo en su app.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                  <Smartphone size={12} /> Push
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md tracking-widest">
                  GLOBAL
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Hace 1 mes
                </span>
              </div>
              <p className="text-sm font-black text-slate-800 mb-1">
                Mantenimiento de Servidores
              </p>
              <p className="text-xs text-slate-500 line-clamp-2">
                Estimados, hoy a las 02:00 AM (CLT) realizaremos un
                mantenimiento programado. La plataforma estará inactiva por 30
                minutos.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                  <Smartphone size={12} /> Push
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                  <Mail size={12} /> Email
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
