'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken, parseJwt } from '@/lib/auth';

interface Ramal { id: string; nome: string; setor: string | null; numero: string; ativo: boolean; }
type FormData = Omit<Ramal, 'id'>;

const EMPTY: FormData = { nome: '', setor: '', numero: '', ativo: true };

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
function G({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}

function RamalModal({ ramal, onClose, onSave }: { ramal: Ramal | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(ramal ? { nome: ramal.nome, setor: ramal.setor ?? '', numero: ramal.numero, ativo: ramal.ativo } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body = { ...form, setor: form.setor || undefined };
      if (ramal) await apiFetch(`/ramais/${ramal.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/ramais', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{ramal ? 'Editar Ramal' : 'Novo Ramal'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <F label="Nome *"><input style={INPUT} value={form.nome} required onChange={e => set('nome', e.target.value)} placeholder="Ex: Secretaria Acadêmica" /></F>
          <G cols="1fr 1fr">
            <F label="Setor"><input style={INPUT} value={form.setor ?? ''} onChange={e => set('setor', e.target.value)} placeholder="Ex: Atendimento" /></F>
            <F label="Número *"><input style={INPUT} value={form.numero} required onChange={e => set('numero', e.target.value)} placeholder="Ex: 2010" /></F>
          </G>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
            <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} />
            Ramal ativo
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

export default function RamaisPage() {
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Ramal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = getToken();
  const isAdmin = token ? parseJwt(token)?.perfil === 'ADMIN' : false;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRamais(await apiFetch<Ramal[]>('/ramais')); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remover(id: string) {
    if (!confirm('Excluir este ramal?')) return;
    setDeleting(id);
    try { await apiFetch(`/ramais/${id}`, { method: 'DELETE' }); setRamais(r => r.filter(x => x.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir'); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ramais</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            Catálogo de ramais telefônicos da instituição — exibido no modal "Ramais" acessível a todos.
            {!isAdmin && ' Somente Admin pode cadastrar, editar ou remover.'}
          </p>
        </div>
        {isAdmin && <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Ramal</button>}
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Nome', 'Setor', 'Número', 'Status', ...(isAdmin ? [''] : [])].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ramais.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum ramal cadastrado ainda.</td></tr>
              )}
              {ramais.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{r.nome}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{r.setor || '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#1a56db' }}>{r.numero}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: r.ativo ? '#d1fae5' : 'var(--gray-100)', color: r.ativo ? '#065f46' : 'var(--gray-500)' }}>
                      {r.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(r)}>Editar</button>
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }} disabled={deleting === r.id} onClick={() => remover(r.id)}>
                          {deleting === r.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <RamalModal ramal={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={load} />
      )}
    </div>
  );
}
