"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, QrCode, Activity } from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_PLAYER_DETAILS } from "../page";

const UPDATE_PLAYER = gql`
  mutation UpdatePlayer($playerId: ID!, $input: UpdatePlayerInput!) {
    updatePlayer(playerId: $playerId, input: $input) {
      id
      firstName
      medicalInfo
      active
    }
  }
`;

export default function PlayerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm();

  // 1. Obtener datos del jugador
  const { data, loading, error }: any = useQuery(GET_PLAYER_DETAILS, {
    variables: { playerId: params.id },
  });

  // 2. Mutación de Update
  const [updatePlayer, { loading: saving }] = useMutation(UPDATE_PLAYER);

  const onSubmit = (formData: any) => {
    updatePlayer({
      variables: {
        playerId: params.id,
        input: {
          medicalInfo: formData.medicalInfo,
          active: formData.active, // Boolean handled by toggle or select
        },
      },
      onCompleted: () => alert("Ficha actualizada correctamente"),
    });
  };

  if (loading) return <div className="p-10 text-center">Cargando ficha...</div>;
  if (error)
    return (
      <div className="p-10 text-center text-red-500">
        Error al cargar jugador
      </div>
    );

  const player = data.playerProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER DE NAVEGACIÓN */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-[#312E81] transition"
      >
        <ArrowLeft size={18} />
        Volver al listado
      </button>

      {/* TARJETA DE PERFIL (Header) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-3xl">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt="Player"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>⚽</span>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-[#312E81]">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-gray-500 font-medium">
            {player.category.name} • {new Date(player.birthDate).getFullYear()}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
            <QrCode className="text-gray-800" size={48} />
            {/* Aquí podrías renderizar el QR real usando player.qrCodeToken */}
          </div>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            Carnet Digital
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid md:grid-cols-3 gap-6"
      >
        {/* COLUMNA IZQUIERDA: ESTADO Y APODERADO */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-[#312E81] mb-4 flex items-center gap-2">
              <Activity size={18} /> Estado
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                {...register("active")}
                className="w-5 h-5 text-[#10B981] rounded focus:ring-[#10B981]"
              />
              <span className="text-sm font-medium text-gray-700">
                Jugador Activo
              </span>
            </div>

            <p className="text-xs text-gray-400">
              Desactivar un jugador restringirá su acceso a la app móvil y
              suspenderá cobros futuros.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">
              Datos del Apoderado
            </h3>
            <p className="text-sm font-medium text-[#312E81]">
              {player.guardian.fullName}
            </p>
            <p className="text-sm text-gray-500">{player.guardian.email}</p>
            <p className="text-sm text-gray-500">
              {player.guardian.phone || "Sin teléfono"}
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: FICHA MÉDICA (Editable) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-[#312E81] mb-4">
              Ficha Médica & Antecedentes
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Información Médica / Alergias
                </label>
                <textarea
                  {...register("medicalInfo")}
                  rows={6}
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm leading-relaxed"
                  placeholder="Escribe aquí alergias, condiciones cardíacas, lesiones previas, etc."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#312E81] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-800 transition shadow-lg shadow-indigo-200"
              >
                <Save size={18} />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
