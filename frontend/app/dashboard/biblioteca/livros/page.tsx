'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Exemplar { id: string; codigoTombamento: string; localizacao: string | null; status: StatusItem; numeroExemplar: number | null; }
type StatusItem = 'DISPONIVEL' | 'EMPRESTADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO';
interface Livro {
  id: string; titulo: string; autor: string; editora: string | null; isbn: string | null;
  categoria: string | null; anoPublicacao: number | null; cdd: string | null; cutter: string | null;
  exemplares?: Exemplar[];
}
type FormData = Omit<Livro, 'id' | 'exemplares'>;

const EMPTY: FormData = { titulo: '', autor: '', editora: '', isbn: '', categoria: '', anoPublicacao: null, cdd: '', cutter: '' };

const STATUS_LABEL: Record<StatusItem, string> = {
  DISPONIVEL: 'Disponível', EMPRESTADO: 'Emprestado', MANUTENCAO: 'Manutenção', EXTRAVIADO: 'Extraviado', BAIXADO: 'Baixado',
};
const STATUS_COLOR: Record<StatusItem, { bg: string; text: string }> = {
  DISPONIVEL: { bg: '#d1fae5', text: '#065f46' },
  EMPRESTADO: { bg: '#fef3c7', text: '#92400e' },
  MANUTENCAO: { bg: '#e0e7ff', text: '#3730a3' },
  EXTRAVIADO: { bg: '#fee2e2', text: '#991b1b' },
  BAIXADO: { bg: 'var(--gray-100)', text: 'var(--gray-500)' },
};

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
const OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}

function Badge({ status }: { status: StatusItem }) {
  const c = STATUS_COLOR[status];
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{STATUS_LABEL[status]}</span>;
}

