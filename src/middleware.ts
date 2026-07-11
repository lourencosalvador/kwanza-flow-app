import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isDemoMode } from "@/lib/env";

const PUBLIC_PREFIXES = ["/login", "/auth", "/api", "/link"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Em modo demonstração não há autenticação obrigatória.
  if (isDemoMode) return response;

  // NUNCA redirecionar pedidos de prefetch do Next.js. Caso contrário, o
  // router pode cachear um redirecionamento e, ao clicar num link (ex.:
  // Dívidas/Analytics), seguir esse redirecionamento cacheado até ao Painel.
  // A decisão de auth fica para a navegação real.
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1" ||
    (request.headers.get("sec-purpose") ?? "").includes("prefetch");
  if (isPrefetch) return response;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
