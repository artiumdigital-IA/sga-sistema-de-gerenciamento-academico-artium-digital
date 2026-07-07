'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Aluno { id: string; nome: string; ra: string; }
interface Bolsa {
  id: string; tipoBolsa: string; percentual: number;
  dataInicio: string; dataFim: string | null; ativo: boolean; observacoes: string | null;
}

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

const EMPTY = { tipoBolsa: '', percentual: 50, dataInicio: '', dataFim: '', observacoes: '' };

export default function BolsistasPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params.id as string;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [bolsas, setBolsas] = useState<Bolsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const [a, b] = await Promise.all([
        apiFetch<Aluno>(`/alunos/${alunoId}`),
        apiFetch<Bolsa[]>(`/bolsistas/aluno/${alunoId}`),
      ]);
      setAluno(a); setBolsas(b);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { carregar(); }, [carregar]);

  const set = (k: keyof typeof EMPTY, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.tipoBolsa.trim() || !form.dataInicio) { alert('Informe o tipo de bolsa e a data de início.'); return; }
    setSalvando(true);
    try {
      await apiFetch('/bolsistas', {
        method: 'POST',
        body: JSON.stringify({
          alunoId, tipoBolsa: form.tipoBolsa, percentual: Number(form.percentual),
          dataInicio: form.dataInicio, dataFim: form.dataFim || undefined,
          observacoes: form.observacoes || undefined,
        }),
      });
      setForm(EMPTY); carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function alternarAtivo(b: Bolsa) {
    try { await apiFetch(`/bolsistas/${b.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !b.ativo }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao atualizar'); }
  }

  async function remover(id: string) {
    if (!confirm('Remover este registro de bolsa?')) return;
    try { await apiFetch(`/bolsistas/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  if (loading) return <div style={{ padding: 28 }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 28, color: '#dc2626' }}>{erro}</div>;
  if (!aluno) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN_G, marginBottom: 16 }} onClick={() => router.back()}>← Voltar</button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Cadastro de Bolsistas</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>{aluno.nome} — RA {aluno.ra}</p>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Nova bolsa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LABEL}>Tipo de bolsa</label>
            <input style={INPUT} value={form.tipoBolsa} placeholder="Ex: PROUNI, FIES, Bolsa Convênio..." onChange={e => set('tipoBolsa', e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Percentual (%)</label>
            <input style={INPUT} type="number" min={0} max={100} value={form.percentual} onChange={e => set('percentual', e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Início</label>
            <input style={INPUT} type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Fim (opcional)</label>
            <input style={INPUT} type="date" value={form.dataFim} onChange={e => set('dataFim', e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Observações</label>
          <textarea style={{ ...INPUT, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </div>
        <button style={BTN} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Registrar bolsa'}</button>
      </div>

      <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Bolsas registradas</h3>
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Tipo', '%', 'Início', 'Fim', 'Status', 'Observações', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bolsas.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma bolsa registrada.</td></tr>
            )}
            {bolsas.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{b.tipoBolsa}</td>
                <td style={{ padding: '10px 14px' }}>{Number(b.percentual)}%</td>
                <td style={{ padding: '10px 14px' }}>{new Date(b.dataInicio).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px' }}>{b.dataFim ? new Date(b.dataFim).toLocaleDateString('pt-BR') : '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => alternarAtivo(b)} style={{
                    padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: b.ativo ? '#d1fae5' : 'var(--gray-100)', color: b.ativo ? '#065f46' : 'var(--gray-500)',
                  }}>
                    {b.ativo ? 'Ativa' : 'Inativa'}
                  </button>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{b.observacoes ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => remover(b.id)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
