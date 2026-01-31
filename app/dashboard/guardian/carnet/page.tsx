"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  User as UserIcon,
  ShieldCheck,
  Wifi,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import QRCode from "react-qr-code"; // Asegúrate de instalar esto

// === GRAPHQL ===
// Obtenemos los hijos asociados al usuario logueado
const GET_MY_FAMILY = gql`
  query GetMyFamily {
    me {
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

export default function DigitalIDPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // --- QUERY ---
  const { data, loading, refetch }: any = useQuery(GET_MY_FAMILY, {
    fetchPolicy: "network-only",
  });

  const players = data?.me?.managedPlayers || [];

  // Auto-seleccionar el primer hijo al cargar
  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  // --- RENDER HELPERS ---
  const currentPlayer = players.find((p: any) => p.id === selectedPlayerId);

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-indigo-900" />
      </div>
    );

  // Estado: Sin jugadores asignados
  if (players.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center text-center max-w-md mx-auto mt-10">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <UserIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          No hay jugadores vinculados
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          Tu cuenta aún no tiene alumnos asociados. Solicita al director de tu
          escuela que vincule a tu hijo/a a tu correo.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-indigo-900">Carnet Digital</h1>
        <p className="text-sm text-gray-500">
          Presenta este código al ingresar al recinto.
        </p>
      </div>

      {/* SELECTOR MULTI-HIJO (Solo si tiene más de 1) */}
      {players.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {players.map((player: any) => {
            const isSelected = player.id === selectedPlayerId;
            return (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition-all
                  ${
                    isSelected
                      ? "bg-indigo-900 text-white border-indigo-900 shadow-md transform scale-105"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                <div
                  className={`w-2 h-2 rounded-full ${player.active ? "bg-emerald-400" : "bg-red-400"}`}
                />
                {player.firstName}
              </button>
            );
          })}
        </div>
      )}

      {/* TARJETA DE IDENTIFICACIÓN */}
      {currentPlayer && (
        <div className="relative group perspective">
          {/* Contenedor de la Tarjeta */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden text-white border border-indigo-700/50 relative">
            {/* Fondo Decorativo */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <ShieldCheck className="w-48 h-48" />
            </div>

            {/* Header Tarjeta */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                  {/* Logo Escuela (Fallback si no hay url) */}
                  {currentPlayer.school.logoUrl ? (
                    <img
                      src={currentPlayer.school.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-indigo-900" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-bold">
                    Escuela Oficial
                  </p>
                  <p className="text-sm font-bold leading-none">
                    {currentPlayer.school.name}
                  </p>
                </div>
              </div>

              {/* Badge Estado */}
              <div
                className={`
                px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1
                ${
                  currentPlayer.active
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-red-500/20 text-red-300 border-red-500/50"
                }
              `}
              >
                <Wifi className="w-3 h-3" />
                {currentPlayer.active ? "Activo" : "Inactivo"}
              </div>
            </div>

            {/* Cuerpo Principal */}
            <div className="p-6 flex flex-col items-center text-center">
              {/* Foto Jugador */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg overflow-hidden bg-indigo-700 flex items-center justify-center">
                  {currentPlayer.photoUrl ? (
                    <img
                      src={currentPlayer.photoUrl}
                      alt="Jugador"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white/50">
                      {currentPlayer.firstName.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Categoría Badge */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap border-2 border-indigo-900">
                  {currentPlayer.category?.name || "Sin serie"}
                </div>
              </div>

              {/* Datos */}
              <h2 className="text-2xl font-bold mb-1">
                {currentPlayer.firstName} {currentPlayer.lastName}
              </h2>
              <p className="text-indigo-200 text-sm mb-6">Jugador Registrado</p>

              {/* CÓDIGO QR */}
              <div className="bg-white p-4 rounded-xl shadow-inner mb-2">
                {currentPlayer.active ? (
                  <QRCode
                    value={currentPlayer.qrCodeToken || "INVALID_TOKEN"}
                    size={160}
                    viewBox={`0 0 256 256`}
                    className="w-full h-auto max-w-[160px]"
                  />
                ) : (
                  <div className="w-40 h-40 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <span className="text-xs text-center px-2">
                      Carnet Inhabilitado
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-indigo-300 mt-2 opacity-80">
                Token ID: {currentPlayer.qrCodeToken?.slice(0, 8)}...
              </p>
            </div>

            {/* Footer Tarjeta */}
            <div className="bg-black/20 p-3 text-center text-[10px] text-indigo-300 backdrop-blur-sm">
              Este documento es personal e intransferible. La Novena © 2024
            </div>
          </div>
        </div>
      )}

      {/* Ayuda Rápida */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
        <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">
            ¿Problemas al escanear?
          </h4>
          <p className="text-xs text-blue-700 mt-1">
            Sube el brillo de tu pantalla al máximo. Si la información del
            jugador está desactualizada, contacta al profesor encargado.
          </p>
        </div>
      </div>
    </div>
  );
}