function LivroModal({ livro, onClose, onSave }: { livro: Livro | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(livro ? { ...livro } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof FormData, v: string | number | null) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body = {
        titulo: form.titulo, autor: form.autor,
        editora: form.editora || undefined, isbn: form.isbn || undefined, categoria: form.categoria || undefined,
        anoPublicacao: form.anoPublicacao || undefined,
        cdd: form.cdd || undefined, cutter: form.cutter || undefined,
      };
      if (livro) await apiFetch(`/biblioteca/livros/${livro.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/biblioteca/livros', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  return (
    <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{livro ? 'Editar Livro' : 'Novo Livro'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <F label="Título *"><input style={INPUT} value={form.titulo} required onChange={e => set('titulo', e.target.value)} /></F>
          <F label="Autor *"><input style={INPUT} value={form.autor} required onChange={e => set('autor', e.target.value)} /></F>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <F label="Editora"><input style={INPUT} value={form.editora ?? ''} onChange={e => set('editora', e.target.value)} /></F>
            <F label="Ano"><input style={INPUT} type="number" value={form.anoPublicacao ?? ''} onChange={e => set('anoPublicacao', e.target.value ? Number(e.target.value) : null)} /></F>
            <F label="ISBN"><input style={INPUT} value={form.isbn ?? ''} onChange={e => set('isbn', e.target.value)} /></F>
            <F label="Categoria"><input style={INPUT} value={form.categoria ?? ''} onChange={e => set('categoria', e.target.value)} /></F>
            <F label="CDD"><input style={INPUT} placeholder="Ex: 305.8" value={form.cdd ?? ''} onChange={e => set('cdd', e.target.value)} /></F>
            <F label="Cutter"><input style={INPUT} placeholder="Ex: G298i" value={form.cutter ?? ''} onChange={e => set('cutter', e.target.value)} /></F>
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

function ExemplaresModal({ livro, onClose, onChanged }: { livro: Livro; onClose: () => void; onChanged: () => void }) {
  const [detalhe, setDetalhe] = useState<Livro | null>(null);
  const [codigo, setCodigo] = useState('');
  const [local, setLocal] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setDetalhe(await apiFetch<Livro>(`/biblioteca/livros/${livro.id}`)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
  }, [livro.id]);

  useEffect(() => { load(); }, [load]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSalvando(true);
    try {
      await apiFetch(`/biblioteca/livros/${livro.id}/exemplares`, {
        method: 'POST',
        body: JSON.stringify({ codigoTombamento: codigo, localizacao: local || undefined }),
      });
      setCodigo(''); setLocal('');
      await load(); onChanged();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao adicionar exemplar'); }
    finally { setSalvando(false); }
  }

  async function remover(exemplarId: string) {
    if (!confirm('Remover este exemplar?')) return;
    try {
      await apiFetch(`/biblioteca/livros/${livro.id}/exemplares/${exemplarId}`, { method: 'DELETE' });
      await load(); onChanged();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao remover'); }
  }

  return (
    <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 520, maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Exemplares</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--gray-500)' }}>{livro.titulo} — {livro.autor}</p>

        <form onSubmit={adicionar} style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><F label="Código de tombamento *"><input style={INPUT} value={codigo} required onChange={e => setCodigo(e.target.value)} /></F></div>
          <div style={{ flex: 1 }}><F label="Localização"><input style={INPUT} placeholder="Ex: Estante A3" value={local} onChange={e => setLocal(e.target.value)} /></F></div>
          <button type="submit" style={{ ...BTN('primary'), height: 32 }} disabled={salvando}>+ Add</button>
        </form>
        {error && <p style={{ color: '#e02424', fontSize: 13 }}>{error}</p>}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Ex.', 'Código', 'Localização', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 11.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!detalhe || detalhe.exemplares?.length === 0) && (
              <tr><td colSpan={5} style={{ padding: 18, textAlign: 'center', color: 'var(--gray-400)' }}>{detalhe ? 'Nenhum exemplar cadastrado.' : 'Carregando...'}</td></tr>
            )}
            {detalhe?.exemplares?.map(ex => (
              <tr key={ex.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '7px 10px', color: 'var(--gray-500)' }}>{ex.numeroExemplar ?? '—'}</td>
                <td style={{ padding: '7px 10px', fontWeight: 500 }}>{ex.codigoTombamento}</td>
                <td style={{ padding: '7px 10px', color: 'var(--gray-500)' }}>{ex.localizacao ?? '—'}</td>
                <td style={{ padding: '7px 10px' }}><Badge status={ex.status} /></td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a
                      href={`/dashboard/biblioteca/livros/etiqueta/${ex.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...BTN('ghost'), padding: '3px 8px', fontSize: 11.5, textDecoration: 'none', display: 'inline-block' }}
                    >
                      Etiqueta
                    </a>
                    <button style={{ ...BTN('danger'), padding: '3px 8px', fontSize: 11.5 }} disabled={ex.status === 'EMPRESTADO'} onClick={() => remover(ex.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button style={BTN('ghost')} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function LivrosPage() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<'new' | Livro | null>(null);
  const [exemplaresDe, setExemplaresDe] = useState<Livro | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (termo?: string) => {
    setLoading(true); setError('');
    try {
      const qs = termo ? `?busca=${encodeURIComponent(termo)}` : '';
      setLivros(await apiFetch<Livro[]>(`/biblioteca/livros${qs}`));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remover(id: string) {
    if (!confirm('Excluir este livro? (bloqueado se houver exemplar emprestado)')) return;
    setDeleting(id);
    try { await apiFetch(`/biblioteca/livros/${id}`, { method: 'DELETE' }); setLivros(l => l.filter(x => x.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir'); }
    finally { setDeleting(null); }
  }

  function contagem(livro: Livro): string {
    const total = livro.exemplares?.length ?? 0;
    const disp = livro.exemplares?.filter(e => e.status === 'DISPONIVEL').length ?? 0;
    return `${disp}/${total}`;
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Acervo — Biblioteca</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Catálogo de livros e seus exemplares físicos.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...INPUT, width: 220 }} placeholder="Buscar título, autor, categoria..."
            value={busca} onChange={e => setBusca(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load(busca); }}
          />
          <button style={BTN('ghost')} onClick={() => load(busca)}>Buscar</button>
          <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Livro</button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Título', 'Autor', 'Categoria', 'Classificação', 'Ano', 'Exemplares (disp/total)', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {livros.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum livro cadastrado ainda.</td></tr>
              )}
              {livros.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{l.titulo}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{l.autor}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{l.categoria ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontFamily: 'monospace', fontSize: 12 }}>
                    {l.cdd || l.cutter ? `${l.cdd ?? ''} ${l.cutter ?? ''}`.trim() : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{l.anoPublicacao ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{contagem(l)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setExemplaresDe(l)}>Exemplares</button>
                      <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(l)}>Editar</button>
                      <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }} disabled={deleting === l.id} onClick={() => remover(l.id)}>
                        {deleting === l.id ? '...' : 'Excluir'}
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
        <LivroModal livro={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => load(busca)} />
      )}
      {exemplaresDe && (
        <ExemplaresModal livro={exemplaresDe} onClose={() => setExemplaresDe(null)} onChanged={() => load(busca)} />
      )}
    </div>
  );
}
