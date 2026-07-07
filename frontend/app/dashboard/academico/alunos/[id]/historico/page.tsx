'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type SituacaoResultado = 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'REPROVADO_NOTA_E_FALTA';

interface ResultadoDisciplina {
  mediaFinal: number;
  faltas: number;
  frequenciaPercentual: number;
  situacao: SituacaoResultado;
}

interface MatriculaHistorico {
  id: string;
  status: string;
  isDependencia: boolean;
  dataMatricula: string;
  oferta: {
    turno: string;
    disciplina: { codigo: string; nome: string; cargaHoraria: number; creditos: number };
    periodoLetivo: { ano: number; semestre: string };
    professor: { nome: string };
  };
  resultado: ResultadoDisciplina | null;
}

interface HistoricoAluno {
  aluno: { id: string; ra: string; nome: string; situacaoVinculo: string };
  cr: number;
  totalDisciplinas: number;
  aprovadas: number;
  matriculas: MatriculaHistorico[];
}

const SIT_STYLE: Record<SituacaoResultado, { bg: string; color: string; label: string }> = {
  APROVADO:              { bg: '#d1fae5', color: '#065f46', label: 'Aprovado' },
  REPROVADO_NOTA:        { bg: '#fee2e2', color: '#991b1b', label: 'Rep. nota' },
  REPROVADO_FALTA:       { bg: '#fef3c7', color: '#92400e', label: 'Rep. falta' },
  REPROVADO_NOTA_E_FALTA:{ bg: '#fee2e2', color: '#991b1b', label: 'Rep. nota+falta' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  MATRICULADO:   { bg: '#dbeafe', color: '#1e40af' },
  PENDENTE_EXAME:{ bg: '#fef3c7', color: '#92400e' },
  APROVADO:      { bg: '#d1fae5', color: '#065f46' },
  REPROVADO:     { bg: '#fee2e2', color: '#991b1b' },
  DEPENDENCIA:   { bg: '#fef3c7', color: '#92400e' },
  TRANCADO:      { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
};

const BTN = (v: 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  background: 'transparent', color: 'var(--gray-700)', border: '1px solid var(--gray-300)',
});

export default function HistoricoAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [historico, setHistorico] = useState<HistoricoAluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<HistoricoAluno>(`/alunos/${id}/historico`);
      setHistorico(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p style={{ padding: 24, color: 'var(--gray-500)' }}>Carregando...</p>;
  if (error) return <p style={{ padding: 24, color: '#e02424' }}>{error}</p>;
  if (!historico) return null;

  const { aluno, cr, totalDisciplinas, aprovadas, matriculas } = historico;
  const reprovadas = matriculas.filter(m => m.resultado?.situacao !== 'APROVADO' && m.resultado !== null).length;
  const semResultado = matriculas.filter(m => m.resultado === null).length;

  // Períodos distintos para o filtro
  const periodos = Array.from(new Set(
    matriculas.map(m => `${m.oferta.periodoLetivo.ano}/${m.oferta.periodoLetivo.semestre === 'S1' ? '1' : '2'}`)
  )).sort();

  const filtered = matriculas.filter(m => {
    if (!filtroPeriodo) return true;
    const p = `${m.oferta.periodoLetivo.ano}/${m.oferta.periodoLetivo.semestre === 'S1' ? '1' : '2'}`;
    return p === filtroPeriodo;
  });

  // Agrupar por período
  const porPeriodo: Record<string, MatriculaHistorico[]> = {};
  for (const m of filtered) {
    const key = `${m.oferta.periodoLetivo.ano}/${m.oferta.periodoLetivo.semestre === 'S1' ? '1' : '2'}`;
    if (!porPeriodo[key]) porPeriodo[key] = [];
    porPeriodo[key].push(m);
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN('ghost'), marginBottom: 16, fontSize: 12 }}
        onClick={() => router.push('/dashboard/academico/alunos')}>
        ← Voltar para Alunos
      </button>

      {/* Cabeçalho do aluno */}
      <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>{aluno.nome}</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>RA: {aluno.ra} · {aluno.situacaoVinculo}</p>
          </div>
          {/* CR em destaque */}
          <div style={{ textAlign: 'center', background: '#f0f9ff', borderRadius: 8, padding: '12px 20px', border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, marginBottom: 2 }}>COEFICIENTE DE RENDIMENTO</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: cr >= 7 ? '#065f46' : cr >= 5 ? '#1e40af' : '#991b1b', lineHeight: 1 }}>
              {cr.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--gray-500)', marginTop: 2 }}>escala 0–10</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Total de disciplinas', value: totalDisciplinas, color: 'var(--gray-700)' },
            { label: 'Aprovadas', value: aprovadas, color: '#065f46' },
            { label: 'Reprovadas', value: reprovadas, color: '#991b1b' },
            { label: 'Em andamento', value: semResultado, color: '#1e40af' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--gray-50)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro por período */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Período:</span>
        <select style={{ padding: '6px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13 }}
          value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
          <option value="">Todos</option>
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {filtroPeriodo && (
          <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }}
            onClick={() => setFiltroPeriodo('')}>Limpar</button>
        )}
      </div>

      {/* Tabela por período */}
      {Object.keys(porPeriodo).sort().map(periodo => (
        <div key={periodo} style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {periodo}
          </h3>
          <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['Código', 'Disciplina', 'Prof.', 'Média', 'Freq.', 'Faltas', 'Situação', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porPeriodo[periodo].map((m, i) => {
                  const res = m.resultado;
                  const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.MATRICULADO;
                  const sitStyle = res ? (SIT_STYLE[res.situacao] ?? SIT_STYLE.REPROVADO_NOTA) : null;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>
                        {m.oferta.disciplina.codigo}
                      </td>
                      <td style={{ padding: '9px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.oferta.disciplina.nome}
                        {m.isDependencia && <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>DP</span>}
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--gray-500)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.oferta.professor.nome.split(' ')[0]}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: res ? (Number(res.mediaFinal) >= 6 ? '#065f46' : '#e02424') : 'var(--gray-400)' }}>
                        {res ? Number(res.mediaFinal).toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', color: res ? (Number(res.frequenciaPercentual) >= 75 ? '#065f46' : '#e02424') : 'var(--gray-400)' }}>
                        {res ? `${Number(res.frequenciaPercentual).toFixed(0)}%` : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--gray-500)' }}>
                        {res ? res.faltas : '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {sitStyle ? (
                          <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: sitStyle.bg, color: sitStyle.color }}>
                            {sitStyle.label}
                          </span>
                        ) : <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: ss.bg, color: ss.color }}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <button
                          style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--gray-700)' }}
                          onClick={() => router.push(`/dashboard/academico/matriculas/${m.id}`)}>
                          Notas
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: 24 }}>
          Nenhuma matrícula encontrada.
        </p>
      )}
    </div>
  );
}
