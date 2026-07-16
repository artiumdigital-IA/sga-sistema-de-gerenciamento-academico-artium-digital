'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

interface TipoChamado { id: string; nome: string; ativo: boolean; }
interface Usuario { id: string; nome: string | null; email: string; }
interface Chamado {
  id: string; numero: string; local: string; prioridade: Prioridade; titulo: string; descricao: string | null;
  status: Status; dataAbertura: string; dataConclusao: string | null;
  tipo: TipoChamado; solicitante: Usuario; responsavel: Usuario | null;
}

const STATUS_LABEL: Record<Status, string> = { ABERTO: 'Aberto', EM_ANDAMENTO: 'Em Andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
const STATUS_COLOR: Record<Status, { bg: string; color: string }> = {
  ABERTO: { bg: '#dbeafe', color: '#1e40af' }, EM_ANDAMENTO: { bg: '#fef3c7', color: '#92400e' },
  CONCLUIDO: { bg: '#d1fae5', color: '#065f46' }, CANCELADO: { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
};
const PRIORIDADE_LABEL: Record<Prioridade, string> = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', URGENTE: 'Urgente' };
const PRIORIDADE_COLOR: Record<Prioridade, string> = { BAIXA: 'var(--gray-500)', MEDIA: '#2563eb', ALTA: '#d97706', URGENTE: '#dc2626' };

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function ChamadosManutencaoPage() {
  const router = useRouter();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [filtroStatus, setFiltroStatus] = useState(() => {
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search).get('status') ?? '';
    return '';
  });
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filtroStatus ? `?status=${filtroStatus}` : '';
      setChamados(await apiFetch<Chamado[]>(`/chamados-manutencao${qs}`));
    } finally { setLoading(false); }
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  async function mudarStatus(c: Chamado, status: Status) {
    try { await apiFetch(`/chamados-manutencao/${c.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao atualizar status'); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Chamados de Manutenção</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Gerenciar chamados abertos por qualquer usuário — assumir, concluir ou cancelar.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={BTN_G} onClick={() => router.push('/dashboard/suporte/tipos-chamado')}>Gerenciar Tipos</button>
          <button style={BTN_P} onClick={() => router.push('/dashboard/suporte/meus-chamados')}>+ Abrir Chamado</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select style={{ ...INPUT, width: 200 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Número', 'Tipo', 'Local', 'Título', 'Prioridade', 'Solicitante', 'Responsável', 'Status', 'Aberto em', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chamados.length === 0 && <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum chamado encontrado.</td></tr>}
              {chamados.map(c => {
                const cor = STATUS_COLOR[c.status];
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{c.numero}</td>
                    <td style={{ padding: '10px 14px' }}>{c.tipo.nome}</td>
                    <td style={{ padding: '10px 14px' }}>{c.local}</td>
                    <td style={{ padding: '10px 14px' }}>{c.titulo}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: PRIORIDADE_COLOR[c.prioridade] }}>{PRIORIDADE_LABEL[c.prioridade]}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{c.solicitante.nome ?? c.solicitante.email}</td>
                    <td style={{ padding: '10px 14px' }}>{c.responsavel ? (c.responsavel.nome ?? c.responsavel.email) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cor.bg, color: cor.color }}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{new Date(c.dataAbertura).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {(c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO') && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {c.status === 'ABERTO' && <button style={BTN_G} onClick={() => mudarStatus(c, 'EM_ANDAMENTO')}>Assumir</button>}
                          <button style={{ ...BTN_G, color: '#16a34a' }} onClick={() => mudarStatus(c, 'CONCLUIDO')}>Concluir</button>
                          <button style={{ ...BTN_G, color: '#dc2626' }} onClick={() => mudarStatus(c, 'CANCELADO')}>Cancelar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
