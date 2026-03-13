"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  User,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { MENU_ITEMS, UserRole } from "../config/navigation";
import { useUser } from "../providers/me";
import Cookies from "js-cookie";

export default function Sidebar() {
  const { user, loading: isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menu = user?.role ? MENU_ITEMS[user.role as UserRole] || [] : [];

  const toggleDrawer = () => setIsOpen(!isOpen);

  // Bloquear scroll y escuchar tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const handleLogout = () => {
    // TODO: Reemplazar este confirm nativo por un Modal/Dialog de UI moderno.
    if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
      Cookies.remove("token");
      Cookies.remove("userRole");
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16 px-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#312E81] rounded-xl flex items-center justify-center shadow-inner">
            <span className="font-black text-sm italic text-[#10B981]">IX</span>
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900">
            La Novena
          </span>
        </div>
        <button
          onClick={toggleDrawer}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#312E81]/20"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      <div
        className={`fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* --- SIDEBAR CONTAINER --- */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* 1. HEADER: Identidad de Marca (Horizontal y Optimizado) */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group outline-none"
          >
            <div className="w-10 h-10 bg-[#312E81] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="font-black text-lg italic text-[#10B981]">
                IX
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-slate-900 leading-none">
                La Novena
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* 2. BODY: Navegación Scrollable */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {/* Etiqueta de Rol */}
          <div className="px-2 mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Menú Principal
            </span>
            {user?.role && (
              <span className="text-[10px] bg-indigo-50 text-[#312E81] px-2.5 py-1 rounded-full font-black tracking-wide border border-indigo-100/50 uppercase">
                {user.role === "GUARDIAN" ? "APODERADO" : user.role}
              </span>
            )}
          </div>

          {/* Items del Menú */}
          {menu.length > 0 ? (
            menu.map((item) => {
              const Icon = item.icon || LayoutDashboard;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#312E81]/40
                    ${
                      isActive
                        ? "bg-indigo-50/80 text-[#312E81] font-bold"
                        : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  {/* Indicador lateral activo (Píldora verde esmeralda) */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full bg-[#10B981] shadow-[2px_0_8px_rgba(16,185,129,0.4)]" />
                  )}

                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? "text-[#312E81]"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="flex-1 truncate">{item.title}</span>
                </Link>
              );
            })
          ) : (
            // Estado vacío elegante
            <div className="px-4 py-8 text-center">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <LayoutDashboard size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">
                Cargando módulos...
              </p>
            </div>
          )}
        </nav>

        {/* 3. FOOTER: Perfil y Acciones */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 shrink-0">
          {isLoading ? (
            // Skeleton Loading UI
            <div className="flex items-center gap-3 animate-pulse p-2">
              <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-24" />
                <div className="h-2 bg-slate-200 rounded w-32" />
              </div>
            </div>
          ) : (
            // User Card
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 shadow-sm cursor-default">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#312E81] flex items-center justify-center text-white shadow-inner">
                    <User size={18} />
                  </div>
                  {/* Indicador Online (Esmeralda) */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></div>
                </div>

                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                    {user?.fullName || "Usuario"}
                  </p>
                  <p className="text-xs text-slate-500 truncate font-medium flex items-center gap-1 mt-0.5">
                    <ShieldCheck
                      size={12}
                      className="text-[#10B981] shrink-0"
                    />
                    <span className="truncate">
                      {user?.email || "usuario@lanovena.cl"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Botón Logout (Rediseñado para no competir visualmente con el menú) */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <LogOut size={16} strokeWidth={2.5} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
