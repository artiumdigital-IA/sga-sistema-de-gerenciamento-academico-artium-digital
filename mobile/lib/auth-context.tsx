/**
 * lib/auth-context.tsx — Provider + hook `useAuth()`.
 *
 * Guarda o usuário logado (retorno de GET /auth/me) e expõe login()/logout().
 * O guard de rotas (redirecionar pra /login ou pras tabs) fica no
 * app/_layout.tsx, que é quem tem acesso ao router do expo-router.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, ApiError } from './api';
import { clearPersistedToken, loadPersistedToken, persistToken, Usuario } from './auth';

type LoginResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string, totpToken?: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarUsuario = useCallback(async () => {
    try {
      const me = await apiFetch<Usuario>('/auth/me');
      setUsuario(me);
    } catch {
      // Token inválido/expirado — trata como deslogado.
      setUsuario(null);
      await clearPersistedToken();
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await loadPersistedToken();
      if (token) {
        await carregarUsuario();
      }
      setCarregando(false);
    })();
  }, [carregarUsuario]);

  const login = useCallback(
    async (email: string, senha: string, totpToken?: string): Promise<LoginResult> => {
      try {
        const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha, totpToken }),
        });
        await persistToken(accessToken);
        await carregarUsuario();
        return { ok: true };
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.';
        return { ok: false, error: msg };
      }
    },
    [carregarUsuario],
  );

  const logout = useCallback(async () => {
    await clearPersistedToken();
    setUsuario(null);
  }, []);

  return <AuthContext.Provider value={{ usuario, carregando, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() precisa ser chamado dentro de <AuthProvider>.');
  return ctx;
}
