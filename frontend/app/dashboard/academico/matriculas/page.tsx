'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type StatusMatricula = 'MATRICULADO' | 'PENDENTE_EXAME' | 'APROVADO' | 'REPROVADO' | 'DEPENDENCIA' | 'TRANCADO';

interface Aluno { id: string; ra: string; nome: string; cursoId: string; }
interface Curso { id: string; nome: string; }
interface PeriodoLetivo { id: string; ano: number; semestre: 'S1' | 'S2'; }
interface Disciplina { id: string; codigo: string; nome: string; }
interface Professor { id: string; nome: string; }
interface Oferta {
  id: string; periodoLetivoId: string; disciplinaId: string; professorId: string;
  vagas: number; turno: string; horario?: string;
  _count?: { matriculas: number };
}
interface MatriculaDisciplina {
  id: string;
  alunoId: string;
  ofertaId: string;
  status: StatusMatricula;
  isDependencia: boolean;
  dataMatricula: string;
  aluno?: { ra: string; nome: string };
  oferta?: { disciplina?: { codigo: string; nome: string }; periodoLetivo?: { ano: number; semestre: string } };
}

const STATUS_STYLE: Record<StatusMatricula, { bg: string; color: string; label: string }> = {
  MATRICULADO:    { bg: '#dbeafe', color: '#1e40af', label: 'Matriculado' },
  PENDENTE_EXAME: { bg: '#fef3c7', color: '#92400e', label: 'Pendente exame' },
  APROVADO:    { bg: '#d1fae5', color: '#065f46', label: 'Aprovado' },
  REPROVADO:   { bg: '#fee2e2', color: '#991b1b', label: 'Reprovado' },
  DEPENDENCIA: { bg: '#fef3c7', color: '#92400e', label: 'Dependência' },
  TRANCADO:    { bg: '#f3f4f6', color: '#374151', label: 'Trancado' },
};

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

