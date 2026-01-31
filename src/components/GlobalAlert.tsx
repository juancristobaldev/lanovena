"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { AlertType, useAlert } from "../providers/alert";

export default function GlobalAlert() {
  const { message, closeAlert } = useAlert();

  if (!message) return null;

  // Configuración de estilos e íconos según el tipo
  const styles: Record<AlertType, string> = {
    success: "bg-emerald-50 border-emerald-500 text-emerald-800", // Verde Araucanía
    error: "bg-red-50 border-red-500 text-red-800",
    info: "bg-indigo-50 border-indigo-500 text-indigo-800", // Indigo Profundo
    warning: "bg-amber-50 border-amber-500 text-amber-800",
  };

  const icons: Record<AlertType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-indigo-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-start p-4 border-l-4 rounded-r shadow-lg ${styles[message.type]}`}
      >
        <div className="flex-shrink-0">{icons[message.type]}</div>
        <div className="ml-3 flex-1 pt-0.5">
          <p className="text-sm font-medium">{message.text}</p>
        </div>
        <button
          onClick={closeAlert}
          className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
