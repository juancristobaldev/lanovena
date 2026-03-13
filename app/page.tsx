"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  ShieldCheck,
  Building2,
  Trophy,
  CircleDollarSign,
  QrCode,
  Flag,
  Store,
  BookOpen,
  MonitorSmartphone,
  CheckCircle2,
  Crown,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="font-sans text-slate-800 bg-[#F8FAFC] overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#312E81] rounded-xl flex items-center justify-center shadow-lg">
                <span className="font-black text-xl italic text-[#10B981]">
                  IX
                </span>
              </div>
              <span className="font-black text-xl tracking-tight text-slate-900">
                La Novena
              </span>
            </div>

            {/* Links (Desktop) */}
            <div className="hidden md:flex space-x-8">
              <Link
                href="#soluciones"
                className="text-sm font-semibold text-slate-600 hover:text-[#312E81] transition"
              >
                Soluciones
              </Link>
              <Link
                href="#funciones"
                className="text-sm font-semibold text-slate-600 hover:text-[#312E81] transition"
              >
                Funciones
              </Link>
              <Link
                href="#precios"
                className="text-sm font-semibold text-slate-600 hover:text-[#312E81] transition"
              >
                Planes
              </Link>
            </div>

            {/* CTA Buttons (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-bold text-[#312E81] hover:text-indigo-900 transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="#contacto"
                className="bg-[#312E81] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-slate-900 hover:-translate-y-0.5 transition-all"
              >
                Solicitar Demo
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-slate-900 focus:outline-none p-2"
                aria-label="Alternar menú"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 shadow-xl absolute w-full left-0 top-20">
            <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
              <Link
                href="#soluciones"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Soluciones
              </Link>
              <Link
                href="#funciones"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Funciones
              </Link>
              <Link
                href="#precios"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Planes
              </Link>
              <hr className="border-slate-100" />
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-base font-bold text-[#312E81]"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="#contacto"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-3 text-center rounded-xl bg-[#312E81] text-white font-bold"
              >
                Solicitar Demo
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0F172A] text-white">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#312E81] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div
          className="absolute top-0 right-1/4 w-72 h-72 bg-[#10B981] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="px-4 py-1.5 rounded-full bg-indigo-900/50 border border-indigo-700/50 text-[#10B981] text-[10px] font-black uppercase tracking-widest inline-block mb-6 backdrop-blur-sm">
            Desarrollado en la Araucanía para todo Chile
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Gestión deportiva con <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-emerald-300">
              Identidad Regional
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            Transforma el desorden administrativo en gestión profesional.
            Unifica pagos, control de acceso con QR, metodologías y organización
            de torneos en una sola plataforma.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="#contacto"
              className="bg-[#10B981] text-slate-900 px-8 py-4 rounded-2xl text-base font-black uppercase tracking-wide hover:bg-emerald-400 shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
            >
              Agendar Demostración
            </Link>
            <Link
              href="#soluciones"
              className="bg-white/10 text-white px-8 py-4 rounded-2xl text-base font-bold border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Explorar Funciones
            </Link>
          </div>

          {/* HERO IMAGE / MOCKUP */}
          <div className="mt-20 relative mx-auto w-full max-w-5xl transition-transform hover:-translate-y-2 duration-700">
            <div className="rounded-3xl shadow-2xl overflow-hidden border border-white/10 bg-slate-900">
              <div className="h-8 bg-slate-800 flex items-center px-4 gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="mx-auto bg-slate-900/50 rounded-md h-4 w-48 border border-white/5"></div>
              </div>

              <div className="p-3 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 bg-slate-900 h-auto">
                {/* Foto Principal */}
                <div className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group aspect-video md:aspect-auto min-h-[300px] border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1200&auto=format&fit=crop"
                    alt="Fútbol Araucanía"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex items-end p-6 md:p-8">
                    <div>
                      <span className="bg-[#10B981] text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-3 inline-block shadow-lg">
                        Nuestra Tierra
                      </span>
                      <h3 className="text-white font-black text-2xl md:text-4xl tracking-tight">
                        Potenciando el talento
                        <br />
                        del sur de Chile.
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Foto Secundaria 1 */}
                <div className="relative rounded-2xl overflow-hidden group aspect-video border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop"
                    alt="Canchas del Sur"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-5">
                    <h4 className="text-white font-bold text-lg">
                      Canchas y Gestión
                    </h4>
                  </div>
                </div>

                {/* Foto Secundaria 2 */}
                <div className="relative rounded-2xl overflow-hidden group aspect-video border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop"
                    alt="Comunidad Deportiva"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-5">
                    <h4 className="text-white font-bold text-lg">
                      Comunidad Unida
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            Diseñado para adaptarse a cualquier estructura
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
            <div className="flex items-center gap-2 font-black text-xl">
              <ShieldCheck size={28} /> Academias Privadas
            </div>
            <div className="flex items-center gap-2 font-black text-xl">
              <Building2 size={28} /> Talleres Municipales
            </div>
            <div className="flex items-center gap-2 font-black text-xl">
              <Trophy size={28} /> Ligas Amateur
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="soluciones" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Todo lo que tu club necesita,
              <br />
              sin usar Excel ni papel.
            </h2>
            <p className="mt-4 text-slate-600">
              Automatiza la burocracia para que puedas enfocarte en lo que
              importa: el desarrollo deportivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#312E81]">
                <CircleDollarSign size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Recaudación y Finanzas
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Controla qué apoderado pagó la mensualidad. Envía recordatorios
                de cobro automáticos vía WhatsApp con un solo clic.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#10B981]">
                <QrCode size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Carnet Digital & QR
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Cada alumno tiene un carnet digital en el celular de su
                apoderado. Escanéalo en la entrada para registrar asistencia y
                deudas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-blue-600">
                <Flag size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Planillero en Vivo
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Mesa de control digital para torneos. Registra goles, tarjetas y
                cambios en tiempo real. La tabla se actualiza sola.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-orange-600">
                <Store size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                La Tiendita (E-commerce)
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Vende camisetas, medias y merchandising oficial de tu club
                directamente desde la plataforma a los apoderados.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-600">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Biblioteca Metodológica
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Estandariza los entrenamientos. Sube ejercicios y evaluaciones
                para que todos tus profesores sigan la misma línea.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group bg-gradient-to-br from-slate-900 to-[#312E81] text-white">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">
                <MonitorSmartphone size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Roles a Medida
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Vistas independientes para Directores (Escritorio), Entrenadores
                (App) y Apoderados (App). Cada uno ve lo que necesita.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="precios"
        className="py-24 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Planes diseñados para tu realidad
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Desde academias formativas emergentes hasta corporaciones
              municipales y organizadores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
            {/* Plan Básico */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 border border-slate-700 hover:border-slate-500 transition-colors">
              <h3 className="text-2xl font-bold text-white">Básico</h3>
              <p className="text-slate-400 text-sm mt-2">
                Para escuelas nuevas que buscan orden inicial.
              </p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">$35.000</span>
                <span className="text-slate-400">/mes</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" /> 1 Sede /
                  Hasta 6 Categorías
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" /> Hasta 90
                  Alumnos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" /> 1
                  Apoderado por niño
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" /> App de
                  Asistencia Básica
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <X size={18} /> Sin Módulo de Cobranzas
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-slate-600 font-bold hover:bg-slate-700 transition">
                Comenzar Gratis
              </button>
            </div>

            {/* Plan Gold */}
            <div className="bg-gradient-to-b from-indigo-900 to-slate-900 rounded-[2rem] p-8 border-2 border-indigo-500 relative transform md:-translate-y-4 shadow-2xl shadow-indigo-900/50">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Más Popular
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">Gold</h3>
              <p className="text-indigo-200 text-sm mt-2">
                Gestión total, finanzas y comunidad.
              </p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">$50.000</span>
                <span className="text-indigo-300">/mes</span>
              </div>
              <ul className="space-y-3 text-sm text-indigo-100 mb-8 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-yellow-400" /> Hasta
                  15 Categorías
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-yellow-400" /> Hasta
                  225 Alumnos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-yellow-400" />{" "}
                  Semáforo de Pagos / Finanzas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-yellow-400" /> Muro de
                  Noticias y Fotos
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-wide hover:bg-indigo-500 transition shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                Seleccionar Gold
              </button>
            </div>

            {/* Plan Platino */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 border border-slate-700 hover:border-slate-500 transition-colors">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-white">Platino</h3>
                <Crown className="text-slate-400" size={28} />
              </div>
              <p className="text-slate-400 text-sm mt-2">
                Sin límites. La experiencia Élite.
              </p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">$80.000</span>
                <span className="text-slate-400">/mes</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" />{" "}
                  <strong>Alumnos Ilimitados</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" />{" "}
                  Categorías Ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" />{" "}
                  Biblioteca Ejercicios PRO
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" /> Tareas
                  con Historial
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#10B981]" /> Soporte
                  VIP
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-slate-600 font-bold hover:bg-slate-700 transition">
                Seleccionar Platino
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="font-black text-sm italic text-[#10B981]">
                  IX
                </span>
              </div>
              <span className="font-bold text-slate-900 tracking-tight">
                La Novena
              </span>
            </div>

            <p className="text-sm text-slate-500 font-medium text-center md:text-left">
              &copy; 2026 Tecnologías Deportivas La Novena SpA. Todos los
              derechos reservados.
            </p>

            <div className="flex gap-4 text-slate-400">
              <Link
                href="#"
                aria-label="Instagram"
                className="hover:text-[#312E81]"
              >
                <Instagram size={24} />
              </Link>
              <Link
                href="#"
                aria-label="LinkedIn"
                className="hover:text-[#312E81]"
              >
                <Linkedin size={24} />
              </Link>
              <Link
                href="#contacto"
                aria-label="Contacto"
                className="hover:text-[#312E81]"
              >
                <Mail size={24} />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
