"use client";

import React, { useMemo } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Receipt,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  Building2,
  BadgeDollarSign,
  Power,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { useAlert } from "@/src/providers/alert"; // Asumiendo que usas tu provider de alertas

// ==========================================
// 1. DEFINICIÓN DE GRAPHQL (Adaptado a tus ObjectTypes)
// ==========================================

const GET_BILLING_DATA = gql`
  query GetBillingData {
    adminBillingOverview {
      id
      amount
      status
      dueDate
      school {
        name
      }
    }
    adminOverdueSchools {
      id
      name
      overduePayments
      totalDebt
    }
  }
`;

const WAIVE_FEE = gql`
  mutation AdminWaiveFee($feeId: String!) {
    adminWaiveFee(feeId: $feeId) {
      id
    }
  }
`;

const TOGGLE_KILL_MODE = gql`
  mutation AdminToggleKillMode($schoolId: String!, $activate: Boolean!) {
    adminToggleKillMode(schoolId: $schoolId, activate: $activate) {
      id
      isActive
    }
  }
`;

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================

export default function SuperAdminBillingPage() {
  const { showAlert } = useAlert();

  const { data, loading, error, refetch }: any = useQuery(GET_BILLING_DATA, {
    fetchPolicy: "cache-and-network",
  });

  const [waiveFee, { loading: waiving }] = useMutation(WAIVE_FEE, {
    onCompleted: () => {
      showAlert("Cuota condonada con éxito.", "success");
      refetch();
    },
    onError: (err) => showAlert(err.message, "error"),
  });

  const [toggleKillMode, { loading: togglingKill }] = useMutation(
    TOGGLE_KILL_MODE,
    {
      onCompleted: () => {
        showAlert("Kill Mode ejecutado. Escuela bloqueada.", "success");
        refetch();
      },
      onError: (err) => showAlert(err.message, "error"),
    },
  );

  // --- MANEJADORES DE ACCIONES ---

  const handleWaiveFee = (feeId: string, schoolName: string) => {
    if (
      window.confirm(
        `¿Seguro que deseas condonar esta cuota de ${schoolName}? Esto ajustará la facturación de forma irreversible.`,
      )
    ) {
      waiveFee({ variables: { feeId } });
    }
  };

  const handleKillMode = (schoolId: string, schoolName: string) => {
    if (
      window.confirm(
        `⚠️ ADVERTENCIA CRÍTICA: Estás a punto de aplicar el KILL MODE a ${schoolName}. Esto bloqueará el acceso a toda su red de usuarios de forma inmediata. ¿Proceder?`,
      )
    ) {
      toggleKillMode({ variables: { schoolId, activate: true } });
    }
  };

  // --- CÁLCULO DE KPIs ---

  const overdues = data?.adminOverdueSchools || [];
  const billings = data?.adminBillingOverview || [];

  const kpis = useMemo(() => {
    const totalDebt = overdues.reduce(
      (acc: number, curr: any) => acc + curr.totalDebt,
      0,
    );
    const expectedRevenue = billings.reduce(
      (acc: number, curr: any) => acc + curr.amount,
      0,
    );
    return { totalDebt, expectedRevenue, overduesCount: overdues.length };
  }, [overdues, billings]);

  // --- ESTADOS DE CARGA Y ERROR ---

  if (loading && !data) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-black tracking-widest uppercase text-xs animate-pulse">
          Sincronizando con ERP/SII...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-[#F8FAFC] flex-1">
        <div className="bg-red-50 text-red-700 p-8 rounded-[2rem] border border-red-200 flex flex-col items-center text-center shadow-sm mt-10">
          <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
          <h3 className="font-black text-2xl tracking-tight text-slate-900">
            Falla de Integración ERP
          </h3>
          <p className="text-slate-600 font-medium mt-2 max-w-lg">
            {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC] custom-scrollbar animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <header className="bg-white h-24 border-b border-slate-200 flex justify-between items-center px-10 shadow-sm shrink-0 sticky top-0 z-20">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="text-[#312E81]" size={28} /> Facturación &
            Morosidad
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Monitor de ingresos SaaS, emisiones tributarias y gestión de deuda.
          </p>
        </div>
        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
          <FileText size={16} /> Exportar Reporte
        </button>
      </header>

      <div className="p-10 space-y-10">
        {/* === KPIs FINANCIEROS === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Facturado (Mes)
            </p>
            <h3 className="text-4xl font-black text-slate-900 text-transparent bg-clip-text bg-gradient-to-r from-[#312E81] to-[#4F46E5]">
              ${kpis.expectedRevenue.toLocaleString("es-CL")}
            </h3>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden bg-red-50/30">
            <div className="absolute -right-4 -top-4 text-red-500/10">
              <BadgeDollarSign size={100} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                Deuda Total Pendiente
              </p>
              <h3 className="text-4xl font-black text-red-600">
                ${kpis.totalDebt.toLocaleString("es-CL")}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm flex flex-col justify-between relative overflow-hidden bg-orange-50/30">
            <div className="absolute -right-4 -top-4 text-orange-500/10">
              <ShieldAlert size={100} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">
                Escuelas en Riesgo
              </p>
              <h3 className="text-4xl font-black text-orange-600">
                {kpis.overduesCount}{" "}
                <span className="text-lg font-bold text-orange-400">
                  clientes
                </span>
              </h3>
            </div>
          </div>
        </div>

        {/* === SECCIÓN 1: ALERTAS DE MOROSIDAD (Overdue Schools) === */}
        {overdues.length > 0 && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2 pl-2">
              <AlertTriangle size={18} /> Alertas Críticas (Mora)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {overdues.map((school: any) => (
                <div
                  key={school.id}
                  className="bg-white p-6 rounded-[2rem] border-2 border-red-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative z-10 mb-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-200">
                        {school.overduePayments} Pagos Atrasados
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">
                      {school.name}
                    </h4>
                    <p className="text-3xl font-black text-red-600 mt-3 flex items-center gap-1">
                      <span className="text-xl text-red-400">$</span>
                      {school.totalDebt.toLocaleString("es-CL")}
                    </p>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 gap-3 mt-auto pt-5 border-t border-slate-100">
                    <button
                      onClick={() => handleKillMode(school.id, school.name)}
                      disabled={togglingKill}
                      className="col-span-2 bg-red-600 hover:bg-slate-900 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      {togglingKill ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Power size={16} />
                      )}
                      Aplicar Kill Mode
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === SECCIÓN 2: HISTORIAL DE FACTURACIÓN === */}
        <div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-2">
            <FileText size={18} className="text-[#312E81]" /> Emisión de
            Documentos (SII)
          </h3>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                      Cliente / Escuela
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                      Vencimiento
                    </th>
                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                      Monto (CLP)
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                      Estado / Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-16 text-center text-slate-500 font-medium"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Receipt size={40} className="text-slate-300" />
                          <p>No hay registros de facturación recientes.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    billings.map((bill: any) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#312E81] flex items-center justify-center shrink-0">
                              <Building2 size={18} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm">
                                {bill.school.name}
                              </span>
                              <br />
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5 inline-block">
                                Suscripción SaaS
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={16}
                              className="text-slate-400"
                            />
                            {new Date(bill.dueDate).toLocaleDateString(
                              "es-CL",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 font-black text-slate-800 shadow-sm">
                            <BadgeDollarSign
                              size={16}
                              className={
                                bill.status === "PAID"
                                  ? "text-emerald-500"
                                  : "text-slate-400"
                              }
                            />
                            {bill.amount.toLocaleString("es-CL")}
                          </div>
                        </td>

                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* BOTÓN CONDONAR SOLO SI ESTÁ PENDIENTE */}
                            {bill.status === "PENDING" && (
                              <button
                                onClick={() =>
                                  handleWaiveFee(bill.id, bill.school.name)
                                }
                                disabled={waiving}
                                className="text-xs font-bold text-slate-400 hover:text-indigo-600 underline mr-2"
                              >
                                Condonar
                              </button>
                            )}

                            {/* BADGES DE ESTADO */}
                            {bill.status === "PAID" && (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-200 shadow-sm w-32 justify-center">
                                <CheckCircle2 size={14} /> Pagada
                              </span>
                            )}
                            {bill.status === "PENDING" && (
                              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-orange-200 shadow-sm animate-pulse w-32 justify-center">
                                <Clock size={14} /> Pendiente
                              </span>
                            )}
                            {bill.status === "OVERDUE" && (
                              <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-red-200 shadow-sm w-32 justify-center">
                                <XCircle size={14} /> Vencida
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
