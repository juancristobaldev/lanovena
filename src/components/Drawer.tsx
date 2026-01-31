// src/components/layout/Sidebar.tsx
"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, UserCircle } from "lucide-react";
import { MENU_ITEMS, UserRole } from "../config/navigation";
import { useUser } from "../providers/me";

export default function Sidebar() {
  const { user } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menu = MENU_ITEMS[user?.role as UserRole] || [];

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <>
      {/* --- MOBILE TRIGGER (Solo visible en celular) --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#312E81] text-white p-4 flex justify-between items-center shadow-md">
        <div className="font-bold text-lg tracking-wider">LA NOVENA</div>
        <button
          onClick={toggleDrawer}
          className="p-2 hover:bg-white/10 rounded-md transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- OVERLAY (Fondo oscuro al abrir en móvil) --- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- DRAWER / SIDEBAR CONTAINER --- */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none border-r border-gray-100 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* HEADER: Logo e Identidad */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100 bg-[#312E81]">
          {/* Aquí iría el Isotipo sugerido en el Manual de Identidad */}
          <h1 className="text-2xl font-black text-white tracking-tighter">
            LA <span className="text-[#10B981]">NOVENA</span>
          </h1>
        </div>

        {/* BODY: Navegación */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-160px)]">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Menú {user?.role === "GUARDIAN" ? "Apoderado" : user?.role}
          </p>

          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Cierra el drawer al navegar en móvil
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
                  isActive
                    ? "bg-[#312E81] text-white shadow-md shadow-indigo-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#312E81]"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors
                     ${
                       isActive
                         ? "text-[#10B981]"
                         : "text-gray-400 group-hover:text-[#312E81]"
                     }
                   
                    `}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER: Perfil de Usuario */}
        <div className="w-full p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-[#312E81]">
              <UserCircle size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.fullName?.toLowerCase()}
              </p>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 py-2 rounded-lg transition-colors font-medium">
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
