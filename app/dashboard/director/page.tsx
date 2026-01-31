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
   COMPONENT
================================ */
export default function DirectorDashboard() {
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_QUERY);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-lg m-4 border border-red-200">
        Error al cargar datos: {error.message}
      </div>
    );
  }

  if (!data?.me) return null;

  const { me } = data;

  // 🔐 Solo escuelas donde el usuario es DIRECTOR
  const directorSchools = me.schools.filter((s: any) => s.role === "DIRECTOR");

  // 👉 MVP: usamos la primera escuela
  const activeSchoolStaff = directorSchools[0];
  const school = activeSchoolStaff?.school;

  /* ================================
     ESTADO VACÍO
  ================================ */
  if (!school) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-indigo-50 p-8 rounded-full mb-6">
          <Building2 className="h-16 w-16 text-novena-indigo" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Bienvenido, {me.fullName.split(" ")[0]}! 👋
        </h1>

        <p className="text-gray-500 max-w-md text-lg mb-8 leading-relaxed">
          Para acceder al panel de control y comenzar a gestionar jugadores,
          necesitas registrar tu primera escuela deportiva.
        </p>

        <Link
          href="/onboarding"
          className="group flex items-center gap-3 px-8 py-4 bg-novena-green text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 hover:scale-105 transition-all duration-300"
        >
          Crear mi Escuela ahora
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  /* ================================
     RESOURCE USAGE
  ================================ */
  const usage = school.resourceUsage;

  const currentPlayers = usage?.currentPlayers ?? 0;
  const maxPlayers = usage?.maxPlayers ?? 1;

  const currentCategories = usage?.currentCategories ?? 0;
  const maxCategories = usage?.maxCategories ?? 1;

  const playerPercentage = Math.min((currentPlayers / maxPlayers) * 100, 100);

  const categoryPercentage = Math.min(
    (currentCategories / maxCategories) * 100,
    100,
  );

  /* ================================
     RENDER
  ================================ */
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {me.fullName.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500">{school.name} • Panel de Control</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-50 text-novena-indigo text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
            Plan {school.planType}
          </span>

          <Link
            href="/dashboard/director/subscription"
            className="px-4 py-2 bg-novena-green text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition shadow-sm"
          >
            Mejorar Plan
          </Link>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          icon={<TrendingUp className="h-6 w-6 text-novena-green" />}
          title="Ingresos Mensuales"
          value="$0"
        />

        <KpiCard
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          title="Pagos Pendientes"
          value="0 Alumnos"
        />

        <KpiCard
          icon={<Users className="h-6 w-6 text-novena-indigo" />}
          title="Matrícula Activa"
          value={`${currentPlayers} / ${maxPlayers}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* USAGE */}
        <UsageSection
          currentPlayers={currentPlayers}
          maxPlayers={maxPlayers}
          currentCategories={currentCategories}
          maxCategories={maxCategories}
          playerPercentage={playerPercentage}
          categoryPercentage={categoryPercentage}
        />

        {/* ACTIONS */}
        <QuickActions />
      </div>
    </div>
  );
}

/* ================================
   SUBCOMPONENTS
================================ */

function KpiCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function UsageSection(props: {
  currentPlayers: number;
  maxPlayers: number;
  currentCategories: number;
  maxCategories: number;
  playerPercentage: number;
  categoryPercentage: number;
}) {
  return (
    <section className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-gray-400" />
        Uso de Recursos
      </h2>

      <div className="space-y-8">
        <ProgressBar
          label="Cupos de Jugadores"
          current={props.currentPlayers}
          max={props.maxPlayers}
          percentage={props.playerPercentage}
          color="indigo"
        />

        <ProgressBar
          label="Categorías Creadas"
          current={props.currentCategories}
          max={props.maxCategories}
          percentage={props.categoryPercentage}
          color="green"
        />
      </div>
    </section>
  );
}

function ProgressBar({
  label,
  current,
  max,
  percentage,
  color,
}: {
  label: string;
  current: number;
  max: number;
  percentage: number;
  color: "indigo" | "green";
}) {
  const bgColor =
    color === "green"
      ? "bg-novena-green"
      : percentage > 90
        ? "bg-red-500"
        : "bg-novena-indigo";

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-500">
          {current} de {max} utilizados
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <section className="bg-novena-indigo text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
      <h2 className="text-xl font-bold mb-6">Acciones Rápidas</h2>

      <div className="grid gap-3">
        <Link
          href="/dashboard/director/players"
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10"
        >
          <Plus className="h-5 w-5 text-white" />
          <span className="font-medium">Nuevo Jugador</span>
        </Link>

        <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl border border-white/10 opacity-60">
          <CalendarCheck className="h-5 w-5 text-white" />
          <span className="font-medium">Tomar Asistencia</span>
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  );
}
