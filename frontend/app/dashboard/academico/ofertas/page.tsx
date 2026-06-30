'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type Turno = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL';

interface PeriodoLetivo { id: string; ano: number; semestre: 'S1' | 'S2'; status: string; }
interface Disciplina { id: string; codigo: string; nome: string; matrizCurricularId: string; }
interface Matriz { id: string; versao: string; cursoId: string; }
interface Curso { id: string; nome: string; }
interface Professor { id: string; nome: string; titulacao: string; }

interface Oferta {
  id: string;
  disciplinaId: string;
  periodoLetivoId: string;
  professorId: string;
  vagas: number;
  turno: Turno;
  horario?: string;
  sala?: string;
  disciplina?: { codigo: string; nome: string };
  periodoLetivo?: { ano: number; semestre: string };
  professor?: { nome: string };
  _count?: { matriculas: number };
}
type FormData = {
  periodoLetivoId: string; disciplinaId: string; professorId: string;
  vagas: number; turno: Turno; horario: string; sala: string;
};

const TURNO_LABEL: Record<Turno, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral' };
const TURNO_COLOR: Record<Turno, { bg: string; color: string }> = {
  MANHA:    { bg: '#fef3c7', color: '#92400e' },
  TARDE:    { bg: '#dbeafe', color: '#1e40af' },
  NOITE:    { bg: '#ede9fe', color: '#5b21b6' },
  INTEGRAL: { bg: '#d1fae5', color: '#065f46' },
};

const EMPTY: FormData = {
  periodoLetivoId: '', disciplinaId: '', professorId: '',
  vagas: 40, turno: 'NOITE', horario: '', sala: '',
};

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

