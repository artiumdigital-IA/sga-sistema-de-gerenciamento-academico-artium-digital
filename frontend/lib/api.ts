/**
 * lib/api.ts — Utilitário de fetch autenticado
 * Usa NEXT_PUBLIC_API_URL + token JWT do cookie automaticamente.
 */
import { getToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// Origem da API sem o prefixo /api/v1 — usado para montar URLs de arquivos
// estáticos servidos pelo backend (ex: /uploads/avatars/xxx.png).
export const API_ORIGIN = BASE.replace(/\/api\/v1\/?$/, '');

/** Monta a URL absoluta de um arquivo servido pelo backend (ex: fotoUrl do usuário). */
export function apiFileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join('; ') : (msg ?? `Erro ${res.status}`));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Upload multipart autenticado (ex: foto de perfil). Não define Content-Type
 * manualmente — o browser define o boundary correto automaticamente. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join('; ') : (msg ?? `Erro ${res.status}`));
  }

  return res.json() as Promise<T>;
}
