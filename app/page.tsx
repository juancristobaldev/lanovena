"use client";

import React, { useState } from "react";
import {
  CircleDot,
  ArrowRight,
  PlayCircle,
  CircleDollarSign,
  Users,
  BookOpen,
  Activity,
  Layout,
  CheckCircle2,
  Heart,
  QrCode,
  Lightbulb,
  Sparkles,
  Gift,
  Check,
  Instagram,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"director" | "coach" | "parent">(
    "director",
  );

  // Colores del Manual de Identidad
  const colors = {
    indigo: "#312E81",
    emerald: "#10B981",
  };

  return (
    <div className="bg-white text-gray-800 antialiased overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#312E81] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <CircleDot size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 italic">
              La Novena
            </span>
          </div>

          <div className="hidden md:flex space-x-8">
            <a
              href="#features"
              className="text-sm font-medium text-gray-500 hover:text-[#10B981] transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#methodology"
              className="text-sm font-medium text-gray-500 hover:text-[#10B981] transition-colors"
            >
              Metodología
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-500 hover:text-[#10B981] transition-colors"
            >
              Precios
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="hidden md:block text-sm font-bold text-gray-900 hover:text-indigo-600"
            >
              Ingresar
            </a>
            <a className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-transform hover:scale-105 shadow-lg">
              Prueba Gratis
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Decoración regional/tech */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 -z-10" />

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#312E81] text-xs font-bold uppercase tracking-wide mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Nueva
            Versión 2.0 con IA
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            Profesionaliza tu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#312E81] to-[#10B981]">
              Escuela de Fútbol
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Desde la IX Región al mundo. Gestiona pagos, planifica
            entrenamientos y conecta con los apoderados en una sola plataforma
            web optimizada para la cancha.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-[#312E81] text-white rounded-xl font-bold text-lg hover:bg-indigo-900 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
              Prueba 15 días Gratis <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 flex items-center justify-center gap-2">
              <PlayCircle size={20} className="text-gray-400" /> Ver Demo
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES TABS */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Una plataforma, tres experiencias
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Diseñada para la realidad del fútbol formativo local.
            </p>
          </div>

          {/* Tab Controls */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1.5 rounded-xl inline-flex gap-1">
              <button
                onClick={() => setActiveTab("director")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "director" ? "bg-white text-[#312E81] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Para Directores
              </button>
              <button
                onClick={() => setActiveTab("coach")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "coach" ? "bg-white text-[#312E81] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Para Entrenadores
              </button>
              <button
                onClick={() => setActiveTab("parent")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "parent" ? "bg-white text-[#312E81] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Para Apoderados
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {featuresContent[activeTab].map((feat, index) => (
                <div key={index} className="flex gap-4 group">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${feat.bgColor}`}
                  >
                    <feat.icon size={24} className={feat.iconColor} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#312E81] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-gray-500 mt-2">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-100 rounded-full blur-3xl opacity-30 -z-10" />
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-inner">
                <div className="aspect-video bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center">
                  <Layout className="text-gray-200" size={64} />
                  <p className="absolute bottom-12 text-xs font-mono text-gray-400">
                    preview_interface_{activeTab}.webp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METHODOLOGY & IA */}
      <section
        id="methodology"
        className="py-24 bg-[#0F172A] text-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <span className="text-[#10B981] font-bold uppercase tracking-widest text-xs mb-2 block">
              Identidad & Tecnología
            </span>
            <h2 className="text-4xl font-extrabold mb-6">
              Metodología Global + <br /> IA de La Araucanía
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              No solo es gestión, es conocimiento. Accede a nuestra biblioteca
              de ejercicios basada en estándares FIFA y deja que nuestra IA
              analice la asistencia para prevenir la deserción.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#10B981]" size={20} />
                <span>Modelos Comercial e Institucional (Municipios)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#10B981]" size={20} />
                <span>Biblioteca de 500+ ejercicios formativos</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#10B981]" size={20} />
                <span>Análisis preventivo de morosidad con IA</span>
              </li>
            </ul>
          </div>

          {/* Simulated Chat */}
          <div className="md:w-1/2 w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <div className="w-8 h-8 bg-[#312E81] rounded-full flex items-center justify-center">
                <Sparkles size={16} className="text-yellow-400" />
              </div>
              <p className="font-bold text-sm">Asistente La Novena</p>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-slate-700/50 p-3 rounded-lg rounded-tl-none mr-12 text-slate-300">
                ¿Qué categoría tiene mayor riesgo de deserción este mes?
              </div>
              <div className="bg-[#312E81] p-3 rounded-lg rounded-tr-none ml-12 text-white">
                Analizando asistencia... 📊 La categoría **Sub-12** muestra una
                baja del 15%. Te recomiendo revisar los comunicados enviados a
                sus apoderados.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#312E81] rounded-lg flex items-center justify-center text-white">
              <CircleDot size={18} />
            </div>
            <span className="font-bold text-lg">La Novena</span>
          </div>
          <p className="text-gray-400 text-sm italic">
            "Talento con identidad, gestión con tecnología"
          </p>
          <div className="flex gap-6">
            <a
              href="https://instagram.com/felipe.figueroa"
              target="_blank"
              className="text-gray-400 hover:text-pink-600"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Datos de contenido tipados implícitamente
const featuresContent = {
  director: [
    {
      title: "Control de Cobranza",
      desc: "Gestión de pagos, becas y morosidad automática en Modo Comercial.",
      icon: CircleDollarSign,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Reportes Municipales",
      desc: "Métricas de asistencia masiva para justificar fondos en Modo Institucional.",
      icon: Activity,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Base de Datos Central",
      desc: "Fichas médicas, autorizaciones y contacto de emergencia siempre a mano.",
      icon: Users,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
  ],
  coach: [
    {
      title: "Sesiones en Segundos",
      desc: "Planifica usando nuestra biblioteca. Menos tiempo en el PC, más en la cancha.",
      icon: BookOpen,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Asistencia Web Móvil",
      desc: "Toma lista desde el navegador de tu celular sin instalar nada.",
      icon: CheckCircle2,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Evaluación Dual",
      desc: "Diferencia entre rama Formativa (caritas felices) y Selectiva (estadísticas).",
      icon: Activity,
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
    },
  ],
  parent: [
    {
      title: "Carnet Digital QR",
      desc: "Control de acceso seguro para el niño y tranquilidad para la familia.",
      icon: QrCode,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Escuela para Padres",
      desc: "Contenido exclusivo de psicología deportiva y nutrición.",
      icon: Lightbulb,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      title: "Perfil Multi-Hijo",
      desc: "Cambia entre tus hijos en distintas categorías con un solo toque.",
      icon: Heart,
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
    },
  ],
};
