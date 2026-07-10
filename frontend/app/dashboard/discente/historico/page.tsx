'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Integralizacao { chIntegralizada: number; chTotalCurso: number; percentual: number; disciplinasIntegralizadas: number }
interface MatriculaHistorico {
  id: string;
  isDependencia: boolean;
  status: string;
  oferta: {
    disciplina: { nome: string; codigo: string; creditos: number };
    periodoLetivo: { ano: number; semestre: number };
  };
  resultado: { mediaFinal: number; situacao: string } | null;
}
interface HistoricoResposta {
  aluno: { id: string; ra: string; nome: string; situacaoVinculo: string };
  cr: number;
  integralizacao: Integralizacao;
  totalDisciplinas: number;
  aprovadas: number;
  matriculas: MatriculaHistorico[];
}

const SITUACAO_COLOR: Record<string, string> = { APROVADO: '#16a34a', REPROVADO_NOTA: '#dc2626', REPROVADO_FALTA: '#dc2626' };

export default function NotasHistoricoPage() {
  const [dados, setDados] = useState<HistoricoResposta | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<HistoricoResposta>('/discente/historico')
      .then(setDados)
      .catch(e => setErro(e.message ?? 'Erro ao carregar histórico.'));
  }, []);

  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' };
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)' };

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Notas e Histórico</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>Seu histórico acadêmico completo, CR e integralização do curso.</p>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !dados && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}

      {dados && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, maxWidth: 700, marginBottom: 20 }}>
            {[
              { label: 'CR (coeficiente)', valor: dados.cr.toFixed(2) },
              { label: 'Integralização', valor: `${dados.integralizacao.percentual}%` },
              { label: 'Disciplinas aprovadas', valor: `${dados.aprovadas}/${dados.totalDisciplinas}` },
              { label: 'CH integralizada', valor: `${dados.integralizacao.chIntegralizada}/${dados.integralizacao.chTotalCurso}h` },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-blue-text)' }}>{c.valor}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Disciplina', 'Período', 'Créditos', 'Média', 'Situação'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {dados.matriculas.map(m => (
                  <tr key={m.id}>
                    <td style={{ ...td, fontWeight: 500 }}>{m.oferta.disciplina.nome} <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>({m.oferta.disciplina.codigo})</span></td>
                    <td style={td}>{m.oferta.periodoLetivo.ano}/{m.oferta.periodoLetivo.semestre}</td>
                    <td style={td}>{m.oferta.disciplina.creditos}</td>
                    <td style={td}>{m.resultado ? Number(m.resultado.mediaFinal).toFixed(1) : '—'}</td>
                    <td style={td}>
                      {m.resultado ? (
                        <span style={{ color: SITUACAO_COLOR[m.resultado.situacao] ?? 'var(--gray-500)', fontWeight: 600 }}>
                          {m.resultado.situacao.replace('_', ' ')}
                        </span>
                      ) : <span style={{ color: 'var(--gray-400)' }}>Em andamento</span>}
                      {m.isDependencia && <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--gray-400)' }}>(DP)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
