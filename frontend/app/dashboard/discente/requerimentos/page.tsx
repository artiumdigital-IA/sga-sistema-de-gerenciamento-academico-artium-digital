'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface TipoRequerimento {
  id: string;
  nome: string;
  prazoDias: number | null;
  local: string | null;
  taxa: number | string;
  observacaoTaxa: string | null;
}
interface Requerimento {
  id: string;
  descricao?: string | null;
  status: string;
  criadoEm: string;
  tipo: string;
  tipoCatalogo: TipoRequerimento | null;
}

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ANALISE: 'Em Análise', DEFERIDO: 'Deferido', INDEFERIDO: 'Indeferido', CANCELADO: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  ABERTO: '#3b82f6', EM_ANALISE: '#f59e0b', DEFERIDO: '#10b981', INDEFERIDO: '#ef4444', CANCELADO: 'var(--gray-500)',
};

function formatarTaxa(t: TipoRequerimento): string {
  const valor = Number(t.taxa).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return t.observacaoTaxa ? `${valor} (${t.observacaoTaxa})` : valor;
}

function ModalTabelaPrecos({ tipos, onClose }: { tipos: TipoRequerimento[]; onClose: () => void }) {
  const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid var(--gray-100)' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--white)', borderRadius: 8, padding: 20, width: '100%', maxWidth: 800, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Tabela de Requerimentos</h3>
          <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)' }}>Fechar</button>
        </div>
        <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Requerimento', 'Prazo (dias)', 'Local', 'Taxa (R$)'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tipos.map(t => (
                <tr key={t.id}>
                  <td style={td}>{t.nome}</td>
                  <td style={td}>{t.prazoDias ?? '—'}</td>
                  <td style={td}>{t.local ?? '—'}</td>
                  <td style={td}>{formatarTaxa(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RequerimentosDiscentePage() {
  const [requerimentos, setRequerimentos] = useState<Requerimento[] | null>(null);
  const [tipos, setTipos] = useState<TipoRequerimento[]>([]);
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const [tipoCatalogoId, setTipoCatalogoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(() => {
    apiFetch<Requerimento[]>('/discente/requerimentos').then(setRequerimentos).catch(e => setErro(e.message ?? 'Erro ao carregar requerimentos.'));
  }, []);

  useEffect(() => {
    carregar();
    apiFetch<TipoRequerimento[]>('/discente/requerimentos/tipos').then(setTipos).catch(() => setTipos([]));
  }, [carregar]);

  async function abrirRequerimento() {
    if (!tipoCatalogoId) return;
    setEnviando(true);
    try {
      await apiFetch('/discente/requerimentos', { method: 'POST', body: JSON.stringify({ tipoCatalogoId, descricao: descricao.trim() || undefined }) });
      setTipoCatalogoId(''); setDescricao(''); setMostrarForm(false);
      carregar();
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao abrir requerimento.');
    } finally {
      setEnviando(false);
    }
  }

  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' };
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)' };
  const input: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' };

  const tipoSelecionado = tipos.find(t => t.id === tipoCatalogoId);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Requerimentos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMostrarTabela(true)} style={{
            padding: '7px 14px', background: 'var(--white)', color: 'var(--blue-dark)', border: '1px solid var(--blue-dark)', borderRadius: 4, cursor: 'pointer', fontSize: 13,
          }}>
            Tabela de Requerimentos
          </button>
          <button onClick={() => setMostrarForm(v => !v)} style={{
            padding: '7px 14px', background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Requerimento'}
          </button>
        </div>
      </div>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Solicite documentos e serviços da secretaria e acompanhe o andamento dos que você já pediu.
      </p>

      {mostrarForm && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginBottom: 20, maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Requerimento
              <select value={tipoCatalogoId} onChange={e => setTipoCatalogoId(e.target.value)} style={{ ...input, marginTop: 4 }}>
                <option value="">-- Selecione --</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </label>
            {tipoSelecionado && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-50)', padding: '8px 12px', borderRadius: 4 }}>
                Taxa: R$ {formatarTaxa(tipoSelecionado)}{tipoSelecionado.prazoDias ? ` · Prazo: ${tipoSelecionado.prazoDias} dia(s)` : ''}
              </p>
            )}
            <label style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Observações (opcional)
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} style={{ ...input, marginTop: 4, resize: 'vertical' }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={abrirRequerimento} disabled={!tipoCatalogoId || enviando} style={{
                padding: '7px 16px', background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 4,
                cursor: !tipoCatalogoId ? 'not-allowed' : 'pointer', fontSize: 13, opacity: enviando ? 0.7 : 1,
              }}>
                {enviando ? 'Enviando...' : 'Solicitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !requerimentos && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}
      {requerimentos && requerimentos.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Você ainda não abriu nenhum requerimento.</p>}

      {requerimentos && requerimentos.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Requerimento', 'Taxa', 'Status', 'Aberto em'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {requerimentos.map(r => (
                <tr key={r.id}>
                  <td style={td}>{r.tipoCatalogo?.nome ?? r.tipo}</td>
                  <td style={td}>{r.tipoCatalogo ? `R$ ${formatarTaxa(r.tipoCatalogo)}` : '—'}</td>
                  <td style={td}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: (STATUS_COLORS[r.status] ?? '#999') + '22', color: STATUS_COLORS[r.status] ?? '#999' }}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td style={td}>{new Date(r.criadoEm).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrarTabela && <ModalTabelaPrecos tipos={tipos} onClose={() => setMostrarTabela(false)} />}
    </div>
  );
}
