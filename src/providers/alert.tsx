"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

// Tipos de alerta disponibles
export type AlertType = "success" | "error" | "info" | "warning";

interface AlertMessage {
  type: AlertType;
  text: string;
}

interface AlertContextType {
  message: AlertMessage | null;
  // Función para lanzar alertas
  showAlert: (text: string, type?: AlertType, duration?: number) => void;
  // Función para cerrar manualmente
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<AlertMessage | null>(null);

  const closeAlert = useCallback(() => {
    setMessage(null);
  }, []);

  const showAlert = useCallback(
    (text: string, type: AlertType = "info", duration = 5000) => {
      setMessage({ text, type });

      // Auto-cierre después de X segundos
      if (duration > 0) {
        setTimeout(() => {
          setMessage(null);
        }, duration);
      }
    },
    [],
  );

  return (
    <AlertContext.Provider value={{ message, showAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert debe usarse dentro de un AlertProvider");
  }
  return context;
}
