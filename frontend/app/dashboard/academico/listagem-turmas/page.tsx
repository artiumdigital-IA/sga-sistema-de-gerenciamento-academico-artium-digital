'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiDownload } from '@/lib/api';

interface Periodo { id: string; ano: number; semestre: string; }
interface AlunoMatriculado { status: string; aluno: { id: string; ra: string; nome: string } }
interface OfertaComAlunos {
  id: string;
  turno: string;
  disciplina: { codigo: string; nome: string };
  periodoLetivo: { ano: number; semestre: string };
  professor: { nome: string };
  matriculas: AlunoMatriculado[];
}

const STATUS_LABEL: Record<string, string> = {
  MATRICULADO: 'Matriculado',
  PENDENTE_EXAME: 'Aguardando exame final',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  DEPENDENCIA: 'Dependência',
  TRANCADO: 'Trancado',
};

const TURNO_LABEL: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral' };

function nomeTurma(o: OfertaComAlunos): string {
  return `${o.disciplina.codigo} - ${o.disciplina.nome}`;
}

export default function ListagemAlunosTurmaPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState('');
  const [ofertas, setOfertas] = useState<OfertaComAlunos[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuExportar, setMenuExportar] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {}); }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const qs = periodoId ? `?periodoLetivoId=${periodoId}` : '';
      setOfertas(await apiFetch<OfertaComAlunos[]>(`/ofertas/com-alunos${qs}`));
    } finally {
      setLoading(false);
    }
  }, [periodoId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function exportarExcel() {
    setMenuExportar(false);
    setExportando(true);
    try {
      const qs = periodoId ? `?periodoLetivoId=${periodoId}` : '';
      await apiDownload(`/ofertas/com-alunos/xlsx${qs}`, 'listagem-alunos-por-turma.xlsx');
    } finally {
      setExportando(false);
    }
  }

  async function exportarPdf() {
    setMenuExportar(false);
    setExportando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const marginX = 14;
      const pageHeight = doc.internal.pageSize.getHeight();
      const lineHeight = 6;
      let y = 18;

      doc.setFontSize(14);
      doc.text('Listagem de Alunos por Turma', marginX, y);
      y += 9;

      for (const o of ofertas) {
        if (y + lineHeight * 2 > pageHeight - 14) { doc.addPage(); y = 18; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeTurma(o), marginX, y);
        y += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${TURNO_LABEL[o.turno] ?? o.turno} · ${o.periodoLetivo.ano}/${o.periodoLetivo.semestre} · Professor: ${o.professor.nome}`, marginX, y);
        y += lineHeight;

        if (o.matriculas.length === 0) {
          doc.text('(sem alunos matriculados)', marginX + 4, y);
          y += lineHeight;
        } else {
          for (const m of o.matriculas) {
            if (y + lineHeight > pageHeight - 14) { doc.addPage(); y = 18; }
            doc.text(`${m.aluno.ra}   ${m.aluno.nome}   —   ${STATUS_LABEL[m.status] ?? m.status}`, marginX + 4, y);
            y += lineHeight;
          }
        }
        y += 4;
      }

      doc.save('listagem-alunos-por-turma.pdf');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Listagem de Alunos por Turma</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Clique numa turma para ver os alunos matriculados</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuExportar(o => !o)}
            disabled={exportando || ofertas.length === 0}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: exportando || ofertas.length === 0 ? 0.6 : 1 }}
          >
            ⬇ Exportar
          </button>
          {menuExportar && (
            <>
              <div onClick={() => setMenuExportar(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,.15)', overflow: 'hidden', zIndex: 11, minWidth: 160 }}>
                <button onClick={exportarExcel} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
                  📊 Excel (.xlsx)
                </button>
                <button onClick={exportarPdf} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderTop: '1px solid var(--gray-100)' }}>
                  📄 PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 260 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>Período Letivo</label>
        <select
          value={periodoId}
          onChange={e => setPeriodoId(e.target.value)}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' }}
        >
          <option value="">Todos os períodos</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>Carregando...</div>
      ) : ofertas.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma turma encontrada.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ofertas.map(o => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: 12 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-blue-text)' }}>{nomeTurma(o)}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                      {TURNO_LABEL[o.turno] ?? o.turno} · {o.periodoLetivo.ano}/{o.periodoLetivo.semestre} · Prof. {o.professor.nome}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{o.matriculas.length} aluno{o.matriculas.length === 1 ? '' : 's'}</div>
                  <span style={{ color: 'var(--gray-400)', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--gray-100)', padding: '0 16px 12px' }}>
                    {o.matriculas.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--gray-400)', padding: '12px 0' }}>Nenhum aluno matriculado nesta turma.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead>
                          <tr>
                            {['RA', 'Aluno', 'Situação'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-100)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {o.matriculas.map(m => (
                            <tr key={m.aluno.id}>
                              <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>{m.aluno.ra}</td>
                              <td style={{ padding: '6px 8px', fontSize: 13 }}>{m.aluno.nome}</td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: 'var(--gray-500)' }}>{STATUS_LABEL[m.status] ?? m.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
