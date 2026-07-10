'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ItemHorario {
  matriculaId: string;
  disciplina: string;
  codigo: string;
  professor: string;
  turno: string;
  horario: string | null;
  sala: string | null;
  periodo: { ano: number; semestre: number; status: string };
  status: string;
}

const TURNO_LABEL: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral' };

const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)' };

export default function QuadroHorariosPage() {
  const [itens, setItens] = useState<ItemHorario[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<ItemHorario[]>('/discente/horarios')
      .then(setItens)
      .catch(e => setErro(e.message ?? 'Erro ao carregar quadro de horários.'));
  }, []);

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quadro de Horários</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Suas disciplinas e horários no período letivo em andamento.
      </p>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !itens && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}
      {itens && itens.length === 0 && (
        <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhuma disciplina matriculada no momento.</p>
      )}

      {itens && itens.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Disciplina', 'Professor', 'Turno', 'Horário', 'Sala', 'Período'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {itens.map(i => (
                <tr key={i.matriculaId}>
                  <td style={{ ...td, fontWeight: 500 }}>{i.disciplina} <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>({i.codigo})</span></td>
                  <td style={td}>{i.professor}</td>
                  <td style={td}>{TURNO_LABEL[i.turno] ?? i.turno}</td>
                  <td style={{ ...td, color: 'var(--accent-blue-text)' }}>{i.horario ?? '—'}</td>
                  <td style={td}>{i.sala ?? '—'}</td>
                  <td style={td}>{i.periodo.ano}/{i.periodo.semestre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
