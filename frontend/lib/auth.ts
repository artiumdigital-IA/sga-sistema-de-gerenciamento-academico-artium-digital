/**
 * lib/auth.ts — Utilitários de autenticação (client-side)
 *
 * Token armazenado em cookie acessível ao middleware Next.js.
 * Nunca expõe o segredo — o JWT é assinado pelo backend.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const TOKEN_COOKIE = 'fiurj_token';
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 horas (deve bater com JWT_EXPIRES_IN)

/* ── Tipos ──────────────────────────────────────────────── */

export interface LoginPayload {
  email: string;
  senha: string;
  totpToken?: string;
}

export interface JwtUser {
  sub: string;
  email: string;
  perfil: 'ADMIN' | 'SECRETARIA' | 'FINANCEIRO' | 'PROFESSOR' | 'ALUNO' | 'SUPORTE' | 'MASTER';
  iat: number;
  exp: number;
}

/* ── API ────────────────────────────────────────────────── */

/**
 * Chama POST /auth/login e retorna o accessToken.
 * Lança Error com mensagem legível em caso de falha.
 */
export async function apiLogin(payload: LoginPayload): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg[0] : (msg ?? 'Credenciais inválidas.'),
    );
  }

  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

/**
 * Chama GET /auth/me para validar token e obter dados do usuário.
 * Útil para hidratar o contexto após reload.
 */
export async function apiMe(token: string): Promise<JwtUser | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ── Cookie ─────────────────────────────────────────────── */

// Achado de segurança: o cookie de sessão não levava o atributo `Secure`, então
// o navegador o envia igual em HTTP ou HTTPS. Hoje a plataforma roda em produção
// só em HTTP puro (http://<IP-da-VPS>, sem domínio/TLS — ver CLAUDE.md, seção
// "Arquitetura de produção") — então marcar `Secure` incondicionalmente
// quebraria o login em produção agora (navegador descarta cookie `Secure`
// recebido fora de HTTPS). Em vez disso, adiciona `Secure` automaticamente
// quando a própria página já estiver servida em HTTPS — não muda nada no
// ambiente atual, e passa a proteger o cookie sozinho assim que um domínio +
// certificado TLS forem configurados no Coolify (isso sim precisa ser feito
// na infra, não dá pra resolver só no código — ver observação no chat).
function cookieSecureFlag(): string {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
}

export function saveToken(token: string): void {
  document.cookie = [
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    `path=/`,
    `max-age=${TOKEN_MAX_AGE}`,
    `SameSite=Strict`,
  ].join('; ') + cookieSecureFlag();
}

export function clearToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Strict${cookieSecureFlag()}`;
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/* ── JWT decode (sem verificação — apenas para leitura do payload) ── */

export function parseJwt(token: string): JwtUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtUser;
  } catch {
    return null;
  }
}

/** Retorna true se o token ainda não expirou (verificação local, sem crypto). */
export function isTokenValid(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

/* ── Logout ─────────────────────────────────────────────── */

export function logout(): void {
  clearToken();
  window.location.href = '/login';
}
