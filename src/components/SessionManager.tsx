"use client";

import { useState } from "react";
import Image from "next/image";
import { gql } from "@apollo/client";
import {
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  Timer,
  ChevronDown,
  Users,
  Dumbbell,
} from "lucide-react";
import { useMutation } from "@apollo/client/react";

// --- MUTATION ---
const REGISTER_ATTENDANCE = gql`
  mutation RegisterAttendance(
    $sessionId: String!
    $playerId: String!
    $status: AttendanceStatus!
  ) {
    registerAttendance(
      sessionId: $sessionId
      playerId: $playerId
      status: $status
    ) {
      id
      status
    }
  }
`;

// --- TYPES ---
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PENDING";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

interface AttendanceRecord {
  status: AttendanceStatus;
  player: { id: string };
}

interface Exercise {
  id: string;
  durationMin?: number | null;
  exercise: {
    title: string;
    description: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
  };
}

interface SessionManagerProps {
  sessionId: string;
  players: Player[];
  attendance: AttendanceRecord[];
  exercises: Exercise[];
}

export default function SessionManager({
  sessionId,
  players,
  attendance,
  exercises,
}: SessionManagerProps) {
  const [activeTab, setActiveTab] = useState<"ATTENDANCE" | "PLANNING">(
    "ATTENDANCE",
  );

  // Estado local de asistencia (Map para acceso O(1))
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >(() => {
    const map: Record<string, AttendanceStatus> = {};
    attendance.forEach((r) => (map[r.player.id] = r.status));
    return map;
  });

  const [registerAttendance] = useMutation(REGISTER_ATTENDANCE);

  // Estadísticas en tiempo real
  const stats = {
    present: Object.values(attendanceMap).filter((s) => s === "PRESENT").length,
    late: Object.values(attendanceMap).filter((s) => s === "LATE").length,
    total: players.length,
  };

  const handleStatusChange = async (
    playerId: string,
    newStatus: AttendanceStatus,
  ) => {
    // Optimistic Update
    setAttendanceMap((prev) => ({ ...prev, [playerId]: newStatus }));
    try {
      await registerAttendance({
        variables: { sessionId, playerId, status: newStatus },
      });
    } catch (error) {
      console.error("Error syncing attendance", error);
      // Podrías revertir el estado aquí si falla
    }
  };

  return (
    <div className="bg-white rounded-t-[2rem] min-h-screen -mt-6 relative z-10 px-4 pt-6 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      {/* TABS SELECTOR */}
      <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("ATTENDANCE")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === "ATTENDANCE"
              ? "bg-white text-[#312E81] shadow-sm"
              : "text-gray-400"
          }`}
        >
          <Users className="w-4 h-4" />
          Asistencia
        </button>
        <button
          onClick={() => setActiveTab("PLANNING")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === "PLANNING"
              ? "bg-white text-[#312E81] shadow-sm"
              : "text-gray-400"
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Planificación
        </button>
      </div>

      {/* VISTA: ASISTENCIA */}
      {activeTab === "ATTENDANCE" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Resumen Rápido */}
          <div className="flex justify-between items-center bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100 mb-2">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
              Resumen
            </span>
            <div className="flex gap-4 text-sm font-bold">
              <span className="text-emerald-600">
                {stats.present}{" "}
                <span className="text-emerald-400 text-xs font-medium">
                  Asisten
                </span>
              </span>
              <span className="text-amber-600">
                {stats.late}{" "}
                <span className="text-amber-400 text-xs font-medium">
                  Atrasos
                </span>
              </span>
              <span className="text-gray-400">/ {stats.total}</span>
            </div>
          </div>

          {/* Lista de Jugadores */}
          {players.map((player) => {
            const status = attendanceMap[player.id] || "PENDING";
            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#312E81] text-white text-xs font-bold">
                        {player.firstName[0]}
                        {player.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm leading-tight">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mt-0.5">
                      {status === "PENDING"
                        ? "Sin Marcar"
                        : status === "PRESENT"
                          ? "Presente"
                          : status === "ABSENT"
                            ? "Ausente"
                            : "Atrasado"}
                    </p>
                  </div>
                </div>

                {/* Botones de Acción (Touch Friendly) */}
                <div className="flex bg-gray-50 rounded-lg p-1 gap-1">
                  <StatusButton
                    isActive={status === "PRESENT"}
                    type="PRESENT"
                    onClick={() => handleStatusChange(player.id, "PRESENT")}
                  />
                  <StatusButton
                    isActive={status === "LATE"}
                    type="LATE"
                    onClick={() => handleStatusChange(player.id, "LATE")}
                  />
                  <StatusButton
                    isActive={status === "ABSENT"}
                    type="ABSENT"
                    onClick={() => handleStatusChange(player.id, "ABSENT")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA: PLANIFICACIÓN */}
      {activeTab === "PLANNING" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {exercises.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
              <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                Sin ejercicios planificados
              </p>
            </div>
          ) : (
            exercises.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
              >
                <div className="flex h-24">
                  {/* Imagen */}
                  <div className="w-28 bg-gray-100 relative shrink-0">
                    {item.exercise.imageUrl ? (
                      <Image
                        src={item.exercise.imageUrl}
                        alt={item.exercise.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Dumbbell />
                      </div>
                    )}
                    {/* Overlay de Video si existe */}
                    {item.exercise.videoUrl && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-white opacity-80" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-[#312E81] text-sm line-clamp-1">
                        {item.exercise.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {item.exercise.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {item.durationMin && (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Timer className="w-3 h-3" />
                          {item.durationMin} min
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponente de botón de estado
function StatusButton({
  isActive,
  type,
  onClick,
}: {
  isActive: boolean;
  type: "PRESENT" | "ABSENT" | "LATE";
  onClick: () => void;
}) {
  const config = {
    PRESENT: {
      icon: CheckCircle2,
      colorActive: "bg-[#10B981] text-white",
      colorInactive: "text-gray-300 hover:text-[#10B981]",
    },
    LATE: {
      icon: Clock,
      colorActive: "bg-amber-400 text-white",
      colorInactive: "text-gray-300 hover:text-amber-400",
    },
    ABSENT: {
      icon: XCircle,
      colorActive: "bg-red-500 text-white",
      colorInactive: "text-gray-300 hover:text-red-500",
    },
  };

  const { icon: Icon, colorActive, colorInactive } = config[type];

  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
        isActive
          ? `${colorActive} shadow-md`
          : `bg-transparent ${colorInactive}`
      }`}
    >
      <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
    </button>
  );
}
