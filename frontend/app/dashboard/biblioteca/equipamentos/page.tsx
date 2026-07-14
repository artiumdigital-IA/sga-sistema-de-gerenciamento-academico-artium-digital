'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type TipoEquipamento = 'COMPUTADOR' | 'NOTEBOOK' | 'TABLET' | 'OUTRO';
type StatusItem = 'DISPONIVEL' | 'EMPRESTADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO';
interface Equipamento {
  id: string; patrimonio: string; tipo: TipoEquipamento; modelo: string;
  numeroSerie: string | null; status: StatusItem; observacoes: string | null;
}
type FormData = Omit<Equipamento, 'id' | 'status'>;

const EMPTY: FormData = { patrimonio: '', tipo: 'COMPUTADOR', modelo: '', numeroSerie: '', observacoes: '' };
const TIPO_LABEL: Record<TipoEquipamento, string> = { COMPUTADOR: 'Computador', NOTEBOOK: 'Notebook', TABLET: 'Tablet', OUTRO: 'Outro' };
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}

function EquipamentoModal({ equipamento, onClose, onSave }: { equipamento: Equipamento | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(equipamento ? { ...equipamento } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body = {
        patrimonio: form.patrimonio, tipo: form.tipo, modelo: form.modelo,
        numeroSerie: form.numeroSerie || undefined, observacoes: form.observacoes || undefined,
      };
      if (equipamento) await apiFetch(`/biblioteca/equipamentos/${equipamento.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/biblioteca/equipamentos', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{equipamento ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <F label="Patrimônio *"><input style={INPUT} value={form.patrimonio} required onChange={e => set('patrimonio', e.target.value)} /></F>
          <F label="Tipo *">
            <select style={INPUT} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Modelo *"><input style={INPUT} value={form.modelo} required onChange={e => set('modelo', e.target.value)} /></F>
          <F label="Nº de série"><input style={INPUT} value={form.numeroSerie ?? ''} onChange={e => set('numeroSerie', e.target.value)} /></F>
          <F label="Observações"><textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} /></F>
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

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<'new' | Equipamento | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (termo?: string) => {
    setLoading(true); setError('');
    try {
      const qs = termo ? `?busca=${encodeURIComponent(termo)}` : '';
      setEquipamentos(await apiFetch<Equipamento[]>(`/biblioteca/equipamentos${qs}`));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remover(id: string) {
    if (!confirm('Excluir este equipamento? (bloqueado se estiver emprestado)')) return;
    setDeleting(id);
    try { await apiFetch(`/biblioteca/equipamentos/${id}`, { method: 'DELETE' }); setEquipamentos(e => e.filter(x => x.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir'); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Equipamentos — Biblioteca</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Computadores, notebooks e tablets disponíveis para empréstimo.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...INPUT, width: 220 }} placeholder="Buscar patrimônio, modelo, série..."
            value={busca} onChange={e => setBusca(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load(busca); }}
          />
          <button style={BTN('ghost')} onClick={() => load(busca)}>Buscar</button>
          <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Equipamento</button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Patrimônio', 'Tipo', 'Modelo', 'Nº Série', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipamentos.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum equipamento cadastrado ainda.</td></tr>
              )}
              {equipamentos.map((eq, i) => {
                const c = STATUS_COLOR[eq.status];
                return (
                  <tr key={eq.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{eq.patrimonio}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{TIPO_LABEL[eq.tipo]}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{eq.modelo}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{eq.numeroSerie ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{STATUS_LABEL[eq.status]}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a
                          href={`/dashboard/biblioteca/equipamentos/etiqueta/${eq.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12, textDecoration: 'none', display: 'inline-block' }}
                        >
                          Etiqueta
                        </a>
                        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(eq)}>Editar</button>
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }} disabled={deleting === eq.id} onClick={() => remover(eq.id)}>
                          {deleting === eq.id ? '...' : 'Excluir'}
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
        <EquipamentoModal equipamento={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => load(busca)} />
      )}
    </div>
  );
}
