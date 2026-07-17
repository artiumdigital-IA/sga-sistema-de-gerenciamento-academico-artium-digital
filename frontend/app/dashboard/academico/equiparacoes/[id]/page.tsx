'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatarData } from '@/lib/format';

interface Disciplina { id: string; nome: string; codigo: string; }
interface Equiparacao {
  id: string;
  instituicaoOrigem: string;
  disciplinaOrigem: string;
  cargaHorariaOrigem: number | null;
  dataAprovacao: string;
  observacoes: string | null;
  disciplina: { nome: string; codigo: string; cargaHoraria: number };
}
interface Resposta {
  aluno: { id: string; nome: string; ra: string };
  equiparacoes: Equiparacao[];
}

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function EquiparacoesPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params.id as string;

  const [data, setData] = useState<Resposta | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ disciplinaId: '', instituicaoOrigem: '', disciplinaOrigem: '', cargaHorariaOrigem: '', dataAprovacao: '', observacoes: '' });
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const [resp, discs] = await Promise.all([
        apiFetch<Resposta>(`/materias-equiparadas/${alunoId}`),
        apiFetch<Disciplina[]>(`/disciplinas`),
      ]);
      setData(resp);
      setDisciplinas(discs);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar equiparações'); }
    finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!form.disciplinaId || !form.instituicaoOrigem || !form.disciplinaOrigem || !form.dataAprovacao) {
      alert('Preencha disciplina FIURJ, instituição de origem, disciplina de origem e data de aprovação.');
      return;
    }
    setSalvando(true);
    try {
      await apiFetch('/materias-equiparadas', {
        method: 'POST',
        body: JSON.stringify({
          alunoId,
          disciplinaId: form.disciplinaId,
          instituicaoOrigem: form.instituicaoOrigem,
          disciplinaOrigem: form.disciplinaOrigem,
          cargaHorariaOrigem: form.cargaHorariaOrigem ? Number(form.cargaHorariaOrigem) : undefined,
          dataAprovacao: form.dataAprovacao,
          observacoes: form.observacoes || undefined,
        }),
      });
      setForm({ disciplinaId: '', instituicaoOrigem: '', disciplinaOrigem: '', cargaHorariaOrigem: '', dataAprovacao: '', observacoes: '' });
      carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao salvar equiparação'); }
    finally { setSalvando(false); }
  }

  async function remover(id: string) {
    if (!confirm('Remover esta equiparação?')) return;
    try {
      await apiFetch(`/materias-equiparadas/${id}`, { method: 'DELETE' });
      carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  if (loading) return <div style={{ padding: 28 }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 28, color: '#dc2626' }}>{erro}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN_G, marginBottom: 16 }} onClick={() => router.back()}>← Voltar</button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Matérias Equiparadas</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>{data.aluno.nome} — RA {data.aluno.ra}</p>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Nova equiparação</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LABEL}>Disciplina FIURJ (equivalente)</label>
            <select style={INPUT} value={form.disciplinaId} onChange={e => setForm(f => ({ ...f, disciplinaId: e.target.value }))}>
              <option value="">Selecione...</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.codigo} — {d.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Data de aprovação</label>
            <input style={INPUT} type="date" value={form.dataAprovacao} onChange={e => setForm(f => ({ ...f, dataAprovacao: e.target.value }))} />
          </div>
          <div>
            <label style={LABEL}>Instituição de origem</label>
            <input style={INPUT} value={form.instituicaoOrigem} placeholder="Ex: Universidade Autônoma de Lisboa" onChange={e => setForm(f => ({ ...f, instituicaoOrigem: e.target.value }))} />
          </div>
          <div>
            <label style={LABEL}>Disciplina de origem</label>
            <input style={INPUT} value={form.disciplinaOrigem} placeholder="Ex: Introdução ao Direito" onChange={e => setForm(f => ({ ...f, disciplinaOrigem: e.target.value }))} />
          </div>
          <div>
            <label style={LABEL}>Carga horária de origem (opcional)</label>
            <input style={INPUT} type="number" min={0} value={form.cargaHorariaOrigem} onChange={e => setForm(f => ({ ...f, cargaHorariaOrigem: e.target.value }))} />
          </div>
          <div>
            <label style={LABEL}>Observações (opcional)</label>
            <input style={INPUT} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>
        <button style={BTN} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Registrar equiparação'}</button>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Disciplina FIURJ', 'Instituição de Origem', 'Disciplina de Origem', 'CH Origem', 'Data Aprovação', 'Observações', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.equiparacoes.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma equiparação registrada.</td></tr>
            )}
            {data.equiparacoes.map(eq => (
              <tr key={eq.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '10px 14px' }}>{eq.disciplina.codigo} — {eq.disciplina.nome}</td>
                <td style={{ padding: '10px 14px' }}>{eq.instituicaoOrigem}</td>
                <td style={{ padding: '10px 14px' }}>{eq.disciplinaOrigem}</td>
                <td style={{ padding: '10px 14px' }}>{eq.cargaHorariaOrigem ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>{formatarData(eq.dataAprovacao)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{eq.observacoes ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => remover(eq.id)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
