'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type AvaliacaoTipo = 'PROVA' | 'TRABALHO' | 'SEMINARIO' | 'EXAME_FINAL' | 'OUTRO';
type SituacaoResultado = 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'REPROVADO_NOTA_E_FALTA';

interface Avaliacao {
  id: string;
  tipo: AvaliacaoTipo;
  nota: number;
  peso: number;
  criadoEm: string;
}

interface ResultadoDisciplina {
  mediaFinal: number;
  faltas: number;
  frequenciaPercentual: number;
  situacao: SituacaoResultado;
}

interface Matricula {
  id: string;
  status: string;
  isDependencia: boolean;
  dataMatricula: string;
  aluno: { ra: string; nome: string };
  oferta: {
    vagas: number;
    turno: string;
    horario?: string;
    disciplina: { codigo: string; nome: string; cargaHoraria: number };
    periodoLetivo: { ano: number; semestre: string };
    professor: { nome: string };
  };
  avaliacoes: Avaliacao[];
  resultado: ResultadoDisciplina | null;
}

const TIPO_LABEL: Record<AvaliacaoTipo, string> = {
  PROVA: 'Prova', TRABALHO: 'Trabalho', SEMINARIO: 'Seminário',
  EXAME_FINAL: 'Exame Final', OUTRO: 'Outro',
};
const TIPO_COLOR: Record<AvaliacaoTipo, { bg: string; color: string }> = {
  PROVA:       { bg: '#dbeafe', color: '#1e40af' },
  TRABALHO:    { bg: '#d1fae5', color: '#065f46' },
  SEMINARIO:   { bg: '#ede9fe', color: '#5b21b6' },
  EXAME_FINAL: { bg: '#fee2e2', color: '#991b1b' },
  OUTRO:       { bg: '#f3f4f6', color: '#374151' },
};
const SITUACAO_STYLE: Record<SituacaoResultado, { bg: string; color: string; label: string }> = {
  APROVADO:              { bg: '#d1fae5', color: '#065f46', label: 'Aprovado' },
  REPROVADO_NOTA:        { bg: '#fee2e2', color: '#991b1b', label: 'Reprovado (nota)' },
  REPROVADO_FALTA:       { bg: '#fef3c7', color: '#92400e', label: 'Reprovado (falta)' },
  REPROVADO_NOTA_E_FALTA:{ bg: '#fee2e2', color: '#991b1b', label: 'Reprovado (nota e falta)' },
};

