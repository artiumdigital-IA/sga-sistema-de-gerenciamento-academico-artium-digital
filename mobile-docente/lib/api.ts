/**
 * lib/api.ts — cliente HTTP autenticado.
 *
 * Mesma ideia do mobile/lib/api.ts (app do aluno): injeta o Bearer token e
 * normaliza erro. `apiUpload` é novo aqui — o app do aluno não tem upload
 * multipart, e a Captura de Prova precisa (foto/PDF da prova corrigida).
 */
import { getCurrentToken } from './auth';

// Ver .env.example — em dispositivo físico com Expo Go, "localhost" é o
// próprio celular, não o seu PC. Use o IP da máquina na rede local.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const API_ORIGIN = BASE.replace(/\/api\/v1\/?$/, '');

/** Monta a URL absoluta de um arquivo servido pelo backend (ex: fotoUrl do aluno/professor). */
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

async function lerErro(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}) as { message?: string | string[] });
  const msg = (body as { message?: string | string[] }).message;
  throw new ApiError(Array.isArray(msg) ? msg.join('; ') : (msg ?? `Erro ${res.status}`), res.status);
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

  if (!res.ok) return lerErro(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Upload multipart (ex.: Captura de Prova). NÃO define Content-Type na mão —
 * o fetch precisa gerar o boundary sozinho a partir do FormData; um
 * Content-Type fixo aqui quebra o parse do multer no backend.
 */
export async function apiUpload<T>(path: string, formData: FormData, method: 'POST' | 'PATCH' = 'POST'): Promise<T> {
  const token = getCurrentToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) return lerErro(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
