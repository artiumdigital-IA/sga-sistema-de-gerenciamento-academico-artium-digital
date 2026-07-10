/**
 * components/dashboard/EmConstrucao.tsx — placeholder pros sub-itens do Menu
 * Discente que ainda não têm um módulo de dados por trás (Minha Renovação,
 * Conquistas, Provas no Polo, Horas AAC, Certificações, Conteúdos Extras,
 * Carreiras, Suporte). A rota já existe e já pode ser ativada/desativada na
 * matriz de Permissões de Tela — só o conteúdo entra depois, item por item.
 */
export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{titulo}</h1>
      <div style={{
        marginTop: 16, padding: '32px 24px', textAlign: 'center',
        background: 'var(--gray-50)', border: '1px dashed var(--gray-300)', borderRadius: 8,
        maxWidth: 520,
      }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🚧</div>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--gray-600)' }}>Em construção</p>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--gray-400)', lineHeight: 1.6 }}>
          {descricao ?? 'Este item do Menu Discente ainda não tem conteúdo — entra em uma próxima etapa.'}
        </p>
      </div>
    </div>
  );
}
