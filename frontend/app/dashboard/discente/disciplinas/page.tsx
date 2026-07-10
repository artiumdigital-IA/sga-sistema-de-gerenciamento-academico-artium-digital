'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Avaliacao { id: string; tipo: string; nota: number; peso: number }
interface Resultado { mediaFinal: number; faltas: number; frequenciaPercentual: number; situacao: string }
interface MatriculaComAvaliacoes {
  id: string;
  status: string;
  oferta: {
    disciplina: { nome: string; codigo: string; creditos: number };
    professor: { nome: string } | null;
    periodoLetivo: { ano: number; semestre: number; status: string };
  };
  avaliacoes: Avaliacao[];
  resultado: Resultado | null;
}

const SITUACAO_LABEL: Record<string, string> = {
  APROVADO: 'Aprovado', REPROVADO_NOTA: 'Reprovado (nota)', REPROVADO_FALTA: 'Reprovado (falta)',
};
const SITUACAO_COLOR: Record<string, string> = {
  APROVADO: '#16a34a', REPROVADO_NOTA: '#dc2626', REPROVADO_FALTA: '#dc2626',
};

export default function DisciplinasAvaliacoesPage() {
  const [matriculas, setMatriculas] = useState<MatriculaComAvaliacoes[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<MatriculaComAvaliacoes[]>('/discente/disciplinas')
      .then(setMatriculas)
      .catch(e => setErro(e.message ?? 'Erro ao carregar disciplinas.'));
  }, []);

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Disciplinas e Avaliações</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Suas disciplinas do período atual e as avaliações já lançadas.
      </p>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !matriculas && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}
      {matriculas && matriculas.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhuma disciplina matriculada.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>
        {matriculas?.map(m => (
          <div key={m.id} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.oferta.disciplina.nome}</div>
                <div style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>
                  {m.oferta.disciplina.codigo} · {m.oferta.professor?.nome ?? '—'} · {m.oferta.periodoLetivo.ano}/{m.oferta.periodoLetivo.semestre}
                </div>
              </div>
              {m.resultado && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                  background: (SITUACAO_COLOR[m.resultado.situacao] ?? '#6b7280') + '22',
                  color: SITUACAO_COLOR[m.resultado.situacao] ?? '#6b7280',
                }}>
                  {SITUACAO_LABEL[m.resultado.situacao] ?? m.resultado.situacao} · {Number(m.resultado.mediaFinal).toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ padding: '10px 16px' }}>
              {m.avaliacoes.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--gray-400)' }}>Nenhuma avaliação lançada ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {m.avaliacoes.map(a => (
                    <div key={a.id} style={{ padding: '5px 10px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 12 }}>
                      <strong>{a.tipo}</strong>: {Number(a.nota).toFixed(1)} <span style={{ color: 'var(--gray-400)' }}>(peso {a.peso})</span>
                    </div>
                  ))}
                </div>
              )}
              {m.resultado && (
                <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--gray-400)' }}>
                  Frequência: {Number(m.resultado.frequenciaPercentual).toFixed(1)}% · Faltas: {m.resultado.faltas}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
