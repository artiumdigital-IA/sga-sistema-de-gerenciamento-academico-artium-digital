'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type TagAviso = 'GERAL' | 'IMPORTANTE' | 'APENAS_EQUIPE';

interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  tag: TagAviso;
  autorNome: string;
  criadoEm: string;
}

const TAG_LABEL: Record<TagAviso, string> = {
  GERAL: 'Geral', IMPORTANTE: 'Importante', APENAS_EQUIPE: 'Apenas Equipe',
};
const TAG_COLOR: Record<TagAviso, { bg: string; color: string }> = {
  GERAL:         { bg: '#dde1e8', color: '#5e6878' },
  IMPORTANTE:    { bg: '#f8d7db', color: '#C8102E' },
  APENAS_EQUIPE: { bg: '#fef3cd', color: '#b45309' },
};

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 5,
  border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

const EMPTY = { titulo: '', texto: '', tag: 'GERAL' as TagAviso, autorNome: '' };

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<null | 'new' | Aviso>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await apiFetch<Aviso[]>('/avisos');
      setAvisos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm(EMPTY); setModal('new'); }
  function openEdit(a: Aviso) { setForm({ titulo: a.titulo, texto: a.texto, tag: a.tag, autorNome: a.autorNome }); setModal(a); }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'new') {
        await apiFetch('/avisos', { method: 'POST', body: JSON.stringify(form) });
      } else if (modal && typeof modal === 'object') {
        await apiFetch(`/avisos/${modal.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      }
      setModal(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Excluir este aviso?')) return;
    setDeleting(id);
    try { await apiFetch(`/avisos/${id}`, { method: 'DELETE' }); await load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erro'); }
    finally { setDeleting(null); }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Avisos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{avisos.length} aviso{avisos.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN('primary')} onClick={openNew}>+ Novo Aviso</button>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {avisos.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              Nenhum aviso cadastrado.
            </div>
          )}
          {avisos.map(a => {
            const tc = TAG_COLOR[a.tag];
            return (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: a.tag === 'IMPORTANTE' ? '#f8d7db' : a.tag === 'APENAS_EQUIPE' ? '#fef3cd' : '#dde1e8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color: tc.color,
                }}>
                  {a.autorNome.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{a.autorNome}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: tc.bg, color: tc.color }}>
                      {TAG_LABEL[a.tag]}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{fmt(a.criadoEm)}</span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 2px', color: '#374151' }}>{a.titulo}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{a.texto}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexShrink: 0 }}>
                  <button style={BTN('ghost')} onClick={() => openEdit(a)}>Editar</button>
                  <button style={BTN('danger')} onClick={() => del(a.id)} disabled={deleting === a.id}>
                    {deleting === a.id ? '...' : 'Excluir'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: 480, maxWidth: '95vw' }}>
            <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>
              {modal === 'new' ? 'Novo Aviso' : 'Editar Aviso'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={LABEL}>Autor</label>
                <input style={INPUT} value={form.autorNome} onChange={e => setForm(f => ({ ...f, autorNome: e.target.value }))} placeholder="Nome do autor" />
              </div>
              <div>
                <label style={LABEL}>Categoria</label>
                <select style={INPUT} value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value as TagAviso }))}>
                  <option value="GERAL">Geral</option>
                  <option value="IMPORTANTE">Importante</option>
                  <option value="APENAS_EQUIPE">Apenas Equipe</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Título</label>
                <input style={INPUT} value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título do aviso" />
              </div>
              <div>
                <label style={LABEL}>Mensagem</label>
                <textarea style={{ ...INPUT, minHeight: 80, resize: 'vertical' }} value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} placeholder="Conteúdo do aviso" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button style={BTN('ghost')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={BTN('primary')} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
