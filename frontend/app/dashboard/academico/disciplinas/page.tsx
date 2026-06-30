'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
interface Curso { id: string; nome: string; }
interface Matriz { id: string; versao: string; cursoId: string; }
interface Disciplina {
  id: string;
  matrizCurricularId: string;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  creditos: number;
  ementa?: string;
  periodoSugerido: number;
  matrizCurricular?: { versao: string; cursoId: string };
}
type FormData = {
  matrizCurricularId: string; codigo: string; nome: string;
  cargaHoraria: number; creditos: number; ementa: string; periodoSugerido: number;
};

const EMPTY: FormData = {
  matrizCurricularId: '', codigo: '', nome: '',
  cargaHoraria: 60, creditos: 4, ementa: '', periodoSugerido: 1,
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
function DisciplinaModal({ disciplina, cursos, matrizes, onClose, onSave }: {
  disciplina: Disciplina | null;
  cursos: Curso[];
  matrizes: Matriz[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [cursoId, setCursoId] = useState(
    disciplina ? (matrizes.find(m => m.id === disciplina.matrizCurricularId)?.cursoId ?? '') : ''
  );
  const [form, setForm] = useState<FormData>(
    disciplina
      ? { matrizCurricularId: disciplina.matrizCurricularId, codigo: disciplina.codigo,
          nome: disciplina.nome, cargaHoraria: disciplina.cargaHoraria, creditos: disciplina.creditos,
          ementa: disciplina.ementa ?? '', periodoSugerido: disciplina.periodoSugerido }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const matrizesDoC = matrizes.filter(m => m.cursoId === cursoId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, ementa: form.ementa || undefined };
      if (disciplina) {
        await apiFetch(`/disciplinas/${disciplina.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/disciplinas', { method: 'POST', body: JSON.stringify(body) });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {disciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Curso *</label>
            <select style={INPUT} value={cursoId} required
              onChange={e => { setCursoId(e.target.value); set('matrizCurricularId', ''); }}>
              <option value="">Selecione o curso...</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Matriz curricular *</label>
            <select style={INPUT} value={form.matrizCurricularId} required
              disabled={!cursoId}
              onChange={e => set('matrizCurricularId', e.target.value)}>
              <option value="">Selecione a matriz...</option>
              {matrizesDoC.map(m => <option key={m.id} value={m.id}>Versão {m.versao}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Código *</label>
              <input style={INPUT} value={form.codigo} required
                onChange={e => set('codigo', e.target.value)} placeholder="DIR101" />
            </div>
            <div>
              <label style={LABEL}>Nome *</label>
              <input style={INPUT} value={form.nome} required
                onChange={e => set('nome', e.target.value)} placeholder="Introdução ao Direito" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Carga horária (h) *</label>
              <input style={INPUT} type="number" min={1} value={form.cargaHoraria} required
                onChange={e => set('cargaHoraria', Number(e.target.value))} />
            </div>
            <div>
              <label style={LABEL}>Créditos *</label>
              <input style={INPUT} type="number" min={1} value={form.creditos} required
                onChange={e => set('creditos', Number(e.target.value))} />
            </div>
            <div>
              <label style={LABEL}>Período sugerido *</label>
              <input style={INPUT} type="number" min={1} value={form.periodoSugerido} required
                onChange={e => set('periodoSugerido', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label style={LABEL}>Ementa</label>
            <textarea style={{ ...INPUT, minHeight: 80, resize: 'vertical' }}
              value={form.ementa}
              onChange={e => set('ementa', e.target.value)}
              placeholder="Conteúdo programático..." />
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
export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Disciplina | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, c, m] = await Promise.all([
        apiFetch<Disciplina[]>('/disciplinas'),
        apiFetch<Curso[]>('/cursos'),
        apiFetch<Matriz[]>('/matrizes'),
      ]);
      setDisciplinas(d);
      setCursos(c);
      setMatrizes(m);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deletar(id: string) {
    if (!confirm('Excluir esta disciplina?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/disciplinas/${id}`, { method: 'DELETE' });
      setDisciplinas(d => d.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const matrizInfo = (matrizId: string) => {
    const m = matrizes.find(x => x.id === matrizId);
    if (!m) return '-';
    const c = cursos.find(x => x.id === m.cursoId);
    return c ? `${c.nome} • v${m.versao}` : `v${m.versao}`;
  };

  const filtered = disciplinas.filter(d =>
    !filtro ||
    d.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    d.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Disciplinas</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Nova Disciplina</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 280 }}
        placeholder="Filtrar por código ou nome..."
        value={filtro} onChange={e => setFiltro(e.target.value)} />

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Código', 'Nome', 'Matriz', 'Per.', 'C.H.', 'Créd.', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  {filtro ? 'Nenhum resultado.' : 'Nenhuma disciplina cadastrada ainda.'}
                </td></tr>
              )}
              {filtered.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{d.codigo}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{d.nome}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matrizInfo(d.matrizCurricularId)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>{d.periodoSugerido}º</td>
                  <td style={{ padding: '10px 14px' }}>{d.cargaHoraria}h</td>
                  <td style={{ padding: '10px 14px' }}>{d.creditos}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(d)}>Editar</button>
                      <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                        disabled={deleting === d.id} onClick={() => deletar(d.id)}>
                        {deleting === d.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <DisciplinaModal
          disciplina={modal === 'new' ? null : modal}
          cursos={cursos}
          matrizes={matrizes}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
