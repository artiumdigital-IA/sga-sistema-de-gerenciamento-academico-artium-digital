/**
 * lib/api.ts — cliente HTTP autenticado.
 *
 * Mesma ideia do frontend/lib/api.ts (Next.js): injeta o Bearer token e
 * normaliza erro. Só troca a fonte do token (SecureStore em vez de cookie).
 */
import { getCurrentToken } from './auth';

// Ver .env.example — em dispositivo físico com Expo Go, "localhost" é o
// próprio celular, não o seu PC. Use o IP da máquina na rede local.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const API_ORIGIN = BASE.replace(/\/api\/v1\/?$/, '');

/** Monta a URL absoluta de um arquivo servido pelo backend (ex: fotoUrl do aluno). */
export function apiFileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getCurrentToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string | string[] });
    const msg = (body as { message?: string | string[] }).message;
    throw new ApiError(Array.isArray(msg) ? msg.join('; ') : (msg ?? `Erro ${res.status}`), res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Monta a URL absoluta de uma tela do frontend web (usado pela WebView de
 * documentos — ver ADR no README sobre impressão/PDF no V1). */
export function webUrl(path: string): string {
  const webBase = process.env.EXPO_PUBLIC_WEB_URL ?? API_ORIGIN;
  return `${webBase}${path}`;
}
