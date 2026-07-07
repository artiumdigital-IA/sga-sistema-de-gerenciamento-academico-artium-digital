'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Aluno { id: string; nome: string; ra: string; }
interface Observacao { id: string; observacao: string; data: string; }

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function ObservacoesFinanceirasPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params.id as string;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [a, o] = await Promise.all([
        apiFetch<Aluno>(`/alunos/${alunoId}`),
        apiFetch<Observacao[]>(`/observacoes-financeiras/${alunoId}`),
      ]);
      setAluno(a); setObservacoes(o);
    } finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!texto.trim()) return;
    setSalvando(true);
    try {
      await apiFetch(`/observacoes-financeiras/${alunoId}`, { method: 'POST', body: JSON.stringify({ observacao: texto }) });
      setTexto(''); carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function remover(id: string) {
    if (!confirm('Remover esta observação?')) return;
    try { await apiFetch(`/observacoes-financeiras/item/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  if (loading) return <div style={{ padding: 28 }}>Carregando...</div>;
  if (!aluno) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN_G, marginBottom: 16 }} onClick={() => router.back()}>← Voltar</button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Observações Financeiras</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>{aluno.nome} — RA {aluno.ra}</p>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <textarea style={{ ...INPUT, minHeight: 70, resize: 'vertical', marginBottom: 12 }} value={texto} placeholder="Ex: Aluno solicitou renegociação da 3ª parcela." onChange={e => setTexto(e.target.value)} />
        <button style={BTN} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Registrar observação'}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {observacoes.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhuma observação registrada.</p>}
        {observacoes.map(o => (
          <div key={o.id} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13 }}>{o.observacao}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--gray-400)' }}>{new Date(o.data).toLocaleString('pt-BR')}</p>
            </div>
            <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca', height: 'fit-content' }} onClick={() => remover(o.id)}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}
