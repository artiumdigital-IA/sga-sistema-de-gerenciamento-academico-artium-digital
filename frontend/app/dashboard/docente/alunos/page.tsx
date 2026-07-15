'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Oferta {
  id: string;
  disciplina: { nome: string; codigo: string };
  periodoLetivo: { ano: number; semestre: string; status: string };
  turno: string;
  _count: { matriculas: number };
}
interface AlunoTurma {
  aluno: { id: string; ra: string; nome: string; email: string; situacaoVinculo: string };
  turmas: string[];
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };

export default function DocenteAlunosPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState('');
  const [alunos, setAlunos] = useState<AlunoTurma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<Oferta[]>('/docente/ofertas')
      .then(setOfertas)
      .catch((e: any) => setErro(e.message ?? 'Erro ao carregar minhas turmas'))
      .finally(() => setLoading(false));
  }, []);

  const carregarAlunos = useCallback(async (filtroOfertaId: string) => {
    setErro('');
    try {
      const qs = filtroOfertaId ? `?ofertaId=${filtroOfertaId}` : '';
      const data = await apiFetch<AlunoTurma[]>(`/docente/alunos${qs}`);
      setAlunos(data);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar alunos'); }
  }, []);

  useEffect(() => { carregarAlunos(ofertaId); }, [ofertaId, carregarAlunos]);

  if (loading) return <div style={{ padding: 24, color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Alunos das Minhas Turmas</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Só alunos matriculados nas turmas em que você é o professor.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Filtrar por turma</label>
        <select style={{ ...INPUT, minWidth: 320 }} value={ofertaId} onChange={e => setOfertaId(e.target.value)}>
          <option value="">Todas as minhas turmas</option>
          {ofertas.map(o => (
            <option key={o.id} value={o.id}>
              {o.disciplina.codigo} - {o.disciplina.nome} ({o.periodoLetivo.ano}/{o.periodoLetivo.semestre}, {o.turno})
            </option>
          ))}
        </select>
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{erro}</p>}

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['RA', 'Nome', 'E-mail', 'Situação', 'Turmas'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum aluno encontrado.</td></tr>
            )}
            {alunos.map(a => (
              <tr key={a.aluno.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '10px 14px' }}>{a.aluno.ra}</td>
                <td style={{ padding: '10px 14px' }}>{a.aluno.nome}</td>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{a.aluno.email}</td>
                <td style={{ padding: '10px 14px', fontSize: 12 }}>{a.aluno.situacaoVinculo}</td>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{a.turmas.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
