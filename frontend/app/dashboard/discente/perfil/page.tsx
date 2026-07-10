'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * "Perfil" do Menu Discente aponta pra cá só pra ter uma rota própria (com
 * sua própria tela em telas-sistema.ts, ativável/desativável na matriz de
 * Permissões) — o conteúdo em si é o mesmo "Minha Conta" que todo perfil já
 * usa (nome, foto, senha), em app/dashboard/page.tsx?view=conta. Em vez de
 * duplicar aquele componente, só redireciona pra lá.
 */
export default function PerfilDiscentePage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard?view=conta'); }, [router]);
  return <div style={{ padding: 24, fontSize: 12.5, color: 'var(--gray-400)' }}>Redirecionando…</div>;
}
