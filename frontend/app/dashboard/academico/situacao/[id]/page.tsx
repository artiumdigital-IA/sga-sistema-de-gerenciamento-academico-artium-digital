'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type SituacaoVinculo = 'CURSANDO' | 'TRANCADO' | 'FORMADO' | 'EVADIDO' | 'TRANSFERIDO_OUT' | 'FALECIDO';

interface Aluno { id: string; nome: string; ra: string; situacaoVinculo: SituacaoVinculo; }
interface HistoricoItem {
  id: string;
  situacaoAnterior: SituacaoVinculo;
  situacaoNova: SituacaoVinculo;
  motivo: string | null;
  data: string;
  criadoEm: string;
}

const VINCULO_LABEL: Record<SituacaoVinculo, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado',
  EVADIDO: 'Evadido', TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
};
const VINCULO_COLOR: Record<SituacaoVinculo, { bg: string; color: string }> = {
  CURSANDO: { bg: '#d1fae5', color: '#065f46' }, TRANCADO: { bg: '#fef3c7', color: '#92400e' },
  FORMADO: { bg: '#dbeafe', color: '#1e40af' }, EVADIDO: { bg: '#fee2e2', color: '#991b1b' },
  TRANSFERIDO_OUT: { bg: '#f3e8ff', color: '#6b21a8' }, FALECIDO: { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
};

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

function Badge({ s }: { s: SituacaoVinculo }) {
  const c = VINCULO_COLOR[s];
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{VINCULO_LABEL[s]}</span>;
}

export default function SituacaoPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params.id as string;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [situacaoNova, setSituacaoNova] = useState<SituacaoVinculo>('CURSANDO');
  const [data, setData] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivosSugeridos, setMotivosSugeridos] = useState<{ id: string; nome: string; ativo: boolean }[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const [a, h] = await Promise.all([
        apiFetch<Aluno>(`/alunos/${alunoId}`),
        apiFetch<HistoricoItem[]>(`/alunos/${alunoId}/historico-situacao`),
      ]);
      setAluno(a); setHistorico(h); setSituacaoNova(a.situacaoVinculo);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    apiFetch<{ id: string; nome: string; ativo: boolean }[]>('/motivos-transferencia').then(setMotivosSugeridos).catch(() => {});
  }, []);

  async function salvar() {
    if (!data) { alert('Informe a data da mudança.'); return; }
    if (aluno && situacaoNova === aluno.situacaoVinculo) { alert('Selecione uma situação diferente da atual.'); return; }
    setSalvando(true);
    try {
      await apiFetch(`/alunos/${alunoId}/mudar-situacao`, {
        method: 'POST',
        body: JSON.stringify({ situacaoNova, data, motivo: motivo || undefined }),
      });
      setMotivo(''); setData('');
      carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao registrar mudança'); }
    finally { setSalvando(false); }
  }

  if (loading) return <div style={{ padding: 28 }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 28, color: '#dc2626' }}>{erro}</div>;
  if (!aluno) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN_G, marginBottom: 16 }} onClick={() => router.back()}>← Voltar</button>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Mudança de Situação</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>{aluno.nome} — RA {aluno.ra}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--gray-500)', marginRight: 8 }}>Situação atual:</span>
          <Badge s={aluno.situacaoVinculo} />
        </div>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Registrar nova situação</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LABEL}>Nova situação</label>
            <select style={INPUT} value={situacaoNova} onChange={e => setSituacaoNova(e.target.value as SituacaoVinculo)}>
              {(Object.entries(VINCULO_LABEL) as [SituacaoVinculo, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Data</label>
            <input style={INPUT} type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Motivo (opcional)</label>
            <input style={INPUT} list="motivos-transferencia-list" value={motivo} placeholder="Ex: trancamento a pedido — requerimento nº..." onChange={e => setMotivo(e.target.value)} />
            <datalist id="motivos-transferencia-list">
              {motivosSugeridos.filter(m => m.ativo).map(m => <option key={m.id} value={m.nome} />)}
            </datalist>
          </div>
        </div>
        <button style={BTN} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Registrar mudança'}</button>
      </div>

      <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Histórico</h3>
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Data', 'De', 'Para', 'Motivo', 'Registrado em'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historico.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma mudança de situação registrada.</td></tr>
            )}
            {historico.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '10px 14px' }}>{new Date(h.data).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px' }}><Badge s={h.situacaoAnterior} /></td>
                <td style={{ padding: '10px 14px' }}><Badge s={h.situacaoNova} /></td>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{h.motivo ?? '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-400)' }}>{new Date(h.criadoEm).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
