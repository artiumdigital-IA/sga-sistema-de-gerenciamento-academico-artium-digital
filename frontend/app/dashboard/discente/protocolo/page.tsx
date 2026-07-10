'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface TipoProtocolo { id: string; nome: string; ativo: boolean }
interface Protocolo {
  id: string;
  numero: string;
  assunto: string;
  descricao?: string | null;
  status: string;
  dataAbertura: string;
  dataConclusao?: string | null;
  tipo: TipoProtocolo;
}

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ANDAMENTO: 'Em Andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  ABERTO: '#3b82f6', EM_ANDAMENTO: '#f59e0b', CONCLUIDO: '#10b981', CANCELADO: 'var(--gray-500)',
};

export default function ProtocoloDiscentePage() {
  const [protocolos, setProtocolos] = useState<Protocolo[] | null>(null);
  const [tipos, setTipos] = useState<TipoProtocolo[]>([]);
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoId, setTipoId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(() => {
    apiFetch<Protocolo[]>('/discente/protocolo').then(setProtocolos).catch(e => setErro(e.message ?? 'Erro ao carregar protocolos.'));
  }, []);

  useEffect(() => {
    carregar();
    apiFetch<TipoProtocolo[]>('/discente/protocolo/tipos').then(setTipos).catch(() => setTipos([]));
  }, [carregar]);

  async function abrirProtocolo() {
    if (!tipoId || !assunto.trim()) return;
    setEnviando(true);
    try {
      await apiFetch('/discente/protocolo', { method: 'POST', body: JSON.stringify({ tipoId, assunto: assunto.trim(), descricao: descricao.trim() || undefined }) });
      setTipoId(''); setAssunto(''); setDescricao(''); setMostrarForm(false);
      carregar();
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao abrir protocolo.');
    } finally {
      setEnviando(false);
    }
  }

  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' };
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)' };
  const input: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Protocolo — Abertura/Consulta</h1>
        <button onClick={() => setMostrarForm(v => !v)} style={{
          padding: '7px 14px', background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
        }}>
          {mostrarForm ? 'Cancelar' : '+ Novo Protocolo'}
        </button>
      </div>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Abra um protocolo pra solicitar algo à secretaria e acompanhe o andamento dos que você já abriu.
      </p>

      {mostrarForm && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginBottom: 20, maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Tipo
              <select value={tipoId} onChange={e => setTipoId(e.target.value)} style={{ ...input, marginTop: 4 }}>
                <option value="">-- Selecione --</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Assunto
              <input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Ex: Revisão de nota — Direito Civil I" style={{ ...input, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Descrição (opcional)
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} style={{ ...input, marginTop: 4, resize: 'vertical' }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={abrirProtocolo} disabled={!tipoId || !assunto.trim() || enviando} style={{
                padding: '7px 16px', background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 4,
                cursor: (!tipoId || !assunto.trim()) ? 'not-allowed' : 'pointer', fontSize: 13, opacity: enviando ? 0.7 : 1,
              }}>
                {enviando ? 'Enviando...' : 'Abrir Protocolo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !protocolos && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}
      {protocolos && protocolos.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Você ainda não abriu nenhum protocolo.</p>}

      {protocolos && protocolos.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Número', 'Tipo', 'Assunto', 'Status', 'Aberto em'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {protocolos.map(p => (
                <tr key={p.id}>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{p.numero}</td>
                  <td style={td}>{p.tipo?.nome}</td>
                  <td style={td}>{p.assunto}</td>
                  <td style={td}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: (STATUS_COLORS[p.status] ?? '#999') + '22', color: STATUS_COLORS[p.status] ?? '#999' }}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td style={td}>{new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