// ── modal nova matrícula ───────────────────────────────────────────────
function MatriculaModal({ alunos, cursos, periodos, disciplinas, professores, ofertas, onClose, onSave }: {
  alunos: Aluno[];
  cursos: Curso[];
  periodos: PeriodoLetivo[];
  disciplinas: Disciplina[];
  professores: Professor[];
  ofertas: Oferta[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [cursoId, setCursoId] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [periodoId, setPeriodoId] = useState('');
  const [ofertaId, setOfertaId] = useState('');
  const [isDependencia, setIsDependencia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const alunosDoC = alunos.filter(a => !cursoId || a.cursoId === cursoId);
  const ofertasDoPeriodo = ofertas.filter(o => o.periodoLetivoId === periodoId);
  const ofertaSelecionada = ofertas.find(o => o.id === ofertaId);
  const vagasRestantes = ofertaSelecionada
    ? ofertaSelecionada.vagas - (ofertaSelecionada._count?.matriculas ?? 0)
    : null;

  const discNome = (discId: string) => {
    const d = disciplinas.find(x => x.id === discId);
    return d ? `${d.codigo} — ${d.nome}` : '-';
  };
  const profNome = (profId: string) => professores.find(x => x.id === profId)?.nome ?? '-';
  const periodoLabel = (p: PeriodoLetivo) => `${p.ano}/${p.semestre === 'S1' ? '1' : '2'}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoId || !ofertaId) { setError('Selecione o aluno e a oferta.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiFetch('/matriculas', {
        method: 'POST',
        body: JSON.stringify({ alunoId, ofertaId, isDependencia }),
      });
      onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao matricular');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>Nova Matrícula</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Seleção do aluno */}
          <div>
            <label style={LABEL}>Filtrar por curso</label>
            <select style={INPUT} value={cursoId} onChange={e => { setCursoId(e.target.value); setAlunoId(''); }}>
              <option value="">Todos os cursos</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Aluno *</label>
            <select style={INPUT} value={alunoId} required onChange={e => setAlunoId(e.target.value)}>
              <option value="">Selecione o aluno...</option>
              {alunosDoC.map(a => <option key={a.id} value={a.id}>{a.ra} — {a.nome}</option>)}
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

          {/* Seleção da oferta */}
          <div>
            <label style={LABEL}>Período letivo *</label>
            <select style={INPUT} value={periodoId} required onChange={e => { setPeriodoId(e.target.value); setOfertaId(''); }}>
              <option value="">Selecione o período...</option>
              {periodos.map(p => <option key={p.id} value={p.id}>{periodoLabel(p)}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Oferta / Disciplina *</label>
            <select style={INPUT} value={ofertaId} required disabled={!periodoId}
              onChange={e => setOfertaId(e.target.value)}>
              <option value="">Selecione a disciplina...</option>
              {ofertasDoPeriodo.map(o => {
                const livres = o.vagas - (o._count?.matriculas ?? 0);
                return (
                  <option key={o.id} value={o.id} disabled={livres <= 0}>
                    {discNome(o.disciplinaId)} | {profNome(o.professorId)} | {o.turno} | {livres} vaga{livres !== 1 ? 's' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Info da oferta selecionada */}
          {ofertaSelecionada && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, fontSize: 12 }}>
              <strong>Vagas disponíveis:</strong>{' '}
              <span style={{ color: vagasRestantes === 0 ? '#e02424' : '#065f46', fontWeight: 700 }}>
                {vagasRestantes} de {ofertaSelecionada.vagas}
              </span>
              {ofertaSelecionada.horario && <> · <strong>Horário:</strong> {ofertaSelecionada.horario}</>}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={isDependencia} onChange={e => setIsDependencia(e.target.checked)} />
            Matrícula em dependência (DP)
          </label>

          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving || vagasRestantes === 0}>
              {saving ? 'Matriculando...' : 'Matricular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── página ─────────────────────────────────────────────────────────────
export default function MatriculasPage() {
  const router = useRouter();
  const [matriculas, setMatriculas] = useState<MatriculaDisciplina[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtroAluno, setFiltroAluno] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [m, a, c, per, dis, pro, of] = await Promise.all([
        apiFetch<MatriculaDisciplina[]>('/matriculas'),
        apiFetch<Aluno[]>('/alunos'),
        apiFetch<Curso[]>('/cursos'),
        apiFetch<PeriodoLetivo[]>('/periodos-letivos'),
        apiFetch<Disciplina[]>('/disciplinas'),
        apiFetch<Professor[]>('/professores'),
        apiFetch<Oferta[]>('/ofertas'),
      ]);
      setMatriculas(m); setAlunos(a); setCursos(c); setPeriodos(per);
      setDisciplinas(dis); setProfessores(pro); setOfertas(of);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deletar(id: string) {
    if (!confirm('Cancelar esta matrícula?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/matriculas/${id}`, { method: 'DELETE' });
      setMatriculas(m => m.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar');
    } finally {
      setDeleting(null);
    }
  }

  const alunoInfo = (id: string) => {
    const a = alunos.find(x => x.id === id);
    return a ? `${a.ra} — ${a.nome}` : '-';
  };
  const ofertaInfo = (id: string) => {
    const o = ofertas.find(x => x.id === id);
    if (!o) return '-';
    const d = disciplinas.find(x => x.id === o.disciplinaId);
    const per = periodos.find(x => x.id === o.periodoLetivoId);
    const perLabel = per ? `${per.ano}/${per.semestre === 'S1' ? '1' : '2'}` : '-';
    return d ? `${d.codigo} — ${d.nome} (${perLabel})` : '-';
  };

  const filtered = matriculas.filter(m => {
    if (!filtroAluno) return true;
    const a = alunos.find(x => x.id === m.alunoId);
    return a ? (a.ra.includes(filtroAluno) || a.nome.toLowerCase().includes(filtroAluno.toLowerCase())) : false;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Matrículas</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{matriculas.length} matrícula{matriculas.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN('primary')} onClick={() => setShowModal(true)}>+ Nova Matrícula</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 300 }}
        placeholder="Filtrar por nome ou RA do aluno..."
        value={filtroAluno} onChange={e => setFiltroAluno(e.target.value)} />

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Aluno', 'Disciplina / Período', 'Status', 'DP', 'Data', '', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  {filtroAluno ? 'Nenhum resultado.' : 'Nenhuma matrícula cadastrada ainda.'}
                </td></tr>
              )}
              {filtered.map((m, i) => {
                const st = STATUS_STYLE[m.status] ?? STATUS_STYLE.MATRICULADO;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{alunoInfo(m.alunoId)}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{ofertaInfo(m.ofertaId)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {m.isDependencia && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>DP</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>
                      {m.dataMatricula ? new Date(m.dataMatricula).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                        disabled={deleting === m.id} onClick={() => deletar(m.id)}>
                        {deleting === m.id ? '...' : 'Cancelar'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #1a56db', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#1a56db', fontWeight: 500 }}
                        onClick={() => router.push(`/dashboard/academico/matriculas/${m.id}`)}>
                        Notas →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <MatriculaModal
          alunos={alunos} cursos={cursos} periodos={periodos}
          disciplinas={disciplinas} professores={professores} ofertas={ofertas}
          onClose={() => setShowModal(false)} onSave={load}
        />
      )}
    </div>
  );
}
