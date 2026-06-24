'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
interface Curso { id: string; nome: string; }
interface MatrizCurricular {
  id: string;
  cursoId: string;
  versao: string;
  anoVigencia: number;
  status: 'VIGENTE' | 'ENCERRADA';
  curso?: { nome: string };
}
type FormData = { cursoId: string; versao: string; anoVigencia: number; };

const EMPTY: FormData = { cursoId: '', versao: '', anoVigencia: new Date().getFullYear() };

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

// ── modal ──────────────────────────────────────────────────────────────
function MatrizModal({ matriz, cursos, onClose, onSave }: {
  matriz: MatrizCurricular | null;
  cursos: Curso[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    matriz
      ? { cursoId: matriz.cursoId, versao: matriz.versao, anoVigencia: matriz.anoVigencia }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (matriz) {
        await apiFetch(`/matrizes-curriculares/${matriz.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/matrizes-curriculares', { method: 'POST', body: JSON.stringify(form) });
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
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 480, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {matriz ? 'Editar Matriz' : 'Nova Matriz Curricular'}
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Curso *</label>
            <select style={INPUT} value={form.cursoId} required
              onChange={e => set('cursoId', e.target.value)}>
              <option value="">Selecione...</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Versão *</label>
              <input style={INPUT} value={form.versao} required
                onChange={e => set('versao', e.target.value)} placeholder="Ex: 2024.1" />
            </div>
            <div>
              <label style={LABEL}>Ano de vigência *</label>
              <input style={INPUT} type="number" min={2000} max={2100}
                value={form.anoVigencia} required
                onChange={e => set('anoVigencia', Number(e.target.value))} />
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
export default function MatrizesPage() {
  const [matrizes, setMatrizes] = useState<MatrizCurricular[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | MatrizCurricular | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [m, c] = await Promise.all([
        apiFetch<MatrizCurricular[]>('/matrizes-curriculares'),
        apiFetch<Curso[]>('/cursos'),
      ]);
      setMatrizes(m);
      setCursos(c);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deletar(id: string) {
    if (!confirm('Excluir esta matriz?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/matrizes-curriculares/${id}`, { method: 'DELETE' });
      setMatrizes(m => m.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const cursoNome = (id: string) => cursos.find(c => c.id === id)?.nome ?? '-';

  const filtered = matrizes.filter(m =>
    !filtro || m.versao.toLowerCase().includes(filtro.toLowerCase()) ||
    cursoNome(m.cursoId).toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Matrizes Curriculares</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{matrizes.length} matriz{matrizes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Nova Matriz</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 280 }}
        placeholder="Filtrar por curso ou versão..."
        value={filtro} onChange={e => setFiltro(e.target.value)} />

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Curso', 'Versão', 'Ano vigência', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  {filtro ? 'Nenhum resultado.' : 'Nenhuma matriz cadastrada ainda.'}
                </td></tr>
              )}
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{cursoNome(m.cursoId)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{m.versao}</td>
                  <td style={{ padding: '10px 14px' }}>{m.anoVigencia}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: m.status === 'VIGENTE' ? '#d1fae5' : '#f3f4f6',
                      color: m.status === 'VIGENTE' ? '#065f46' : '#6b7280',
                    }}>{m.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(m)}>Editar</button>
                      <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                        disabled={deleting === m.id} onClick={() => deletar(m.id)}>
                        {deleting === m.id ? '...' : 'Excluir'}
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
        <MatrizModal
          matriz={modal === 'new' ? null : modal}
          cursos={cursos}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
