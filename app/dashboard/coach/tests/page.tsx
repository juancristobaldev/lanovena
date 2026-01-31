"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";

// Tipos simulados
type TestType = "VELOCIDAD_30M" | "SALTO_Largo" | "YOYO_TEST";

export default function TestsPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log("Guardando evaluación...", {
      ...data,
      playerId: selectedPlayer,
    });
    // Aquí llamar a mutación: createEvaluation(...)
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-[#312E81] mb-6">
        Nueva Evaluación
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Selector de Jugador */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jugador
          </label>
          <select
            className="w-full p-3 border rounded-lg bg-gray-50 text-lg"
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">Seleccionar alumno...</option>
            <option value="p1">Mateo (Sub-12)</option>
            <option value="p2">Lucas (Sub-12)</option>
          </select>
        </div>

        {/* 2. Tipo de Test */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prueba
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["Velocidad", "Resistencia", "Fuerza", "Técnica"].map((type) => (
              <label
                key={type}
                className="border p-3 rounded-lg flex items-center gap-2 has-[:checked]:border-[#10B981] has-[:checked]:bg-green-50"
              >
                <input
                  type="radio"
                  value={type}
                  {...register("type")}
                  className="accent-[#10B981]"
                />
                <span className="font-medium">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Resultado (Input Gigante) */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resultado
          </label>
          <div className="flex items-end gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("value", { required: true })}
              className="w-full text-4xl font-bold text-[#312E81] p-2 border-b-2 border-[#10B981] focus:outline-none placeholder-gray-300"
            />
            <span className="text-gray-500 font-medium mb-2">seg/mts</span>
          </div>
        </div>

        {/* Action */}
        <button
          type="submit"
          className="w-full bg-[#312E81] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          Guardar Resultado
        </button>
      </form>
    </div>
  );
}
