'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

interface TipoProtocolo { id: string; nome: string; ativo: boolean; }
interface Aluno { id: string; ra: string; nome: string; }
interface Protocolo {
  id: string; numero: string; assunto: string; descricao: string | null; status: Status;
  dataAbertura: string; dataConclusao: string | null;
  tipo: TipoProtocolo; aluno: Aluno | null;
}

const STATUS_LABEL: Record<Status, string> = { ABERTO: 'Aberto', EM_ANDAMENTO: 'Em Andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
const STATUS_COLOR: Record<Status, { bg: string; color: string }> = {
  ABERTO: { bg: '#dbeafe', color: '#1e40af' }, EM_ANDAMENTO: { bg: '#fef3c7', color: '#92400e' },
  CONCLUIDO: { bg: '#d1fae5', color: '#065f46' }, CANCELADO: { bg: '#f3f4f6', color: '#374151' },
};

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, background: '#fff', color: '#374151' };

function ModalNovoProtocolo({ tipos, onClose, onCreated }: { tipos: TipoProtocolo[]; onClose: () => void; onCreated: () => void }) {
  const [tipoId, setTipoId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [raBusca, setRaBusca] = useState('');
  const [alunoEncontrado, setAlunoEncontrado] = useState<Aluno | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function buscarAluno() {
    if (!raBusca.trim()) { setAlunoEncontrado(null); return; }
    try {
      const alunos = await apiFetch<Aluno[]>(`/alunos`);
      setAlunoEncontrado(alunos.find(a => a.ra === raBusca.trim()) ?? null);
    } catch { setAlunoEncontrado(null); }
  }

  async function salvar() {
    if (!tipoId || !assunto.trim()) { alert('Preencha tipo e assunto.'); return; }
    setSalvando(true); setErro('');
    try {
      await apiFetch('/protocolos', {
        method: 'POST',
        body: JSON.stringify({ tipoId, assunto, descricao: descricao || undefined, alunoId: alunoEncontrado?.id }),
      });
      onCreated(); onClose();
    } catch (e: any) { setErro(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 480, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Lançar Protocolo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Tipo *</label>
            <select style={INPUT} value={tipoId} onChange={e => setTipoId(e.target.value)}>
              <option value="">Selecione...</option>
              {tipos.filter(t => t.ativo).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>RA do aluno (opcional)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={INPUT} value={raBusca} onChange={e => setRaBusca(e.target.value)} onBlur={buscarAluno} placeholder="Deixe em branco se não for ligado a um aluno" />
            </div>
            {raBusca && (alunoEncontrado ? <p style={{ fontSize: 12, color: '#16a34a', margin: '4px 0 0' }}>{alunoEncontrado.nome}</p> : <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>RA não encontrado</p>)}
          </div>
          <div>
            <label style={LABEL}>Assunto *</label>
            <input style={INPUT} value={assunto} onChange={e => setAssunto(e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Descrição</label>
            <textarea style={{ ...INPUT, minHeight: 70, resize: 'vertical' }} value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
          {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={BTN_G} onClick={onClose}>Cancelar</button>
            <button style={BTN_P} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Lançar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtocolosPage() {
  const router = useRouter();
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [tipos, setTipos] = useState<TipoProtocolo[]>([]);
  const [filtroStatus, setFiltroStatus] = useState(() => {
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search).get('status') ?? '';
    return '';
  });
  const [loading, setLoading] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filtroStatus ? `?status=${filtroStatus}` : '';
      const [ps, ts] = await Promise.all([apiFetch<Protocolo[]>(`/protocolos${qs}`), apiFetch<TipoProtocolo[]>('/tipos-protocolo')]);
      setProtocolos(ps); setTipos(ts);
    } finally { setLoading(false); }
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  async function mudarStatus(p: Protocolo, status: Status) {
    try { await apiFetch(`/protocolos/${p.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao atualizar status'); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Protocolos</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Lançamento e consulta de protocolos administrativos.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={BTN_G} onClick={() => router.push('/dashboard/secretaria/tipos-protocolo')}>Gerenciar Tipos</button>
          <button style={BTN_P} onClick={() => setModalNovo(true)}>+ Novo Protocolo</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select style={{ ...INPUT, width: 200 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p> : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Número', 'Tipo', 'Assunto', 'Aluno', 'Abertura', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {protocolos.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum protocolo encontrado.</td></tr>}
              {protocolos.map(p => {
                const cor = STATUS_COLOR[p.status];
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{p.numero}</td>
                    <td style={{ padding: '10px 14px' }}>{p.tipo.nome}</td>
                    <td style={{ padding: '10px 14px' }}>{p.assunto}</td>
                    <td style={{ padding: '10px 14px' }}>{p.aluno ? `${p.aluno.ra} — ${p.aluno.nome}` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cor.bg, color: cor.color }}>{STATUS_LABEL[p.status]}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {(p.status === 'ABERTO' || p.status === 'EM_ANDAMENTO') && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {p.status === 'ABERTO' && <button style={BTN_G} onClick={() => mudarStatus(p, 'EM_ANDAMENTO')}>Andamento</button>}
                          <button style={{ ...BTN_G, color: '#16a34a' }} onClick={() => mudarStatus(p, 'CONCLUIDO')}>Concluir</button>
                          <button style={{ ...BTN_G, color: '#dc2626' }} onClick={() => mudarStatus(p, 'CANCELADO')}>Cancelar</button>
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

      {modalNovo && <ModalNovoProtocolo tipos={tipos} onClose={() => setModalNovo(false)} onCreated={carregar} />}
    </div>
  );
}
