import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import Cookies from "js-cookie";

// 1. Usamos 'new HttpLink' en lugar de 'createHttpLink'
const httpLink = new HttpLink({
  uri: "https://api.lanovena.pro/graphql", // Asegúrate que este puerto coincida con tu backend NestJS
});

// 2. Creamos el Auth Link manualmente usando ApolloLink
// Esto evita la dependencia de 'setContext' y sus advertencias de tipado
const authLink = new ApolloLink((operation, forward) => {
  // Leemos el token de la cookie
  const token = Cookies.get("token");

  // Usamos operation.setContext para inyectar los headers
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }));

  return forward(operation);
});

// 3. Inicializamos el cliente concatenando los links
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