// ── modal ──────────────────────────────────────────────────────────────
function OfertaModal({ oferta, periodos, disciplinas, matrizes, cursos, professores, onClose, onSave }: {
  oferta: Oferta | null;
  periodos: PeriodoLetivo[];
  disciplinas: Disciplina[];
  matrizes: Matriz[];
  cursos: Curso[];
  professores: Professor[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [cursoId, setCursoId] = useState(() => {
    if (!oferta) return '';
    const m = matrizes.find(x => x.id === disciplinas.find(d => d.id === oferta.disciplinaId)?.matrizCurricularId);
    return m?.cursoId ?? '';
  });
  const [matrizId, setMatrizId] = useState(() => {
    if (!oferta) return '';
    return disciplinas.find(d => d.id === oferta.disciplinaId)?.matrizCurricularId ?? '';
  });
  const [form, setForm] = useState<FormData>(
    oferta
      ? { periodoLetivoId: oferta.periodoLetivoId, disciplinaId: oferta.disciplinaId,
          professorId: oferta.professorId, vagas: oferta.vagas, turno: oferta.turno,
          horario: oferta.horario ?? '', sala: oferta.sala ?? '' }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const matrizesDoC = matrizes.filter(m => m.cursoId === cursoId);
  const disciplinasDoM = disciplinas.filter(d => d.matrizCurricularId === matrizId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, horario: form.horario || undefined, sala: form.sala || undefined };
      if (oferta) {
        await apiFetch(`/ofertas/${oferta.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/ofertas', { method: 'POST', body: JSON.stringify(body) });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const periodoLabel = (p: PeriodoLetivo) => `${p.ano}/${p.semestre === 'S1' ? '1' : '2'}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>{oferta ? 'Editar Oferta' : 'Nova Oferta'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Período */}
          <div>
            <label style={LABEL}>Período letivo *</label>
            <select style={INPUT} value={form.periodoLetivoId} required
              onChange={e => set('periodoLetivoId', e.target.value)}>
              <option value="">Selecione o período...</option>
              {periodos.map(p => (
                <option key={p.id} value={p.id}>{periodoLabel(p)} — {p.status}</option>
              ))}
            </select>
          </div>

          {/* Selects encadeados: Curso → Matriz → Disciplina */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Curso *</label>
              <select style={INPUT} value={cursoId} required
                onChange={e => { setCursoId(e.target.value); setMatrizId(''); set('disciplinaId', ''); }}>
                <option value="">Selecione...</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Matriz curricular *</label>
              <select style={INPUT} value={matrizId} required disabled={!cursoId}
                onChange={e => { setMatrizId(e.target.value); set('disciplinaId', ''); }}>
                <option value="">Selecione...</option>
                {matrizesDoC.map(m => <option key={m.id} value={m.id}>Versão {m.versao}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={LABEL}>Disciplina *</label>
            <select style={INPUT} value={form.disciplinaId} required disabled={!matrizId}
              onChange={e => set('disciplinaId', e.target.value)}>
              <option value="">Selecione a disciplina...</option>
              {disciplinasDoM.map(d => <option key={d.id} value={d.id}>{d.codigo} — {d.nome}</option>)}
            </select>
          </div>

          {/* Professor */}
          <div>
            <label style={LABEL}>Professor *</label>
            <select style={INPUT} value={form.professorId} required
              onChange={e => set('professorId', e.target.value)}>
              <option value="">Selecione o professor...</option>
              {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {/* Vagas, Turno, Horário, Sala */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Vagas *</label>
              <input style={INPUT} type="number" min={1} value={form.vagas} required
                onChange={e => set('vagas', Number(e.target.value))} />
            </div>
            <div>
              <label style={LABEL}>Turno (Censo) *</label>
              <select style={INPUT} value={form.turno} onChange={e => set('turno', e.target.value as Turno)}>
                {Object.entries(TURNO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Horário</label>
              <input style={INPUT} value={form.horario} placeholder="SEG/QUA 19:00-22:00"
                onChange={e => set('horario', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Sala</label>
              <input style={INPUT} value={form.sala} placeholder="Sala 301"
                onChange={e => set('sala', e.target.value)} />
            </div>
          </div>

          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── página ─────────────────────────────────────────────────────────────
export default function OfertasPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Oferta | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [o, per, dis, mat, cur, pro] = await Promise.all([
        apiFetch<Oferta[]>('/ofertas'),
        apiFetch<PeriodoLetivo[]>('/periodos-letivos'),
        apiFetch<Disciplina[]>('/disciplinas'),
        apiFetch<Matriz[]>('/matrizes'),
        apiFetch<Curso[]>('/cursos'),
        apiFetch<Professor[]>('/professores'),
      ]);
      setOfertas(o); setPeriodos(per); setDisciplinas(dis);
      setMatrizes(mat); setCursos(cur); setProfessores(pro);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deletar(id: string) {
    if (!confirm('Excluir esta oferta?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/ofertas/${id}`, { method: 'DELETE' });
      setOfertas(o => o.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const periodoLabel = (id: string) => {
    const p = periodos.find(x => x.id === id);
    return p ? `${p.ano}/${p.semestre === 'S1' ? '1' : '2'}` : '-';
  };
  const discLabel = (id: string) => {
    const d = disciplinas.find(x => x.id === id);
    return d ? `${d.codigo} — ${d.nome}` : '-';
  };
  const profLabel = (id: string) => professores.find(x => x.id === id)?.nome ?? '-';

  const filtered = ofertas.filter(o =>
    !filtroPeriodo || o.periodoLetivoId === filtroPeriodo
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ofertas</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{ofertas.length} oferta{ofertas.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Nova Oferta</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <label style={{ ...LABEL, margin: 0 }}>Período:</label>
        <select style={{ ...INPUT, width: 200 }} value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
          <option value="">Todos</option>
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.ano}/{p.semestre === 'S1' ? '1' : '2'}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Período', 'Disciplina', 'Professor', 'Turno', 'Vagas', 'Matr.', 'Horário', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  {filtroPeriodo ? 'Nenhuma oferta neste período.' : 'Nenhuma oferta cadastrada ainda.'}
                </td></tr>
              )}
              {filtered.map((o, i) => {
                const tc = TURNO_COLOR[o.turno];
                const matriculados = o._count?.matriculas ?? 0;
                const cheio = matriculados >= o.vagas;
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{periodoLabel(o.periodoLetivoId)}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{discLabel(o.disciplinaId)}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profLabel(o.professorId)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color }}>{TURNO_LABEL[o.turno]}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{o.vagas}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 600, color: cheio ? '#e02424' : '#374151' }}>{matriculados}</span>
                      {cheio && <span style={{ fontSize: 10, color: '#e02424', marginLeft: 4 }}>CHEIO</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{o.horario ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(o)}>Editar</button>
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                          disabled={deleting === o.id} onClick={() => deletar(o.id)}>
                          {deleting === o.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <OfertaModal
          oferta={modal === 'new' ? null : modal}
          periodos={periodos} disciplinas={disciplinas} matrizes={matrizes}
          cursos={cursos} professores={professores}
          onClose={() => setModal(null)} onSave={load}
        />
      )}
    </div>
  );
}
