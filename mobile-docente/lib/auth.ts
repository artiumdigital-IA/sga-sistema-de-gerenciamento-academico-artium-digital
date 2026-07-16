/**
 * lib/auth.ts — sessão do usuário (token JWT + dados de /usuarios/me).
 *
 * Mesmo padrão do mobile/lib/auth.ts (app do aluno): token no SecureStore
 * (Keychain/Keystore, não AsyncStorage puro — é um JWT). Chave de storage
 * própria (fiurj_docente_token) só por clareza — cada app já é sandboxado
 * pelo próprio SO (bundleIdentifier diferente), não tem colisão possível
 * com o app do aluno mesmo se usassem a mesma chave.
 */
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'fiurj_docente_token';

export type Usuario = {
  id: string;
  email: string;
  nome?: string | null;
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
