'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Motivo { id: string; nome: string; ativo: boolean; }
interface Aluno { id: string; nome: string; ra: string; }
interface Ocorrencia { id: string; descricao: string | null; data: string; motivo: Motivo; }

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, background: '#fff', color: '#374151' };

export default function OcorrenciasAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params.id as string;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivoId, setMotivoId] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [a, o, m] = await Promise.all([
        apiFetch<Aluno>(`/alunos/${alunoId}`),
        apiFetch<Ocorrencia[]>(`/ocorrencias?alunoId=${alunoId}`),
        apiFetch<Motivo[]>('/motivos-ocorrencia'),
      ]);
      setAluno(a); setOcorrencias(o); setMotivos(m);
    } finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!motivoId || !data) { alert('Selecione o motivo e a data.'); return; }
    setSalvando(true);
    try {
      await apiFetch('/ocorrencias', { method: 'POST', body: JSON.stringify({ alunoId, motivoId, data, descricao: descricao || undefined }) });
      setDescricao(''); setMotivoId('');
      carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function remover(id: string) {
    if (!confirm('Remover esta ocorrência?')) return;
    try { await apiFetch(`/ocorrencias/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  if (loading) return <div style={{ padding: 28 }}>Carregando...</div>;
  if (!aluno) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN_G, marginBottom: 16 }} onClick={() => router.back()}>← Voltar</button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Ocorrências</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{aluno.nome} — RA {aluno.ra}</p>
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Lançar ocorrência</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LABEL}>Motivo</label>
            <select style={INPUT} value={motivoId} onChange={e => setMotivoId(e.target.value)}>
              <option value="">Selecione...</option>
              {motivos.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Data</label>
            <input style={INPUT} type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Descrição (opcional)</label>
          <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical' }} value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
        <button style={BTN} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Registrar ocorrência'}</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Data', 'Motivo', 'Descrição', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {ocorrencias.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhuma ocorrência registrada.</td></tr>}
            {ocorrencias.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 14px' }}>{new Date(o.data).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px' }}>{o.motivo.nome}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{o.descricao ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => remover(o.id)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
