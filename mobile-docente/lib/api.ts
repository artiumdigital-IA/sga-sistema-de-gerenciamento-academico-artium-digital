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
 * Converte um uri local (ex.: retorno de expo-image-picker/expo-document-picker)
 * num Blob de verdade. Necessário porque anexar o objeto clássico
 * `{ uri, name, type }` direto no FormData.append() dá
 * "Unsupported FormDataPart implementation" em versões mais novas do React
 * Native (New Architecture) -- um Blob real funciona em qualquer versão.
 * XHR (não fetch) é de propósito: é o jeito documentado pela Expo há anos
 * pra ler um uri local como Blob no React Native.
 */
export function uriParaBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
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
