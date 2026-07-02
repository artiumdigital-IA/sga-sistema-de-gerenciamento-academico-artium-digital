'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Curso { id: string; nome: string; }
interface LinhaRanking {
  posicao: number;
  id: string;
  ra: string;
  nome: string;
  curso: string;
  situacaoVinculo: string;
  cr: number;
  aprovadas: number;
  totalDisciplinas: number;
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };

const SITUACAO_LABEL: Record<string, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado',
  EVADIDO: 'Evadido', TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
};

const MEDALHA = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState('');
  const [linhas, setLinhas] = useState<LinhaRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { apiFetch<Curso[]>('/cursos').then(setCursos).catch(() => {}); }, []);

  const carregar = useCallback(async (c: string) => {
    setLoading(true); setErro('');
    try {
      const qs = c ? `?cursoId=${c}` : '';
      setLinhas(await apiFetch<LinhaRanking[]>(`/alunos/ranking${qs}`));
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar ranking'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(cursoId); }, [cursoId, carregar]);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Ranking de Alunos</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
          Ordenado por coeficiente de rendimento (CR). Só entram alunos com pelo menos uma disciplina cursada.
        </p>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <select style={INPUT} value={cursoId} onChange={e => setCursoId(e.target.value)}>
          <option value="">Todos os cursos</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}

      {!loading && !erro && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'RA', 'Nome', 'Curso', 'Situação', 'CR', 'Aprovadas'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  Nenhum aluno com disciplinas cursadas ainda.
                </td></tr>
              )}
              {linhas.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{MEDALHA[i] ?? l.posicao}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{l.ra}</td>
                  <td style={{ padding: '10px 14px' }}>{l.nome}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{l.curso}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{SITUACAO_LABEL[l.situacaoVinculo] ?? l.situacaoVinculo}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{l.cr.toFixed(2)}</td>
                  <td style={{ padding: '10px 14px' }}>{l.aprovadas} / {l.totalDisciplinas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
