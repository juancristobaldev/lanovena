import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// 1. Mapa de Dashboards según Rol
const ROLE_DASHBOARDS: Record<string, string> = {
  SUPERADMIN: "/dashboard/admin",
  DIRECTOR: "/dashboard/director",
  COACH: "/dashboard/coach",
  GUARDIAN: "/dashboard/guardian",
};

// 2. Rutas de Autenticación (Prohibidas si ya estás logueado)
const AUTH_ROUTES = ["/login", "/register"];

// 3. Rutas Protegidas (Prohibidas si NO estás logueado)
const PROTECTED_ROUTES_PREFIX = "/dashboard";

// 4. Archivos estáticos y API que siempre pasan
const IGNORED_PATHS = [
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/images",
  "/public",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A. PASO LIBRE: Archivos estáticos, API y la Landing Page ('/')
  // Nota: La landing ('/') no está en AUTH ni PROTECTED, así que pasa por defecto al final.
  if (IGNORED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // B. OBTENER TOKEN
  const token = request.cookies.get("token")?.value;
  let userRole: string | null = null;
  let isTokenValid = false;

  console.log({ token });

  // C. VERIFICAR TOKEN (Si existe)
  if (token) {
    try {
      const secret = new TextEncoder().encode("SUPER_SECRET_KEY");
      const { payload } = await jwtVerify(token, secret);
      userRole = payload.role as string;
      isTokenValid = true;

      console.log({ payload });
    } catch (error) {
      // Si el token expiró o es falso, lo consideramos inválido
      // y permitiremos que la lógica de "Sin Token" se encargue abajo.
      console.error("Token inválido o expirado");
    }
  }

  // === LÓGICA DE CONTROL DE ACCESO ===

  // CASO 1: USUARIO LOGUEADO (Token Válido)
  if (isTokenValid && userRole) {
    // 1.1 Si intenta entrar a Login o Register -> ¡Lo mandamos al Dashboard!
    if (AUTH_ROUTES.includes(pathname)) {
      const targetUrl = ROLE_DASHBOARDS[userRole] || "/dashboard";
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }

    // 1.2 Si intenta entrar al Dashboard -> Aplicamos el PROXY de Roles
    if (pathname.startsWith(PROTECTED_ROUTES_PREFIX)) {
      // a. Redirección desde la raíz /dashboard
      if (pathname === "/dashboard") {
        const targetUrl = ROLE_DASHBOARDS[userRole] || "/login";
        return NextResponse.redirect(new URL(targetUrl, request.url));
      }

      // b. Seguridad por Rol (Proxy Estricto)

      // DIRECTOR
      if (userRole === "DIRECTOR") {
        // Permitimos /director y /settings (ejemplo), bloqueamos lo demás
        if (
          !pathname.startsWith("/dashboard/director") &&
          !pathname.startsWith("/dashboard/settings")
        ) {
          return NextResponse.redirect(
            new URL("/dashboard/director", request.url),
          );
        }
      }

      // COACH
      if (userRole === "COACH") {
        if (!pathname.startsWith("/dashboard/coach")) {
          return NextResponse.redirect(
            new URL("/dashboard/coach", request.url),
          );
        }
      }

      // GUARDIAN
      if (userRole === "GUARDIAN") {
        if (!pathname.startsWith("/dashboard/guardian")) {
          return NextResponse.redirect(
            new URL("/dashboard/guardian", request.url),
          );
        }
      }

      // SUPERADMIN: Pasa a todo (NextResponse.next() implícito al final)
    }
  }

  // CASO 2: USUARIO NO LOGUEADO (Sin Token o Inválido)
  if (!isTokenValid) {
    // 2.1 Si intenta entrar al Dashboard -> ¡A Login!
    if (pathname.startsWith(PROTECTED_ROUTES_PREFIX)) {
      const loginUrl = new URL("/login", request.url);
      // Opcional: Guardamos a dónde quería ir para redirigirlo después de loguearse
      loginUrl.searchParams.set("callbackUrl", pathname);

      const response = NextResponse.redirect(loginUrl);
      // Limpiamos la cookie por si acaso estaba corrupta
      if (token) response.cookies.delete("token");

      return response;
    }

    // 2.2 Si intenta entrar a Login/Register o Landing -> Pase usted
    // (NextResponse.next() al final)
  }

  // D. FINAL: Permitir la solicitud si no cayó en ninguna redirección
  // Esto cubre: Landing Page ('/'), Login/Register (si no estás logueado), y rutas permitidas del Dashboard.
  return NextResponse.next();
}

// Configuración: Ejecutar en todo excepto archivos estáticos de Next.js
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
