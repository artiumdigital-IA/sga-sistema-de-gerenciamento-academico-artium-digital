'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

interface TipoChamado { id: string; nome: string; ativo: boolean; }
interface Chamado {
  id: string; numero: string; local: string; prioridade: Prioridade; titulo: string; descricao: string | null;
  status: Status; dataAbertura: string; dataConclusao: string | null;
  tipo: TipoChamado; responsavel: { id: string; nome: string | null; email: string } | null;
}

const STATUS_LABEL: Record<Status, string> = { ABERTO: 'Aberto', EM_ANDAMENTO: 'Em Andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
const STATUS_COLOR: Record<Status, { bg: string; color: string }> = {
  ABERTO: { bg: '#dbeafe', color: '#1e40af' }, EM_ANDAMENTO: { bg: '#fef3c7', color: '#92400e' },
  CONCLUIDO: { bg: '#d1fae5', color: '#065f46' }, CANCELADO: { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
};
const PRIORIDADE_LABEL: Record<Prioridade, string> = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', URGENTE: 'Urgente' };
const PRIORIDADE_COLOR: Record<Prioridade, string> = { BAIXA: 'var(--gray-500)', MEDIA: '#2563eb', ALTA: '#d97706', URGENTE: '#dc2626' };

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

export default function MeusChamadosPage() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [tipos, setTipos] = useState<TipoChamado[]>([]);
  const [loading, setLoading] = useState(true);

  const [tipoId, setTipoId] = useState('');
  const [local, setLocal] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [cs, ts] = await Promise.all([apiFetch<Chamado[]>('/chamados-manutencao/meus'), apiFetch<TipoChamado[]>('/tipos-chamado-manutencao')]);
      setChamados(cs); setTipos(ts);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function abrirChamado() {
    if (!tipoId || !local.trim() || !titulo.trim()) { setErro('Preencha tipo, local e título.'); return; }
    setErro(''); setSalvando(true);
    try {
      await apiFetch('/chamados-manutencao', {
        method: 'POST',
        body: JSON.stringify({ tipoId, local: local.trim(), prioridade, titulo: titulo.trim(), descricao: descricao.trim() || undefined }),
      });
      setTipoId(''); setLocal(''); setPrioridade('MEDIA'); setTitulo(''); setDescricao('');
      carregar();
    } catch (e: any) { setErro(e.message ?? 'Erro ao abrir chamado'); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Suporte — Abrir Chamado</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Reporte um problema de manutenção (ex.: elétrica, hidráulica, TI, mobiliário) e acompanhe o andamento aqui.</p>
      </div>

      <div style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={LABEL}>Tipo *</label>
            <select style={INPUT} value={tipoId} onChange={e => setTipoId(e.target.value)}>
              <option value="">Selecione...</option>
              {tipos.filter(t => t.ativo).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Local *</label>
            <input style={INPUT} placeholder="Ex: Sala 101" value={local} onChange={e => setLocal(e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Prioridade</label>
            <select style={INPUT} value={prioridade} onChange={e => setPrioridade(e.target.value as Prioridade)}>
              {(Object.entries(PRIORIDADE_LABEL) as [Prioridade, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Título *</label>
          <input style={INPUT} placeholder="Ex: Ar-condicionado não liga" value={titulo} onChange={e => setTitulo(e.target.value)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Descrição</label>
          <textarea style={{ ...INPUT, minHeight: 70, resize: 'vertical' }} value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
        {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 10px' }}>{erro}</p>}
        <button style={BTN_P} disabled={salvando} onClick={abrirChamado}>{salvando ? 'Enviando...' : 'Abrir Chamado'}</button>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Meus chamados</h2>
      {loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Número', 'Tipo', 'Local', 'Título', 'Prioridade', 'Aberto em', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chamados.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Você ainda não abriu nenhum chamado.</td></tr>}
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
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{new Date(c.dataAbertura).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cor.bg, color: cor.color }}>{STATUS_LABEL[c.status]}</span>
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
