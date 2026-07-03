'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type SituacaoResult = 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'PENDENTE_EXAME';

interface Avaliacao { tipo: string; nota: number; peso: number; }
interface Resultado { mediaFinal: number; faltas: number; frequenciaPercentual: number; situacao: SituacaoResult; }
interface Matricula {
  id: string; status: string; isDependencia: boolean; dataMatricula: string;
  oferta: {
    disciplina: { nome: string; codigo: string; creditos: number; cargaHoraria: number; };
    periodoLetivo: { ano: number; semestre: number; };
    professor: { nome: string; titulacao: string; } | null;
  };
  avaliacoes: Avaliacao[];
  resultado: Resultado | null;
}
interface Integralizacao {
  chIntegralizada: number;
  chTotalCurso: number;
  percentual: number;
  disciplinasIntegralizadas: number;
}
interface Historico {
  aluno: { id: string; ra: string; nome: string; situacaoVinculo: string; };
  cr: number;
  integralizacao: Integralizacao;
  totalDisciplinas: number;
  aprovadas: number;
  matriculas: Matricula[];
}

const SIT_COLOR: Record<SituacaoResult, { bg: string; color: string }> = {
  APROVADO: { bg: '#d1fae5', color: '#065f46' },
  REPROVADO_NOTA: { bg: '#fee2e2', color: '#991b1b' },
  REPROVADO_FALTA: { bg: '#ffedd5', color: '#9a3412' },
  PENDENTE_EXAME: { bg: '#fef3c7', color: '#92400e' },
};
const SIT_LABEL: Record<SituacaoResult, string> = {
  APROVADO: 'Aprovado', REPROVADO_NOTA: 'Rep. Nota', REPROVADO_FALTA: 'Rep. Falta', PENDENTE_EXAME: 'Exame Final',
};
const VINCULO_LABEL: Record<string, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado',
  EVADIDO: 'Evadido', TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
};

function SituacaoBadge({ situacao }: { situacao: SituacaoResult }) {
  const s = SIT_COLOR[situacao];
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg }}>{SIT_LABEL[situacao]}</span>;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function HistoricoPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params?.id as string;
  const [historico, setHistorico] = useState<Historico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!alunoId) return;
    apiFetch<Historico>(`/alunos/${alunoId}/historico`)
      .then(setHistorico)
      .catch(e => setErro(e.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <div style={{ padding: 32, color: '#6b7280', fontSize: 14 }}>Carregando historico...</div>;
  if (erro) return <div style={{ padding: 32 }}><p style={{ color: '#dc2626', fontSize: 14 }}>{erro}</p><button onClick={() => router.back()} style={{ fontSize: 13, cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: 5, padding: '6px 12px', background: '#fff' }}>Voltar</button></div>;
  if (!historico) return null;

  const periodos = new Map<string, Matricula[]>();
  for (const m of historico.matriculas) {
    const key = `${m.oferta.periodoLetivo.ano}-${m.oferta.periodoLetivo.semestre}`;
    if (!periodos.has(key)) periodos.set(key, []);
    periodos.get(key)!.push(m);
  }
  const sortedPeriodos: [string, Matricula[]][] = Array.from(periodos.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const reprovadas = historico.matriculas.filter(m => m.resultado && ['REPROVADO_NOTA', 'REPROVADO_FALTA'].includes(m.resultado.situacao)).length;
  const pendentes = historico.matriculas.filter(m => !m.resultado || m.resultado.situacao === 'PENDENTE_EXAME').length;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/dashboard/academico/alunos')}
          style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
          ← Voltar
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Historico Academico</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{historico.aluno.nome} · RA {historico.aluno.ra} · {VINCULO_LABEL[historico.aluno.situacaoVinculo] ?? historico.aluno.situacaoVinculo}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label="CR" value={historico.cr > 0 ? historico.cr.toFixed(2) : '—'} color="#1a56db" />
        <StatCard label="Aprovadas" value={historico.aprovadas} color="#16a34a" />
        <StatCard label="Reprovadas" value={reprovadas} color="#dc2626" />
        <StatCard label="Em andamento" value={pendentes} color="#d97706" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Integralização do curso</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a56db' }}>
            {historico.integralizacao.percentual}%
            <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>
              ({historico.integralizacao.chIntegralizada}h / {historico.integralizacao.chTotalCurso}h — {historico.integralizacao.disciplinasIntegralizadas} disciplina{historico.integralizacao.disciplinasIntegralizadas !== 1 ? 's' : ''} aprovada{historico.integralizacao.disciplinasIntegralizadas !== 1 ? 's' : ''})
            </span>
          </span>
        </div>
        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(historico.integralizacao.percentual, 100)}%`, background: historico.integralizacao.percentual >= 100 ? '#16a34a' : '#1a56db', borderRadius: 4 }} />
        </div>
        <p style={{ fontSize: 10.5, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.4 }}>
          Soma a carga horária de cada disciplina distinta já aprovada (inclusive via DP, contada uma única vez)
          sobre a carga horária total exigida pelo curso. Dado calculado a cada acesso, não armazenado.
        </p>
      </div>

      {sortedPeriodos.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhuma matricula registrada.</p>
      )}

      {sortedPeriodos.map(([key, mats]) => {
        const [ano, sem] = key.split('-');
        return (
          <div key={key} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#1a56db', color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 12 }}>{ano}/{sem}</span>
              <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13 }}>{mats.length} disciplina{mats.length !== 1 ? 's' : ''}</span>
            </h2>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Disciplina', 'Professor', 'C.H.', 'Media', 'Freq%', 'Faltas', 'Situacao'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{mats.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.oferta.disciplina.nome}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {m.oferta.disciplina.codigo}
                        {m.isDependencia && <span style={{ marginLeft: 6, background: '#f3e8ff', color: '#6b21a8', padding: '1px 5px', borderRadius: 999, fontWeight: 600 }}>DP</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{m.oferta.professor?.nome ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{m.oferta.disciplina.cargaHoraria}h</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: m.resultado ? 600 : 400 }}>
                      {m.resultado ? Number(m.resultado.mediaFinal).toFixed(2) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>
                      {m.resultado ? `${Number(m.resultado.frequenciaPercentual).toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{m.resultado ? m.resultado.faltas : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {m.resultado
                        ? <SituacaoBadge situacao={m.resultado.situacao} />
                        : <span style={{ fontSize: 12, color: '#9ca3af' }}>Em andamento</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
