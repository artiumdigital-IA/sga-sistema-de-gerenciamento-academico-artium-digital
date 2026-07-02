'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Registro {
  id: string;
  usuarioId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  criadoEm: string;
  usuario: { email: string; perfil: string } | null;
}
interface Resposta {
  total: number; page: number; limit: number; totalPaginas: number; registros: Registro[];
}

const ACAO_COLOR: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: '#d1fae5', color: '#065f46' },
  UPDATE: { bg: '#dbeafe', color: '#1e40af' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
};

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, background: '#fff', color: '#374151' };

export default function LogPage() {
  const [entidade, setEntidade] = useState('');
  const [acao, setAcao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Resposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const params = new URLSearchParams();
      if (entidade) params.set('entidade', entidade);
      if (acao) params.set('acao', acao);
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);
      params.set('page', String(page));
      setData(await apiFetch<Resposta>(`/auditoria?${params.toString()}`));
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar log'); }
    finally { setLoading(false); }
  }, [entidade, acao, dataInicio, dataFim, page]);

  useEffect(() => { carregar(); }, [carregar]);

  function filtrar() { setPage(1); carregar(); }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Consultar Arquivo de Log</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Trilha de auditoria (LGPD) — quem alterou o quê, e quando. Acesso restrito a Admin.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 16, background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', alignItems: 'end' }}>
        <div>
          <label style={LABEL}>Entidade</label>
          <input style={INPUT} value={entidade} placeholder="Ex: aluno, Oferta..." onChange={e => setEntidade(e.target.value)} />
        </div>
        <div>
          <label style={LABEL}>Ação</label>
          <select style={INPUT} value={acao} onChange={e => setAcao(e.target.value)}>
            <option value="">Todas</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label style={LABEL}>De</label>
          <input style={INPUT} type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label style={LABEL}>Até</label>
          <input style={INPUT} type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <button style={{ ...BTN_G, height: 34 }} onClick={filtrar}>Filtrar</button>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}

      {!loading && data && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'ID do Registro'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.registros.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum registro encontrado.</td></tr>
                )}
                {data.registros.map(r => {
                  const cor = ACAO_COLOR[r.acao] ?? { bg: '#f3f4f6', color: '#374151' };
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{new Date(r.criadoEm).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 14px' }}>{r.usuario?.email ?? '— (sistema)'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cor.bg, color: cor.color }}>{r.acao}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{r.entidade}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{r.entidadeId ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{data.total} registro{data.total !== 1 ? 's' : ''} — página {data.page} de {Math.max(data.totalPaginas, 1)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={BTN_G} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <button style={BTN_G} disabled={page >= data.totalPaginas} onClick={() => setPage(p => p + 1)}>Próxima →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
