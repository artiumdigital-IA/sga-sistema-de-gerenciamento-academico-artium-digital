'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type Grau = 'BACHARELADO' | 'LICENCIATURA' | 'TECNOLOGO';
type Modalidade = 'PRESENCIAL' | 'EAD' | 'SEMIPRESENCIAL';
type CursoStatus = 'ATIVO' | 'ENCERRADO';

interface Curso {
  id: string;
  nome: string;
  grau: Grau;
  modalidade: Modalidade;
  codigoEmec: string;
  cargaHorariaTotal: number;
  prazoIntegralizacaoSemestres: number;
  status: CursoStatus;
}

type FormData = Omit<Curso, 'id' | 'status'>;

const GRAU_LABEL: Record<Grau, string> = {
  BACHARELADO: 'Bacharelado',
  LICENCIATURA: 'Licenciatura',
  TECNOLOGO: 'Tecnólogo',
};
const MODALIDADE_LABEL: Record<Modalidade, string> = {
  PRESENCIAL: 'Presencial',
  EAD: 'EAD',
  SEMIPRESENCIAL: 'Semipresencial',
};

const EMPTY: FormData = {
  nome: '',
  grau: 'BACHARELADO',
  modalidade: 'PRESENCIAL',
  codigoEmec: '',
  cargaHorariaTotal: 3700,
  prazoIntegralizacaoSemestres: 10,
};

// ── estilos rápidos ────────────────────────────────────────────────────
const BTN = (variant: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13,
  fontWeight: 500,
  background: variant === 'primary' ? '#1a56db' : variant === 'danger' ? '#e02424' : 'transparent',
  color: variant === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(variant === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
const INPUT = {
  width: '100%', padding: '7px 10px', borderRadius: 5,
  border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' as const,
};
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };

// ── modal ──────────────────────────────────────────────────────────────
function CursoModal({
  curso, onClose, onSave,
}: {
  curso: Curso | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    curso
      ? { nome: curso.nome, grau: curso.grau, modalidade: curso.modalidade,
          codigoEmec: curso.codigoEmec, cargaHorariaTotal: curso.cargaHorariaTotal,
          prazoIntegralizacaoSemestres: curso.prazoIntegralizacaoSemestres }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (curso) {
        await apiFetch(`/cursos/${curso.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/cursos', { method: 'POST', body: JSON.stringify(form) });
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--white)', borderRadius: 10, padding: 28, width: 520, maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {curso ? 'Editar Curso' : 'Novo Curso'}
        </h2>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Nome do curso *</label>
            <input style={INPUT} value={form.nome} required
              onChange={e => set('nome', e.target.value)} placeholder="Ex: Direito" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Grau *</label>
              <select style={INPUT} value={form.grau}
                onChange={e => set('grau', e.target.value as Grau)}>
                {Object.entries(GRAU_LABEL).map(([v, l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Modalidade *</label>
              <select style={INPUT} value={form.modalidade}
                onChange={e => set('modalidade', e.target.value as Modalidade)}>
                {Object.entries(MODALIDADE_LABEL).map(([v, l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={LABEL}>Código e-MEC *</label>
            <input style={INPUT} value={form.codigoEmec} required
              onChange={e => set('codigoEmec', e.target.value)} placeholder="Ex: 122" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Carga horária total (h) *</label>
              <input style={INPUT} type="number" min={1} value={form.cargaHorariaTotal} required
                onChange={e => set('cargaHorariaTotal', Number(e.target.value))} />
            </div>
            <div>
              <label style={LABEL}>Prazo integralização (semestres) *</label>
              <input style={INPUT} type="number" min={1} value={form.prazoIntegralizacaoSemestres} required
                onChange={e => set('prazoIntegralizacaoSemestres', Number(e.target.value))} />
            </div>
          </div>

          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── página principal ───────────────────────────────────────────────────
export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Curso | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Curso[]>('/cursos');
      setCursos(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteCurso(id: string) {
    if (!confirm('Excluir este curso?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/cursos/${id}`, { method: 'DELETE' });
      setCursos(c => c.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = cursos.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.codigoEmec.includes(search)
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cursos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            {cursos.length} curso{cursos.length !== 1 ? 's' : ''} cadastrado{cursos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Curso</button>
      </div>

      {/* busca */}
      <input
        style={{ ...INPUT, marginBottom: 16, width: 280 }}
        placeholder="Buscar por nome ou código e-MEC..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* estados */}
      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {/* tabela */}
      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Nome', 'Grau', 'Modalidade', 'e-MEC', 'C.H.', 'Prazos', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
                  {search ? 'Nenhum resultado.' : 'Nenhum curso cadastrado ainda.'}
                </td></tr>
              )}
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ padding: '10px 14px' }}>{GRAU_LABEL[c.grau]}</td>
                  <td style={{ padding: '10px 14px' }}>{MODALIDADE_LABEL[c.modalidade]}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{c.codigoEmec}</td>
                  <td style={{ padding: '10px 14px' }}>{c.cargaHorariaTotal}h</td>
                  <td style={{ padding: '10px 14px' }}>{c.prazoIntegralizacaoSemestres} sem.</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: c.status === 'ATIVO' ? '#d1fae5' : 'var(--gray-100)',
                      color: c.status === 'ATIVO' ? '#065f46' : 'var(--gray-500)',
                    }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setModal(c)}>Editar</button>
                      <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                        disabled={deleting === c.id}
                        onClick={() => deleteCurso(c.id)}>
                        {deleting === c.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* modal */}
      {modal !== null && (
        <CursoModal
          curso={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
