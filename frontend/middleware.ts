/**
 * middleware.ts — Proteção de rotas (Next.js Edge Middleware)
 *
 * Regras:
 *  • /dashboard/* sem cookie fiurj_token  → redireciona para /login
 *  • /login com cookie fiurj_token válido → redireciona para /dashboard
 *  • /dashboard/admin/permissoes com e-mail != admin@fiurj.edu.br → /dashboard
 *    (tela de matriz de permissões — restrita a UMA conta específica, não ao
 *    perfil ADMIN em geral; mesma regra replicada no backend via
 *    AdminMasterGuard, que é a checagem que realmente vale)
 *  • Todas as outras rotas passam livre
 *
 * ⚠️  O middleware NÃO verifica a assinatura do JWT (Edge não tem
 *     acesso ao segredo de forma segura). A verificação real acontece
 *     no backend a cada chamada de API protegida. Aqui apenas checamos
 *     a presença e expiração básica do cookie (e, pra rota de permissões,
 *     o e-mail decodificado do payload — sujeito a um usuário malicioso
 *     forjar um cookie com esse e-mail, mas nesse caso o backend barra a
 *     chamada de API de qualquer forma; isto aqui é só UX, não é o guard
 *     de segurança real).
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

const EMAIL_ADMIN_MASTER = 'admin@fiurj.edu.br';

function getTokenEmail(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
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

  // Matriz de permissões de tela — só a conta master, mesmo estando logado
  // e com perfil ADMIN. (Checagem de UX; o guard real é o backend.)
  if (pathname.startsWith('/dashboard/admin/permissoes') && getTokenEmail(token) !== EMAIL_ADMIN_MASTER) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
