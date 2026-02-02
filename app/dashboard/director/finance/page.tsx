"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  School,
  ChevronDown,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  CreditCard,
  Banknote,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// === GRAPHQL OPERATIONS ===

const GET_FINANCE_DASHBOARD = gql`
  query GetFinanceDashboard($schoolId: ID!, $month: Int!, $year: Int!) {
    financeSummary(schoolId: $schoolId, month: $month, year: $year) {
      totalCollected
      totalPending
      totalOverdue
      expectedTotal
      collectionRate
    }
    monthlyFees(schoolId: $schoolId, month: $month, year: $year) {
      id
      amount
      status
      dueDate
      paymentDate
      paymentMethod
      player {
        id
        firstName
        lastName
        category {
          name
        }
      }
    }
  }
`;

const MARK_FEE_PAID = gql`
  mutation MarkFeeAsPaid($input: MarkFeeAsPaidInput!) {
    markFeeAsPaid(input: $input) {
      id
      status
      paymentDate
    }
  }
`;

// === CONSTANTS & UTILS ===

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const YEARS = [2024, 2025, 2026];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export default function FinancePage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();

  // --- ESTADOS ---
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal de Pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("TRANSFER");

  // --- SELECCIÓN DE ESCUELA ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // @ts-ignore
    return user.schools || [];
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].school.id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERIES & MUTATIONS ---
  const { data, loading, refetch }: any = useQuery(GET_FINANCE_DASHBOARD, {
    variables: {
      schoolId: selectedSchoolId,
      month: selectedMonth,
      year: selectedYear,
    },
    skip: !selectedSchoolId,
    fetchPolicy: "network-only",
  });

  const [markAsPaid, { loading: processingPayment }] =
    useMutation(MARK_FEE_PAID);

  // --- HANDLERS ---

  const handleOpenPayment = (fee: any) => {
    setSelectedFee(fee);
    setPaymentMethod("TRANSFER");
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    try {
      await markAsPaid({
        variables: {
          input: {
            feeId: selectedFee.id,
            paymentMethod: paymentMethod,
          },
        },
      });
      showAlert("Pago registrado exitosamente", "success");
      setPaymentModalOpen(false);
      refetch();
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al registrar pago", "error");
    }
  };

  // --- FILTRADO LOCAL ---
  const filteredFees = useMemo(() => {
    if (!data?.monthlyFees) return [];

    return data.monthlyFees.filter((fee: any) => {
      const matchesSearch = fee.player.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || fee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  // --- RENDER HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Pagado
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Pendiente
          </span>
        );
      case "OVERDUE":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Vencido
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
            N/A
          </span>
        );
    }
  };

  if (userLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-indigo-900" />
      </div>
    );

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Finanzas</h1>
          <p className="text-gray-600">
            Control de mensualidades y flujo de caja.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Selector de Escuela */}
          {availableSchools.length > 1 && (
            <div className="relative group bg-white border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
              <School className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-indigo-900 cursor-pointer appearance-none pr-6"
              >
                {availableSchools.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
            </div>
          )}

          {/* Selector Fecha */}
          <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-r border-gray-200 bg-gray-50">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm font-medium text-gray-700 outline-none cursor-pointer bg-white hover:bg-gray-50"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 text-sm font-medium text-gray-700 outline-none cursor-pointer border-l border-gray-200 bg-white hover:bg-gray-50"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Recaudado"
            value={formatCurrency(data?.financeSummary?.totalCollected || 0)}
            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
            color="bg-emerald-500"
            subtext={`${data?.financeSummary?.collectionRate || 0}% del objetivo`}
          />
          <KPICard
            title="Por Cobrar"
            value={formatCurrency(data?.financeSummary?.totalPending || 0)}
            icon={<Banknote className="w-5 h-5 text-white" />}
            color="bg-amber-500"
            subtext="En proceso"
          />
          <KPICard
            title="Vencido"
            value={formatCurrency(data?.financeSummary?.totalOverdue || 0)}
            icon={<AlertCircle className="w-5 h-5 text-white" />}
            color="bg-red-500"
            subtext="Requiere gestión"
          />
          <KPICard
            title="Total Esperado"
            value={formatCurrency(data?.financeSummary?.expectedTotal || 0)}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-indigo-500"
            subtext="Meta del mes"
          />
        </div>
      )}

      {/* DATA TABLE SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PAID">Pagados</option>
              <option value="PENDING">Pendientes</option>
              <option value="OVERDUE">Vencidos</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Alumno / Categoría</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">Vencimiento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFees.map((fee: any) => (
                  <tr
                    key={fee.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {fee.player.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fee.player.category?.name || "Sin categoría"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(fee.dueDate).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(fee.status)}
                      {fee.paymentMethod && fee.status === "PAID" && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase flex items-center gap-1">
                          Via{" "}
                          {fee.paymentMethod === "TRANSFER"
                            ? "Transferencia"
                            : "Efectivo"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fee.status !== "PAID" && (
                        <button
                          onClick={() => handleOpenPayment(fee)}
                          className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                        >
                          Validar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredFees.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-400 text-sm"
                    >
                      No se encontraron registros para este criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE PAGO */}
      {paymentModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-indigo-900">Validar Mensualidad</h3>
              <p className="text-xs text-gray-500">Registrar pago manual</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 font-bold uppercase mb-1">
                  Detalle
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-900">
                    {selectedFee.player.fullName}
                  </span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(selectedFee.amount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${paymentMethod === "TRANSFER" ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <CreditCard className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Transferencia</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("CASH")}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${paymentMethod === "CASH" ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <Banknote className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Efectivo</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-2">
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={processingPayment}
                  className="flex-1 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm flex justify-center items-center gap-2"
                >
                  {processingPayment && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para Tarjetas KPI
function KPICard({
  title,
  value,
  icon,
  color,
  subtext,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtext: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-lg shadow-sm ${color} bg-opacity-90`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 leading-tight my-0.5">
          {value}
        </h3>
        <p className="text-xs text-gray-500">{subtext}</p>
      </div>
    </div>
  );
}
