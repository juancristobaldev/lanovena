"use client";

import Sidebar from "../components/Drawer";
import { client } from "../lib/apollo";
import { ApolloProvider } from "@apollo/client/react";
import { UserProvider } from "./me";
import { AlertProvider } from "./alert";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <UserProvider>
        <AlertProvider>{children}</AlertProvider>
      </UserProvider>
    </ApolloProvider>
  );
}
