/**
 * lib/auth-context.tsx — Provider + hook `useAuth()`.
 *
 * Mesmo padrão do mobile/lib/auth-context.tsx (app do aluno), com uma
 * diferença: este app é SÓ pra professor. Depois do login, checamos
 * `usuarios.me().professorId` — se a conta não tiver professor vinculado
 * (ex.: um aluno ou admin tentando entrar aqui), rejeitamos com uma
 * mensagem clara em vez de deixar cair silenciosamente nas telas do Menu
 * Docente e tomar 403 do backend em cada request (mesma validação que o
 * DocenteService.meuProfessorId() já faz no backend, só que adiantada pro
 * momento do login, pra dar um erro melhor).
 *
 * IMPORTANTE: usa /usuarios/me, NAO /auth/me — mesmo motivo já documentado
 * no app do aluno (o JWT só carrega { sub, email, perfil }, sem
 * professorId; GET /usuarios/me é quem devolve o registro completo).
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

function ehProfessor(u: Usuario): boolean {
  return u.perfil === 'PROFESSOR' && !!u.professorId;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarUsuario = useCallback(async () => {
    try {
      const me = await apiFetch<Usuario>('/usuarios/me');
      if (!ehProfessor(me)) {
        setUsuario(null);
        await clearPersistedToken();
        return;
      }
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

        const me = await apiFetch<Usuario>('/usuarios/me');
        if (!ehProfessor(me)) {
          await clearPersistedToken();
          return { ok: false, error: 'Esta conta não está vinculada a um registro de professor.' };
        }
        setUsuario(me);
        return { ok: true };
      } catch (err) {
        await clearPersistedToken();
        const msg = err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.';
        return { ok: false, error: msg };
      }
    },
    [],
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
