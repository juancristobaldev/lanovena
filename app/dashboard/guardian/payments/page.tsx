import React from "react";
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Receipt,
} from "lucide-react";

// Colores según Manual de Identidad:
// Indigo Profundo: #312E81
// Verde Araucanía: #10B981

const PaymentsPage = () => {
  // Datos de ejemplo basados en la estructura del sistema
  const payments = [
    {
      id: "1",
      month: "Octubre 2023",
      amount: 35000,
      status: "paid",
      date: "05/10/2023",
      child: "Bastián",
    },
    {
      id: "2",
      month: "Noviembre 2023",
      amount: 35000,
      status: "pending",
      date: "-",
      child: "Bastián",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header con Identidad Regional */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#312E81]">Centro de Pagos</h1>
        <p className="text-gray-600">
          Gestiona las mensualidades de tus hijos de forma segura y rápida.
        </p>
      </header>

      {/* Tarjeta de Resumen de Deuda (Modo Comercial) */}
      <div className="bg-white border-l-4 border-[#10B981] p-6 rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">
            Mensualidad Pendiente
          </p>
          <p className="text-4xl font-black text-[#312E81]">$35.000</p>
        </div>
        <button className="bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-md">
          <CreditCard size={20} />
          Pagar Ahora
        </button>
      </div>

      {/* Listado de Pagos y Comprobantes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-[#312E81] flex items-center gap-2">
            <Receipt size={18} />
            Historial de Transacciones
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-full ${payment.status === "paid" ? "bg-green-100 text-[#10B981]" : "bg-amber-100 text-amber-600"}`}
                >
                  {payment.status === "paid" ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <AlertCircle size={24} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">
                    {payment.month} - {payment.child}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.status === "paid"
                      ? `Pagado el ${payment.date}`
                      : "Pendiente de pago"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <p className="font-bold text-[#312E81]">
                  ${payment.amount.toLocaleString()}
                </p>
                {payment.status === "paid" ? (
                  <button className="text-[#312E81] hover:text-[#10B981] flex items-center gap-1 text-sm font-medium border border-gray-200 px-3 py-1 rounded-md transition-colors">
                    <Download size={16} />
                    Boleta
                  </button>
                ) : (
                  <ChevronRight className="text-gray-300" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje de Seguridad UX */}
      <footer className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start border border-blue-100">
        <div className="text-[#312E81]">
          <AlertCircle size={20} />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="font-bold">Pago Seguro:</span> Utilizamos tecnología
          cifrada para proteger tus datos. Los comprobantes se generan
          automáticamente al finalizar la transacción.
        </p>
      </footer>
    </div>
  );
};

export default PaymentsPage;
