// src/components/layout/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  User,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { MENU_ITEMS, UserRole } from "../config/navigation";
import { useUser } from "../providers/me";
import Cookies from "js-cookie";

export default function Sidebar() {
  const { user, loading: isLoading } = useUser(); // Asumo que useUser podría devolver isLoading
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Obtener menú o array vacío para evitar errores
  const menu = user?.role ? MENU_ITEMS[user.role as UserRole] || [] : [];

  const toggleDrawer = () => setIsOpen(!isOpen);

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Manejo de Logout (Mockup - conectar con tu lógica real)
  const handleLogout = () => {
    if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
      Cookies.remove("token");
      window.location.href = "/";
      // Aquí iría tu función de logout, ej: logout();
    }
  };

  return (
    <>
      {/* --- MOBILE HEADER (Visible solo en móvil) --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#312E81] text-white h-16 px-4 flex justify-between items-center shadow-lg transition-transform duration-300">
        <div className="flex items-center gap-2">
          {/* Logo simplificado para móvil */}
          <div className="w-8 h-8 bg-[#10B981] rounded-lg flex items-center justify-center text-[#312E81] font-bold text-xs">
            IX
          </div>
          <span className="font-bold text-lg tracking-tight">LA NOVENA</span>
        </div>
        <button
          onClick={toggleDrawer}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY (Backdrop con Fade) --- */}
      <div
        className={`fixed inset-0 bg-gray-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* --- SIDEBAR CONTAINER --- */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl lg:shadow-none border-r border-gray-100
          transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          lg:translate-x-0 lg:static
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* 1. HEADER: Identidad de Marca */}
        <div className="h-20 flex flex-col items-center justify-center border-b border-gray-100 bg-gradient-to-br from-[#312E81] to-[#282566] relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-[#10B981]/10 rounded-full -ml-6 -mb-6 pointer-events-none" />

          <h1 className="text-2xl font-black text-white tracking-tighter relative z-10">
            LA <span className="text-[#10B981]">NOVENA</span>
          </h1>
          <p className="text-[10px] text-indigo-200 tracking-widest uppercase font-medium">
            Gestión Deportiva
          </p>
        </div>

        {/* 2. BODY: Navegación Scrollable */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {/* Etiqueta de Rol */}
          <div className="px-3 mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Menú Principal
            </span>
            {user?.role && (
              <span className="text-[10px] bg-indigo-50 text-[#312E81] px-2 py-0.5 rounded-full font-bold border border-indigo-100 uppercase">
                {user.role === "GUARDIAN" ? "Apoderado" : user.role}
              </span>
            )}
          </div>

          {/* Items del Menú */}
          {menu.length > 0 ? (
            menu.map((item) => {
              const Icon = item.icon || LayoutDashboard; // Fallback icon
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group relative flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#312E81] text-white shadow-md shadow-indigo-900/20 translate-x-1"
                        : "text-gray-600 hover:bg-gray-50 hover:text-[#312E81]"
                    }
                  `}
                >
                  {/* Indicador lateral activo (opcional, estilo moderno) */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#10B981]" />
                  )}

                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? "text-[#10B981]"
                        : "text-gray-400 group-hover:text-[#312E81]"
                    }`}
                  />

                  <span className="flex-1">{item.title}</span>

                  {/* Flecha sutil en hover */}
                  {!isActive && (
                    <ChevronRight
                      size={16}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-300"
                    />
                  )}
                </Link>
              );
            })
          ) : (
            // Estado vacío o carga del menú
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No hay opciones disponibles
            </div>
          )}
        </nav>

        {/* 3. FOOTER: Perfil y Acciones */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 mt-auto">
          {isLoading ? (
            // Skeleton Loading
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ) : (
            // User Card
            <div className="group relative">
              <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100 cursor-default">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#312E81] to-[#4F46E5] flex items-center justify-center text-white shadow-sm">
                    <User size={20} />
                  </div>
                  {/* Indicador Online */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></div>
                </div>

                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                    {user?.fullName || "Usuario"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate font-medium flex items-center gap-1">
                    <ShieldCheck size={10} className="text-[#10B981]" />
                    {user?.email || "usuario@lanovena.cl"}
                  </p>
                </div>
              </div>

              {/* Botón Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 py-2.5 rounded-lg transition-all duration-200 active:scale-95 shadow-sm"
              >
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
