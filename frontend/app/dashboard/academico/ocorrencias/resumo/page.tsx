'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Resumo {
  totalGeral: number;
  porCurso: { curso: string; total: number }[];
  porMotivo: { motivo: string; total: number }[];
  alunosComMaisOcorrencias: { alunoId: string; ra: string; nome: string; curso: string; total: number }[];
}

const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' };
const TH: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 };
const TD: React.CSSProperties = { padding: '9px 14px', fontSize: 13 };

export default function ResumoOcorrenciasPage() {
  const router = useRouter();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<Resumo>('/ocorrencias/resumo-turmas')
      .then(setResumo)
      .catch(e => setErro(e.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 28, color: 'var(--gray-500)' }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 28, color: '#dc2626' }}>{erro}</div>;
  if (!resumo) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Resumo de Ocorrências por Turmas</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>
          Ocorrência não é lançada por turma/disciplina específica no nosso modelo — o agrupamento abaixo é
          aproximado por curso do aluno. Total geral: <strong>{resumo.totalGeral}</strong> ocorrência{resumo.totalGeral !== 1 ? 's' : ''}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>Por curso</h3>
          <div style={CARD}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={TH}>Curso</th><th style={TH}>Total</th>
              </tr></thead>
              <tbody>
                {resumo.porCurso.length === 0 && <tr><td colSpan={2} style={{ ...TD, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma ocorrência.</td></tr>}
                {resumo.porCurso.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={TD}>{c.curso}</td>
                    <td style={{ ...TD, fontWeight: 600 }}>{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>Por motivo</h3>
          <div style={CARD}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={TH}>Motivo</th><th style={TH}>Total</th>
              </tr></thead>
              <tbody>
                {resumo.porMotivo.length === 0 && <tr><td colSpan={2} style={{ ...TD, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma ocorrência.</td></tr>}
                {resumo.porMotivo.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={TD}>{m.motivo}</td>
                    <td style={{ ...TD, fontWeight: 600 }}>{m.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>Alunos com mais ocorrências</h3>
      <div style={CARD}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
            {['RA', 'Nome', 'Curso', 'Total', ''].map(h => <th key={h} style={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {resumo.alunosComMaisOcorrencias.length === 0 && <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma ocorrência.</td></tr>}
            {resumo.alunosComMaisOcorrencias.map(a => (
              <tr key={a.alunoId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ ...TD, fontWeight: 600 }}>{a.ra}</td>
                <td style={TD}>{a.nome}</td>
                <td style={{ ...TD, color: 'var(--gray-500)' }}>{a.curso}</td>
                <td style={{ ...TD, fontWeight: 700, color: '#be123c' }}>{a.total}</td>
                <td style={TD}>
                  <button onClick={() => router.push(`/dashboard/academico/ocorrencias/${a.alunoId}`)}
                    style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #be123c', background: '#fff1f2', color: '#be123c', cursor: 'pointer', fontWeight: 500 }}>
                    Ver ocorrências
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
