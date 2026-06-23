/**
 * middleware.ts — Proteção de rotas (Next.js Edge Middleware)
 *
 * Regras:
 *  • /dashboard/* sem cookie fiurj_token  → redireciona para /login
 *  • /login com cookie fiurj_token válido → redireciona para /dashboard
 *  • Todas as outras rotas passam livre
 *
 * ⚠️  O middleware NÃO verifica a assinatura do JWT (Edge não tem
 *     acesso ao segredo de forma segura). A verificação real acontece
 *     no backend a cada chamada de API protegida. Aqui apenas checamos
 *     a presença e expiração básica do cookie.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE = 'fiurj_token';

function getTokenExpiry(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  return exp * 1000 > Date.now();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const loggedIn = isValidToken(token);

  // Rota protegida sem token válido → login
  if (pathname.startsWith('/dashboard') && !loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Já logado tentando acessar login → dashboard
  if (pathname === '/login' && loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
