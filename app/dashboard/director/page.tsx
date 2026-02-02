"use client";

import { gql } from "@apollo/client";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  AlertCircle,
  Plus,
  CalendarCheck,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";

/* ================================
   GRAPHQL QUERY
================================ */
const DASHBOARD_QUERY = gql`
  query GetDirectorDashboard {
    me {
      id
      fullName
      schools {
        id
        role
        school {
          id
          name
          planType
          resourceUsage {
            currentPlayers
            maxPlayers
            currentCategories
            maxCategories
          }
        }
      }
    }
  }
`;

/* ================================
   TYPES
================================ */
type ResourceUsage = {
  currentPlayers: number;
  maxPlayers: number;
  currentCategories: number;
  maxCategories: number;
};

type School = {
  id: string;
  name: string;
  planType: string;
  resourceUsage?: ResourceUsage;
};

type SchoolStaff = {
  id: string;
  role: "DIRECTOR" | "COACH" | "STAFF";
  school: School;
};

type Me = {
  id: string;
  fullName: string;
  schools: SchoolStaff[];
};

type DashboardData = {
  me: Me;
};

/* ================================
   MAIN COMPONENT
================================ */
export default function DirectorDashboard() {
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_QUERY);

  // --- SKELETON LOADING ---
  if (loading) return <DashboardSkeleton />;

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4 text-red-700">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="font-bold">Error al cargar el panel</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.me) return null;
  const { me } = data;

  // Lógica de Selección de Escuela (MVP: Primera donde sea Director)
  const directorSchools = me.schools.filter((s: any) => s.role === "DIRECTOR");
  const activeSchoolStaff = directorSchools[0];
  const school = activeSchoolStaff?.school;

  // --- EMPTY STATE (Sin Escuela) ---
  if (!school) {
    return <EmptyState userName={me.fullName} />;
  }

  // --- DATA PREPARATION ---
  const usage = school.resourceUsage;
  const currentPlayers = usage?.currentPlayers ?? 0;
  const maxPlayers = usage?.maxPlayers ?? 1;
  const currentCategories = usage?.currentCategories ?? 0;
  const maxCategories = usage?.maxCategories ?? 1;

  // Cálculos de Porcentaje
  const playerPercentage = Math.round(
    Math.min((currentPlayers / maxPlayers) * 100, 100),
  );
  const categoryPercentage = Math.round(
    Math.min((currentCategories / maxCategories) * 100, 100),
  );

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 space-y-8 animate-fade-in">
      {/* 1. HEADER CONTEXTUAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-[#312E81] text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Director Deportivo
            </span>
            <span className="text-gray-400 text-xs">
              {new Date().toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Hola, {me.fullName.split(" ")[0]}
          </h1>
          <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
            <Building2 size={16} />
            {school.name}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="px-3">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Plan Actual
            </p>
            <p className="text-sm font-bold text-[#312E81]">
              {school.planType}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <Link
            href="/dashboard/director/subscription"
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95"
          >
            <Zap size={16} fill="currentColor" />
            Mejorar
          </Link>
        </div>
      </header>

      {/* 2. KPI GRID (Stats Rápidas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<CreditCard className="h-6 w-6 text-white" />}
          iconColor="bg-blue-500"
          title="Ingresos Estimados"
          value="$0" // Placeholder para funcionalidad futura
          subtext="Este mes"
          trend="+0%"
        />
        <StatCard
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          iconColor="bg-amber-500"
          title="Pagos Pendientes"
          value="0"
          subtext="Alumnos morosos"
          trend="0%"
          trendColor="text-gray-400"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-white" />}
          iconColor="bg-[#312E81]"
          title="Matrícula Total"
          value={String(currentPlayers)}
          subtext={`Capacidad: ${maxPlayers}`}
          trend={`${playerPercentage}%`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 3. COLUMNA IZQUIERDA: Uso de Recursos */}
        <section className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-[#312E81]" />
                  Estado de la Suscripción
                </h2>
                <p className="text-sm text-gray-500">
                  Uso actual de los recursos de tu plan.
                </p>
              </div>
              <div className="hidden sm:block">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                  <ShieldCheck size={14} /> Sistema Operativo
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              <ResourceItem
                label="Jugadores Activos"
                current={currentPlayers}
                max={maxPlayers}
                percentage={playerPercentage}
                icon={<Users size={20} />}
              />
              <ResourceItem
                label="Categorías / Series"
                current={currentCategories}
                max={maxCategories}
                percentage={categoryPercentage}
                icon={<LayoutDashboard size={20} />}
              />
            </div>
          </div>

          {/* Banner Promocional (Opcional UX para llenar espacio vacío) */}
          <div className="bg-gradient-to-r from-[#312E81] to-[#4338CA] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-indigo-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <h3 className="font-bold text-lg">
                ¿Necesitas ayuda con la plataforma?
              </h3>
              <p className="text-indigo-200 text-sm">
                Nuestro equipo de soporte está listo para orientarte.
              </p>
            </div>
            <button className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap">
              Contactar Soporte
            </button>
          </div>
        </section>

        {/* 4. COLUMNA DERECHA: Acciones Rápidas */}
        <section>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Acciones Rápidas
            </h2>
            <div className="space-y-3">
              <ActionCard
                href="/dashboard/director/players"
                icon={<Plus size={20} />}
                title="Nuevo Jugador"
                desc="Registrar matrícula"
                color="text-indigo-600"
                bg="bg-indigo-50"
              />

              <ActionCard
                href="/dashboard/director/payments" // Asumiendo ruta
                icon={<CreditCard size={20} />}
                title="Registrar Pago"
                desc="Ingreso manual"
                color="text-blue-600"
                bg="bg-blue-50"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================================
   SUB-COMPONENTES UI
================================ */

function StatCard({
  icon,
  iconColor,
  title,
  value,
  subtext,
  trend,
  trendColor = "text-emerald-600",
}: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl shadow-md ${iconColor}`}>{icon}</div>
        {trend && (
          <span
            className={`text-xs font-bold ${trendColor} bg-gray-50 px-2 py-1 rounded-full`}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function ResourceItem({ label, current, max, percentage, icon }: any) {
  // Color lógico semántico
  let colorClass = "bg-[#312E81]"; // Default Indigo
  let textClass = "text-[#312E81]";

  if (percentage >= 90) {
    colorClass = "bg-red-500";
    textClass = "text-red-600";
  } else if (percentage >= 75) {
    colorClass = "bg-amber-500";
    textClass = "text-amber-600";
  } else {
    colorClass = "bg-[#10B981]";
    textClass = "text-[#10B981]";
  } // Verde sano

  return (
    <div>
      <div className="flex justify-between items-end mb-3">
        <div className="flex items-center gap-2">
          <div className="text-gray-400">{icon}</div>
          <span className="font-bold text-gray-700">{label}</span>
        </div>
        <span
          className={`text-sm font-bold ${textClass} bg-gray-50 px-2 py-0.5 rounded border border-gray-100`}
        >
          {percentage}% Ocupado
        </span>
      </div>

      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full ${colorClass} transition-all duration-1000 ease-out relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
        </div>
      </div>

      <div className="flex justify-between mt-2 text-xs font-medium text-gray-400">
        <span>0</span>
        <span>
          {current} / {max} disponibles
        </span>
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, desc, color, bg }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group bg-white hover:bg-gray-50"
    >
      <div
        className={`p-3 rounded-lg ${bg} ${color} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-sm group-hover:text-[#312E81] transition-colors">
          {title}
        </h4>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ArrowRight
        size={16}
        className="text-gray-300 group-hover:text-[#312E81] group-hover:translate-x-1 transition-all"
      />
    </Link>
  );
}

/* ================================
   EMPTY STATE (Onboarding)
================================ */
function EmptyState({ userName }: { userName: string }) {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-8 md:p-12 rounded-3xl shadow-xl text-center border border-gray-100 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#312E81] via-[#4338CA] to-[#10B981]"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

        <div className="inline-flex p-5 bg-indigo-50 rounded-full text-[#312E81] mb-8 shadow-sm relative z-10">
          <Building2 className="h-12 w-12" />
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          ¡Bienvenido, {userName.split(" ")[0]}!
        </h1>

        <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
          Estás a un paso de profesionalizar tu gestión deportiva. Para
          comenzar, necesitamos registrar los datos básicos de tu escuela.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/onboarding"
            className="group flex items-center gap-3 px-8 py-4 bg-[#312E81] text-white font-bold rounded-xl shadow-lg hover:bg-indigo-900 hover:shadow-indigo-900/30 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto justify-center"
          >
            Crear mi Escuela
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button className="text-gray-500 font-medium hover:text-gray-800 transition-colors text-sm px-6 py-4">
            Ver tutorial
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================
   SKELETON (Carga)
================================ */
function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse min-h-screen">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-10 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-80 bg-gray-200 rounded-2xl"></div>
        <div className="h-80 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  );
}
