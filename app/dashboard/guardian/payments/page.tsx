"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Copy,
  AlertCircle,
  CheckCircle2,
  History,
  ChevronRight,
  Wallet,
  Send,
  Download,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert"; // Asumiendo que tienes este provider

// === GRAPHQL ===
// Traemos datos bancarios de la escuela y estado de los hijos
const GET_PAYMENTS_DATA = gql`
  query GetPaymentsData {
    meGuardian {
      id
      school {
        id
        name
        bankDetails # Texto con los datos de transferencia
        currency # CLP, USD
      }
      managedPlayers {
        id
        firstName
        photoUrl
        category {
          name
        }
        # Traemos las cuotas del año actual
        monthlyFees(limit: 12) {
          id
          month
          year
          amount
          status # PENDING, PAID, OVERDUE, WAIVED
          dueDate
        }
      }
    }
  }
`;

export default function PaymentsPage() {
  const { showAlert } = useAlert();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [showBankDetails, setShowBankDetails] = useState(false);

  const { data, loading }: any = useQuery(GET_PAYMENTS_DATA);

  const school = data?.meGuardian?.school;
  const players = data?.meGuardian?.managedPlayers || [];

  // Auto-seleccionar
  React.useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const currentPlayer = players.find((p: any) => p.id === selectedPlayerId);
  const fees = currentPlayer?.monthlyFees || [];

  // Ordenar cuotas: Pendientes primero
  const sortedFees = [...fees].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return b.month - a.month; // Luego por mes descendente
  });

  // Calculadora de Deuda Total
  const totalDebt = sortedFees
    .filter((f: any) => f.status === "PENDING" || f.status === "OVERDUE")
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const handleCopyBankDetails = () => {
    if (school?.bankDetails) {
      navigator.clipboard.writeText(school.bankDetails);
      showAlert("Datos bancarios copiados", "success");
    }
  };

  const handleReportPayment = (fee: any) => {
    // Aquí iría la lógica para abrir un modal de subida de comprobante
    // Por ahora, simulamos una acción de contacto
    const message = `Hola, envío comprobante de pago de ${currentPlayer.firstName} correspondiente al mes ${fee.month}.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return months[month - 1];
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Cargando pagos...</div>
    );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-indigo-900 text-white p-6 pt-10 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Pagos y Cuotas</h1>
            <p className="text-indigo-200 text-sm">
              Gestiona la mensualidad de tus hijos
            </p>
          </div>
          <div className="bg-white/10 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Selector de Hijos */}
        {players.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {players.map((player: any) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  player.id === selectedPlayerId
                    ? "bg-white text-indigo-900 border-white"
                    : "bg-indigo-800 text-indigo-200 border-indigo-700"
                }`}
              >
                {player.firstName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 space-y-6 -mt-6">
        {/* CARD: RESUMEN DE DEUDA */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 relative z-10">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Deuda Total a la Fecha
          </p>
          <div className="flex items-end justify-between">
            <h2
              className={`text-3xl font-black ${totalDebt > 0 ? "text-gray-900" : "text-emerald-500"}`}
            >
              {formatCurrency(totalDebt)}
            </h2>
            {totalDebt === 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> AL DÍA
              </span>
            )}
          </div>

          {totalDebt > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="w-full bg-indigo-900 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                {showBankDetails ? "Ocultar Datos" : "Cómo Pagar"}
              </button>
            </div>
          )}
        </div>

        {/* SECCIÓN: DATOS BANCARIOS (Desplegable) */}
        {showBankDetails && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-blue-900 text-sm">
                Datos de Transferencia
              </h3>
              <button
                onClick={handleCopyBankDetails}
                className="text-blue-600 hover:text-blue-800"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-100 text-sm font-mono text-gray-600 whitespace-pre-line mb-3 shadow-sm">
              {school?.bankDetails ||
                "Solicita los datos bancarios a la administración."}
            </div>

            <p className="text-xs text-blue-700 flex items-start gap-1.5">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              Recuerda enviar el comprobante indicando el nombre del alumno para
              validar el pago.
            </p>
          </div>
        )}

        {/* LISTADO DE CUOTAS */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <History size={16} /> Historial de Cuotas
          </h3>

          <div className="space-y-3">
            {sortedFees.length > 0 ? (
              sortedFees.map((fee: any) => (
                <div
                  key={fee.id}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border transition-all
                    ${fee.status === "PAID" ? "bg-white border-gray-100" : "bg-white border-l-4 shadow-sm"}
                    ${fee.status === "OVERDUE" ? "border-l-red-500" : ""}
                    ${fee.status === "PENDING" ? "border-l-amber-400" : ""}
                  `}
                >
                  {/* Info Izquierda */}
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      Mensualidad {getMonthName(fee.month)} {fee.year}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Vencimiento: {new Date(fee.dueDate).toLocaleDateString()}
                    </p>

                    {/* Badge Estado */}
                    <div className="mt-2">
                      {fee.status === "PAID" && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10} /> PAGADO
                        </span>
                      )}
                      {fee.status === "PENDING" && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded w-fit">
                          PENDIENTE
                        </span>
                      )}
                      {fee.status === "OVERDUE" && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <AlertCircle size={10} /> VENCIDO
                        </span>
                      )}
                      {fee.status === "WAIVED" && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded w-fit">
                          BECADO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Derecha & Acciones */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(fee.amount)}
                    </p>

                    {fee.status !== "PAID" && fee.status !== "WAIVED" ? (
                      <button
                        onClick={() => handleReportPayment(fee)}
                        className="mt-2 text-xs font-bold text-emerald-600 flex items-center justify-end gap-1 hover:underline"
                      >
                        Informar <Send size={12} />
                      </button>
                    ) : (
                      <button className="mt-2 text-xs font-medium text-gray-400 flex items-center justify-end gap-1 hover:text-indigo-600">
                        Recibo <Download size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">
                  No hay registros de cuotas para este periodo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
