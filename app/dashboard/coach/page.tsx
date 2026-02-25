"use client";

import { gql } from "@apollo/client";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import {
  User,
  Bell,
  Clock,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  ChevronRight,
  Shield,
  Sprout,
  LandPlot,
  Megaphone,
  Eye,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";

// --- GRAPHQL QUERY ACTUALIZADA ---
export const GET_COACH_DASHBOARD = gql`
  query GetCoachDashboard($schoolId: ID!) {
    meCoach {
      id
      fullName
      schoolId
      coachProfile {
        id
        categories {
          id
          name
          type
          sessions {
            id
            date
          }
        }
      }
    }
    # Consulta de noticias integrada
    notices(schoolId: $schoolId) {
      id
      title
      summary
      image
      createdAt
      views
    }
  }
`;

// --- TYPES ---
interface Notice {
  id: string;
  title: string;
  summary: string;
  image?: string;
  createdAt: string;
  views: number;
}

interface Session {
  id: string;
  date: string;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  type: "FORMATIVA" | "SELECTIVA";
  sessions: Session[];
}

interface CoachData {
  meCoach: {
    id: string;
    fullName: string;
    schoolId: string;
    coachProfile: {
      id: string;
      categories: Category[];
    };
  };
  notices: Notice[];
}

export default function CoachDashboard() {
  // Nota: En una implementación real, el schoolId vendría del contexto del usuario (me.schoolId)
  // Aquí usamos el schoolId del perfil del coach una vez cargado o un valor inicial.
  const { data, loading, error } = useQuery<CoachData>(GET_COACH_DASHBOARD, {
    variables: { schoolId: "id-de-la-escuela" }, // Reemplazar con lógica de sesión real
    fetchPolicy: "network-only",
  });

  const nextSession = useMemo(() => {
    if (!data?.meCoach?.coachProfile?.categories) return null;
    const allSessions: Session[] = [];
    const now = new Date();
    now.setHours(now.getHours() - 1);

    data.meCoach.coachProfile.categories.forEach((cat) => {
      cat.sessions.forEach((sess) => {
        allSessions.push({ ...sess, categoryName: cat.name });
      });
    });

    const upcoming = allSessions
      .filter((s) => new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [data]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState />;

  const coachName = data?.meCoach?.fullName.split(" ")[0] || "Profe";
  const categories = data?.meCoach?.coachProfile?.categories || [];
  const notices = data?.notices || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-sm mb-6 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <h1 className="text-2xl font-bold text-[#312E81]">
              Hola, {coachName}{" "}
              <span className="animate-pulse inline-block">👋</span>
            </h1>
          </div>
        </div>
      </header>

      <div className="px-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. PRÓXIMA SESIÓN (HERO CARD) */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
            Tu Pizarra Hoy
          </h2>
          {nextSession ? (
            <Link href={`/dashboard/coach/session/${nextSession.id}`}>
              <div className="group relative bg-gradient-to-br from-[#312E81] to-[#4F46E5] rounded-3xl p-6 text-white shadow-xl shadow-indigo-100/50 active:scale-[0.98] transition-all overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black">
                      {isToday(new Date(nextSession.date))
                        ? "AHORA"
                        : "PRÓXIMO"}
                    </span>
                    <LandPlot className="text-emerald-300 w-6 h-6 opacity-50" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {nextSession.categoryName}
                    </h3>
                    <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(nextSession.date), "HH:mm")} hrs
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-white rounded-3xl p-6 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-xs font-bold">
                Sin sesiones próximas
              </p>
            </div>
          )}
        </section>

        {/* 2. VIDA DEL CLUB (NOTICIAS) - NUEVA SECCIÓN */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Vida del Club
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-5 px-5">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden shrink-0"
              >
                {notice.image && (
                  <div className="h-32 w-full overflow-hidden">
                    <img
                      src={notice.image}
                      alt={notice.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-[#10B981] uppercase tracking-widest">
                      Novedad
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                      <Eye size={10} /> {notice.views}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-1">
                    {notice.title}
                  </h3>
                  <p className="text-gray-500 text-[11px] line-clamp-2 leading-relaxed">
                    {notice.summary}
                  </p>
                </div>
              </div>
            ))}

            {notices.length === 0 && (
              <div className="w-full bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                <Megaphone className="mx-auto w-6 h-6 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-bold">
                  No hay novedades registradas
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 3. ATAJOS RÁPIDOS */}
        {/*
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
            Herramientas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-[#312E81] rounded-xl flex items-center justify-center">
                <CalendarDays size={20} />
              </div>
              <span className="text-[10px] font-black text-gray-600 uppercase">
                Agenda
              </span>
            </button>
            <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-[#10B981] rounded-xl flex items-center justify-center">
                <ClipboardCheck size={20} />
              </div>
              <span className="text-[10px] font-black text-gray-600 uppercase">
                Asistencia
              </span>
            </button>
          </div>
        </section>
      */}

        {/* 4. MIS PLANTELLES */}
        <section className="pb-10">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
            Mis Categorías
          </h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <Link
                href={`/dashboard/coach/category/${cat.id}`}
                key={cat.id}
                className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#312E81] transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${cat.type === "SELECTIVA" ? "bg-[#312E81]" : "bg-[#10B981]"}`}
                    >
                      {cat.type === "SELECTIVA" ? (
                        <Shield size={18} />
                      ) : (
                        <Sprout size={18} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {cat.name}
                      </h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {cat.type === "SELECTIVA" ? "Competencia" : "Formativa"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- SKELETON & ERROR (MANTENER IGUAL) ---
function DashboardSkeleton() {
  return (
    <div className="p-6 pt-12 animate-pulse space-y-8">
      <div className="h-8 w-48 bg-gray-200 rounded"></div>
      <div className="h-48 bg-gray-200 rounded-3xl"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="h-screen flex items-center justify-center p-6 text-center">
      <p className="text-[#312E81] font-bold">Error de conexión. Reintenta.</p>
    </div>
  );
}
