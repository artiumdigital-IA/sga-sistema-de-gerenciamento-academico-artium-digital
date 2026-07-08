/**
 * lib/auth.ts — sessão do usuário (token JWT + dados de /auth/me).
 *
 * Guarda o token no SecureStore (Keychain no iOS, Keystore/EncryptedSharedPreferences
 * no Android) em vez de AsyncStorage puro, porque é um JWT — dado sensível.
 *
 * Padrão: um "singleton" simples com um Set de listeners, exposto via o hook
 * `useAuth()` (baseado em AuthProvider, ver app/_layout.tsx). Evita puxar uma lib
 * de state management só pra isso.
 */
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'fiurj_aluno_token';

export type Usuario = {
  id: string;
  email: string;
  perfil: 'ADMIN' | 'SECRETARIA' | 'FINANCEIRO' | 'PROFESSOR' | 'ALUNO';
  alunoId?: string | null;
  professorId?: string | null;
};

let currentToken: string | null = null;

/** Getter síncrono — usado pelo lib/api.ts em toda request. */
export function getCurrentToken(): string | null {
  return currentToken;
}

export async function loadPersistedToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  currentToken = token;
  return token;
}

export async function persistToken(token: string): Promise<void> {
  currentToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearPersistedToken(): Promise<void> {
  currentToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
