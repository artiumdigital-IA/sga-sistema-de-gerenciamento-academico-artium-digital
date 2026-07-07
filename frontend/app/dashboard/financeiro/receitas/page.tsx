'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Categoria { id: string; nome: string; descricao: string | null; ativa: boolean; }
type FormData = Omit<Categoria, 'id'>;

const EMPTY: FormData = { nome: '', descricao: '', ativa: true };

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}

function CategoriaModal({ categoria, onClose, onSave }: { categoria: Categoria | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(categoria ? { ...categoria } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body = { ...form, descricao: form.descricao || undefined };
      if (categoria) await apiFetch(`/financeiro/receitas/${categoria.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/financeiro/receitas', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{categoria ? 'Editar Categoria de Receita' : 'Nova Categoria de Receita'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <F label="Nome *"><input style={INPUT} value={form.nome} required onChange={e => set('nome', e.target.value)} placeholder="Ex: Mensalidade, Taxa de Matrícula..." /></F>
          <F label="Descrição">
            <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={form.descricao ?? ''} onChange={e => set('descricao', e.target.value)} />
          </F>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
            <input type="checkbox" checked={form.ativa} onChange={e => set('ativa', e.target.checked)} />
            Categoria ativa
          </label>
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

export default function ReceitasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Categoria | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCategorias(await apiFetch<Categoria[]>('/financeiro/receitas')); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remover(id: string) {
    if (!confirm('Excluir esta categoria de receita?')) return;
    setDeleting(id);
    try { await apiFetch(`/financeiro/receitas/${id}`, { method: 'DELETE' }); setCategorias(c => c.filter(x => x.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir'); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Receitas</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Categorias de receita, base pra classificação financeira futura.</p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Nova Categoria</button>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Nome', 'Descrição', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma categoria cadastrada ainda.</td></tr>
              )}
              {categorias.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{c.descricao ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.ativa ? '#d1fae5' : 'var(--gray-100)', color: c.ativa ? '#065f46' : 'var(--gray-500)' }}>
                      {c.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(c)}>Editar</button>
                      <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }} disabled={deleting === c.id} onClick={() => remover(c.id)}>
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

      {modal !== null && (
        <CategoriaModal categoria={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={load} />
      )}
    </div>
  );
}
