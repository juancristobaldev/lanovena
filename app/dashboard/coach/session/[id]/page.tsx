// src/app/dashboard/coach/session/[id]/page.tsx
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AttendanceList from "./components/AttendanceList"; // Client Component
import ExerciseCard from "./components/ExerciseCard";

// Simulamos la llamada a tu API GraphQL
async function getSession(id: string) {
  // Aquí iría tu fetch de Apollo/GraphQL al backend NestJS
  // Query: trainingSession(id: $id) { id, date, category { players { ... } }, exercises { ... } }
  return {
    id,
    date: new Date(), // Dato simulado
    category: { name: "Sub-12 Selectiva" },
    attendance: [], // Array de asistencias actuales
    exercises: [
      {
        id: "1",
        name: "Rondo 4vs2",
        durationMin: 15,
        description: "Presión alta",
      },
      {
        id: "2",
        name: "Remates al arco",
        durationMin: 20,
        description: "Técnica individual",
      },
    ],
  };
}

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) return notFound();

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      {/* Header Compacto */}
      <header className="mb-6 border-l-4 border-[#10B981] pl-4">
        <h1 className="text-2xl font-bold text-[#312E81]">
          {session.category.name}
        </h1>
        <p className="text-gray-500 capitalize">
          {format(session.date, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </header>

      {/* Tabs o Secciones: Prioridad a la Asistencia */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <span className="bg-[#10B981] w-2 h-2 rounded-full mr-2"></span>
          Asistencia Rápida
        </h2>
        {/* Componente Cliente para interacción rápida */}
        <AttendanceList
          sessionId={session.id}
          initialData={session.attendance}
        />
      </section>

      {/* Planificación del Día */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-[#312E81]">
          Planificación
        </h2>
        <div className="space-y-3">
          {session.exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </section>
    </div>
  );
}
