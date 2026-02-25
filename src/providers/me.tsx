// src/context/UserContext.tsx
"use client"; // ¡Vital! Los contextos de React solo funcionan en Client Components

// src/graphql/queries/me.ts
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      fullName
      schoolId
      role # IMPORTANTE: Usamos esto para el Drawer condicional
      schools {
        id
        school {
          id
          name
        }
      }
    }
  }
`;

export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  DIRECTOR = "DIRECTOR",
  COACH = "COACH",
  GUARDIAN = "GUARDIAN",
}

import { createContext, useContext, useEffect, useState } from "react";

// Define la forma de tu Usuario (ajusta según tu Schema de Prisma)
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
  school?: {
    id: string;
    name: string;
  };

  schools?: {
    id: string;
    school: {
      id: string;
      name: string;
    };
  }[];
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: any;
  refetchUser: () => void;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, refetch }: any = useQuery(ME_QUERY, {
    // Cache-first es default, pero 'network-only' asegura datos frescos al recargar si prefieres
    fetchPolicy: "cache-first",
    errorPolicy: "all", // Para manejar errores de auth sin explotar
  });

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    } else {
      setUser(null);
    }
  }, [data]);

  const value = {
    user,
    loading,
    error,
    refetchUser: refetch,
    isLoggedIn: !!user,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const hasRole = (user: User | null, roles: UserRole[]) =>
  user && roles.includes(user.role);

// Hook personalizado para usar el contexto fácilmente
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser debe ser usado dentro de un UserProvider");
  }
  return context;
}