const BTN = (v: 'primary' | 'danger' | 'ghost' | 'warning') => ({
  padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : v === 'warning' ? '#d97706' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const CARD = { background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 };

export default function MatriculaNotasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [matricula, setMatricula] = useState<Matricula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // form nova avaliação
  const [novaAvTipo, setNovaAvTipo] = useState<AvaliacaoTipo>('PROVA');
  const [novaAvNota, setNovaAvNota] = useState('');
  const [novaAvPeso, setNovaAvPeso] = useState('1');
  const [salvandoAv, setSalvandoAv] = useState(false);
  const [erroAv, setErroAv] = useState('');

  // form consolidar
  const [faltas, setFaltas] = useState('');
  const [totalAulas, setTotalAulas] = useState('');
  const [consolidando, setConsolidando] = useState(false);
  const [erroConsol, setErroConsol] = useState('');
  const [resultadoConsolidado, setResultadoConsolidado] = useState<{ mediaSemestre?: number; elegibleParaExame?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Matricula>(`/matriculas/${id}`);
      setMatricula(data);
      if (data.oferta?.disciplina?.cargaHoraria) {
        setTotalAulas(String(data.oferta.disciplina.cargaHoraria));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function adicionarAvaliacao(e: React.FormEvent) {
    e.preventDefault();
    setErroAv('');
    setSalvandoAv(true);
    try {
      await apiFetch('/avaliacoes', {
        method: 'POST',
        body: JSON.stringify({
          matriculaDisciplinaId: id,
          tipo: novaAvTipo,
          nota: Number(novaAvNota),
          peso: Number(novaAvPeso),
        }),
      });
      setNovaAvNota('');
      setNovaAvPeso('1');
      await load();
    } catch (err: unknown) {
      setErroAv(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvandoAv(false);
    }
  }

  async function removerAvaliacao(avId: string) {
    if (!confirm('Remover esta avaliação?')) return;
    try {
      await apiFetch(`/avaliacoes/${avId}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao remover');
    }
  }

  async function consolidar(e: React.FormEvent) {
    e.preventDefault();
    setErroConsol('');
    setConsolidando(true);
    setResultadoConsolidado(null);
    try {
      const res = await apiFetch<{ mediaSemestre?: number; elegibleParaExame?: boolean }>(
        `/matriculas/${id}/consolidar`,
        { method: 'POST', body: JSON.stringify({ faltas: Number(faltas), totalAulas: Number(totalAulas) }) },
      );
      setResultadoConsolidado(res);
      await load();
    } catch (err: unknown) {
      setErroConsol(err instanceof Error ? err.message : 'Erro ao consolidar');
    } finally {
      setConsolidando(false);
    }
  }

  if (loading) return <p style={{ padding: 24, color: '#6b7280' }}>Carregando...</p>;
  if (error) return <p style={{ padding: 24, color: '#e02424' }}>{error}</p>;
  if (!matricula) return null;

  const { aluno, oferta, avaliacoes, resultado } = matricula;
  const regulares = avaliacoes.filter(a => a.tipo !== 'EXAME_FINAL');
  const exame = avaliacoes.find(a => a.tipo === 'EXAME_FINAL');
  const isPendExame = matricula.status === 'PENDENTE_EXAME';

  // Média semestral das regulares (preview)
  const prevMediaSemestre = (() => {
    let sp = 0, sw = 0;
    for (const a of regulares) { sp += Number(a.nota) * Number(a.peso); sw += Number(a.peso); }
    return sw > 0 ? sp / sw : null;
  })();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Voltar */}
      <button style={{ ...BTN('ghost'), marginBottom: 16, fontSize: 12 }}
        onClick={() => router.push('/dashboard/academico/matriculas')}>
        ← Voltar para Matrículas
      </button>

      {/* Cabeçalho */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
              {oferta.disciplina.codigo} — {oferta.disciplina.nome}
            </h1>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6b7280' }}>
              {aluno.ra} · {aluno.nome}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
              {oferta.periodoLetivo.ano}/{oferta.periodoLetivo.semestre === 'S1' ? '1' : '2'} · {oferta.professor.nome} · {oferta.disciplina.cargaHoraria}h
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: matricula.status === 'APROVADO' ? '#d1fae5' :
                          matricula.status === 'REPROVADO' ? '#fee2e2' :
                          matricula.status === 'PENDENTE_EXAME' ? '#fef3c7' : '#dbeafe',
              color: matricula.status === 'APROVADO' ? '#065f46' :
                     matricula.status === 'REPROVADO' ? '#991b1b' :
                     matricula.status === 'PENDENTE_EXAME' ? '#92400e' : '#1e40af',
            }}>{matricula.status.replace('_', ' ')}</span>
            {matricula.isDependencia && (
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>DP</span>
            )}
          </div>
        </div>
      </div>

      {/* Aviso exame final pendente */}
      {isPendExame && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
          ⚠️ <strong>Elegível para exame final.</strong> Lance a nota do EXAME_FINAL e consolide novamente para finalizar o resultado.
        </div>
      )}

      {/* Avaliações regulares */}
      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Avaliações</h2>
        {avaliacoes.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Nenhuma avaliação lançada.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Tipo', 'Nota', 'Peso', 'Contribuição', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {avaliacoes.map((a, i) => {
                const tc = TIPO_COLOR[a.tipo];
                const contribuicao = Number(a.nota) * Number(a.peso);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color }}>
                        {TIPO_LABEL[a.tipo]}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 15 }}>{Number(a.nota).toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{Number(a.peso).toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 12 }}>{contribuicao.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <button style={{ ...BTN('danger'), padding: '3px 8px', fontSize: 11 }}
                        onClick={() => removerAvaliacao(a.id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Preview média */}
        {prevMediaSemestre !== null && (
          <div style={{ fontSize: 13, color: '#374151', padding: '8px 0 0', borderTop: '1px solid #f3f4f6' }}>
            Média do semestre (avaliações regulares):{' '}
            <strong style={{ fontSize: 15, color: prevMediaSemestre >= 6 ? '#065f46' : '#e02424' }}>
              {prevMediaSemestre.toFixed(2)}
            </strong>
            {exame && (
              <span style={{ marginLeft: 12, color: '#6b7280' }}>
                · Após exame: <strong>{((prevMediaSemestre + Number(exame.nota)) / 2).toFixed(2)}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Form nova avaliação */}
      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Lançar avaliação</h2>
        <form onSubmit={adicionarAvaliacao}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <label style={LABEL}>Tipo *</label>
              <select style={INPUT} value={novaAvTipo} onChange={e => setNovaAvTipo(e.target.value as AvaliacaoTipo)}>
                {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Nota (0–10) *</label>
              <input style={INPUT} type="number" step="0.1" min="0" max="10"
                value={novaAvNota} required onChange={e => setNovaAvNota(e.target.value)} placeholder="Ex: 8.5" />
            </div>
            <div>
              <label style={LABEL}>Peso *</label>
              <input style={INPUT} type="number" step="0.1" min="0.1"
                value={novaAvPeso} required onChange={e => setNovaAvPeso(e.target.value)} placeholder="Ex: 1" />
            </div>
            <button type="submit" style={{ ...BTN('primary'), height: 36, whiteSpace: 'nowrap' }} disabled={salvandoAv}>
              {salvandoAv ? 'Salvando...' : '+ Adicionar'}
            </button>
          </div>
          {erroAv && <p style={{ color: '#e02424', fontSize: 13, margin: '8px 0 0' }}>{erroAv}</p>}
        </form>
      </div>

      {/* Consolidar resultado */}
      <div style={CARD}>
        <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Consolidar resultado</h2>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
          Calcula média, frequência e situação final. Pode ser executado mais de uma vez (ex: após lançar exame final).
        </p>
        <form onSubmit={consolidar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <label style={LABEL}>Total de aulas (horas-aula) *</label>
              <input style={INPUT} type="number" min="1"
                value={totalAulas} required onChange={e => setTotalAulas(e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Faltas do aluno (horas-aula) *</label>
              <input style={INPUT} type="number" min="0"
                value={faltas} required onChange={e => setFaltas(e.target.value)} />
            </div>
            <button type="submit" style={{ ...BTN('warning'), height: 36 }} disabled={consolidando || avaliacoes.length === 0}>
              {consolidando ? 'Calculando...' : 'Consolidar'}
            </button>
          </div>
          {erroConsol && <p style={{ color: '#e02424', fontSize: 13, margin: '8px 0 0' }}>{erroConsol}</p>}
        </form>

        {/* Feedback após consolidar */}
        {resultadoConsolidado?.elegibleParaExame && (
          <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
            ⚠️ Média do semestre: <strong>{resultadoConsolidado.mediaSemestre?.toFixed(2)}</strong> — aluno elegível para exame final. Lance o EXAME_FINAL e consolide novamente.
          </div>
        )}
      </div>

      {/* Resultado atual */}
      {resultado && (
        <div style={CARD}>
          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Resultado consolidado</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Média final', value: Number(resultado.mediaFinal).toFixed(2), highlight: true, ok: Number(resultado.mediaFinal) >= 6 },
              { label: 'Frequência', value: `${Number(resultado.frequenciaPercentual).toFixed(1)}%`, highlight: false, ok: Number(resultado.frequenciaPercentual) >= 75 },
              { label: 'Faltas (h/a)', value: String(resultado.faltas), highlight: false, ok: true },
              { label: 'Situação', value: SITUACAO_STYLE[resultado.situacao]?.label ?? resultado.situacao, highlight: true, ok: resultado.situacao === 'APROVADO' },
            ].map(({ label, value, ok, highlight }) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: highlight ? 20 : 16, fontWeight: 700, color: ok ? '#065f46' : '#e02424' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
