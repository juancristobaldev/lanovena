"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  ShieldCheck,
  RotateCw,
  AlertTriangle,
  User,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import QRCode from "react-qr-code";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// === GRAPHQL ===
const GET_MY_FAMILY = gql`
  query GetMyFamily {
    meGuardian {
      id
      managedPlayers {
        id
        firstName
        lastName
        birthDate
        photoUrl
        active
        qrCodeToken
        category {
          name
        }
        school {
          name
          logoUrl
        }
      }
    }
  }
`;

// === COMPONENTE TARJETA DIGITAL ===
interface PlayerCarnetProps {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    qrCodeToken: string;
    active: boolean;
    category: { name: string };
    school: { name: string; logoUrl?: string | null };
  };
}

export function DigitalIDCard({ player }: PlayerCarnetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFlipped, setIsFlipped] = useState(false); // Por si queremos agregar reverso futuro

  // Efecto Reloj (Anti-Fraude)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-[340px] mx-auto perspective-1000 group">
      {/* CARD CONTAINER */}
      <div
        className={`
        relative bg-white rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 transform
        ${player.active ? "shadow-indigo-900/20" : "shadow-red-900/20 grayscale"}
      `}
      >
        {/* 1. Header (Identidad Escuela) */}
        <div
          className={`h-32 relative ${player.active ? "bg-[#312E81]" : "bg-gray-800"}`}
        >
          {/* Patrón de fondo */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          ></div>

          {/* Logo Escuela */}
          {(player.school?.logoUrl || player.school?.name) && (
            <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
              {player.school?.logoUrl ? (
                <img
                  src={player.school.logoUrl}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <p>{player.school.name[0]}</p>
              )}
            </div>
          )}

          {/* Badge Categoría */}
          <div className="absolute top-4 left-4">
            <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-emerald-600">
              {player.category.name}
            </span>
          </div>
        </div>

        {/* 2. Foto de Perfil (Flotante) */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className={`
                w-28 h-28 rounded-full border-[6px] border-white shadow-lg overflow-hidden bg-gray-200
                ${!player.active && "border-red-100"}
            `}
          >
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <User size={48} />
              </div>
            )}
          </div>
          {/* Indicador de Estado (Icono) */}
          <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-md">
            {player.active ? (
              <CheckCircle2
                className="text-[#10B981] fill-emerald-100"
                size={24}
              />
            ) : (
              <AlertTriangle className="text-red-500 fill-red-100" size={24} />
            )}
          </div>
        </div>

        {/* 3. Información del Jugador */}
        <div className="pt-16 pb-8 px-6 text-center">
          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">
            {player.firstName}{" "}
            <span className="text-gray-500 font-medium">{player.lastName}</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-6">
            {player.school.name}
          </p>

          {/* QR CODE BOX */}
          <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mb-6 relative group-hover:border-indigo-200 transition-colors">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <QRCode
                value={player.qrCodeToken}
                size={160}
                fgColor={player.active ? "#111827" : "#9CA3AF"}
                bgColor="#FFFFFF"
                level="Q"
              />
            </div>
            {/* Overlay de Bloqueo si inactivo */}
            {!player.active && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                <span className="text-red-600 font-black text-lg rotate-12 border-4 border-red-600 px-2 py-1 rounded">
                  SUSPENDIDO
                </span>
              </div>
            )}
          </div>

          {/* 4. Live Security Footer */}
          <div className="flex justify-between items-end border-t border-gray-100 pt-4">
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                ID Ficha
              </p>
              <p className="font-mono text-xs text-gray-600">
                {player.id.split("-")[0].toUpperCase()}
              </p>
            </div>

            {/* Reloj Animado */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end text-[#312E81]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                <p className="font-mono font-bold text-sm">
                  {format(currentTime, "HH:mm:ss")}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 capitalize">
                {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Borde inferior de color */}
        <div
          className={`h-2 w-full ${player.active ? "bg-gradient-to-r from-[#312E81] to-[#10B981]" : "bg-red-500"}`}
        ></div>
      </div>
    </div>
  );
}

// === PÁGINA PRINCIPAL ===
export default function CarnetPage() {
  const { data, loading, error }: any = useQuery(GET_MY_FAMILY, {
    fetchPolicy: "network-only",
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const players = data?.meGuardian?.managedPlayers || [];

  // Auto-selección
  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const currentPlayer = players.find((p: any) => p.id === selectedPlayerId);

  // --- Loading State ---
  if (loading)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-[#312E81] w-10 h-10" />
        <p className="text-sm font-medium text-gray-400 animate-pulse">
          Generando credenciales...
        </p>
      </div>
    );

  // --- Error State ---
  if (error)
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="text-red-400 mb-4" size={48} />
        <h2 className="text-lg font-bold text-gray-900">
          No pudimos cargar el carnet
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Verifica tu conexión a internet e inténtalo nuevamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg active:scale-95"
        >
          Recargar Página
        </button>
      </div>
    );

  // --- Empty State ---
  if (players.length === 0)
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm">
          <ShieldCheck className="text-gray-300 w-20 h-20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            Sin Carnets Activos
          </h2>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            No tienes jugadores vinculados a tu cuenta. Contacta al director de
            la escuela para que te asigne.
          </p>
          <a
            href="/dashboard/guardian"
            className="text-[#312E81] font-bold text-sm hover:underline"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans">
      {/* 1. Header Curvo */}
      <div className="bg-[#312E81] pb-24 pt-10 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck size={180} className="text-white" />
        </div>

        <div className="relative z-10 text-center">
          <h1 className="text-white text-3xl font-black tracking-tight mb-1">
            Carnet Digital
          </h1>
          <p className="text-indigo-200 text-sm font-medium">
            Acceso seguro a las instalaciones
          </p>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-20 space-y-8">
        {/* 2. Selector de Hijos (Carousel) */}
        {players.length > 1 && (
          <div className="flex justify-center">
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/20 inline-flex gap-1 overflow-x-auto max-w-full">
              {players.map((p: any) => {
                const isSelected = selectedPlayerId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                    ${isSelected ? "bg-[#312E81] text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}
                                `}
                  >
                    <div
                      className={`w-5 h-5 rounded-full overflow-hidden border ${isSelected ? "border-indigo-300" : "border-gray-200"}`}
                    >
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[8px]">
                          {p.firstName[0]}
                        </div>
                      )}
                    </div>
                    {p.firstName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. TARJETA DIGITAL */}
        {currentPlayer && (
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
            <DigitalIDCard player={currentPlayer} />
          </div>
        )}

        {/* 4. Instrucciones / Footer */}
        <div className="text-center max-w-xs mx-auto space-y-4">
          {!currentPlayer?.active && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3 text-left animate-pulse">
              <AlertTriangle
                className="text-red-500 shrink-0 mt-0.5"
                size={18}
              />
              <div>
                <p className="text-xs font-bold text-red-800">
                  Acceso Bloqueado
                </p>
                <p className="text-[10px] text-red-600 mt-0.5">
                  Tu mensualidad está vencida o el alumno está inactivo. Por
                  favor contacta a administración.
                </p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400 px-4">
            <span className="block font-bold mb-1">💡 Tip de uso:</span>
            Aumenta el brillo de tu pantalla al máximo antes de presentar este
            código en el control de acceso.
          </p>
        </div>
      </div>
    </div>
  );
}
