"use client";

import { client } from "../lib/apollo";
import { ApolloProvider } from "@apollo/client/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
