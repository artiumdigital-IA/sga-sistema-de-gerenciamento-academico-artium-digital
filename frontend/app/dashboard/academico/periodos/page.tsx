'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type Semestre = 'S1' | 'S2';
type PeriodoStatus = 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO';

interface PeriodoLetivo {
  id: string;
  ano: number;
  semestre: Semestre;
  dataInicio: string;
  dataFim: string;
  status: PeriodoStatus;
}
type FormData = { ano: number; semestre: Semestre; dataInicio: string; dataFim: string; };

const EMPTY: FormData = { ano: new Date().getFullYear(), semestre: 'S1', dataInicio: '', dataFim: '' };

const STATUS_STYLE: Record<PeriodoStatus, { bg: string; color: string; label: string }> = {
  PLANEJADO:    { bg: '#f3f4f6', color: '#374151', label: 'Planejado' },
  EM_ANDAMENTO: { bg: '#d1fae5', color: '#065f46', label: 'Em andamento' },
  ENCERRADO:    { bg: '#dbeafe', color: '#1e40af', label: 'Encerrado' },
};

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

function PeriodoModal({ periodo, onClose, onSave }: {
  periodo: PeriodoLetivo | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    periodo
      ? { ano: periodo.ano, semestre: periodo.semestre,
          dataInicio: periodo.dataInicio?.slice(0, 10) ?? '',
          dataFim: periodo.dataFim?.slice(0, 10) ?? '' }
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
      if (periodo) {
        await apiFetch(`/periodos-letivos/${periodo.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/periodos-letivos', { method: 'POST', body: JSON.stringify(form) });
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
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 440, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {periodo ? 'Editar Período' : 'Novo Período Letivo'}
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Ano *</label>
              <input style={INPUT} type="number" min={2000} max={2100}
                value={form.ano} required onChange={e => set('ano', Number(e.target.value))} />
            </div>
            <div>
              <label style={LABEL}>Semestre *</label>
              <select style={INPUT} value={form.semestre} onChange={e => set('semestre', e.target.value as Semestre)}>
                <option value="S1">1º semestre</option>
                <option value="S2">2º semestre</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Data de início *</label>
              <input style={INPUT} type="date" value={form.dataInicio} required onChange={e => set('dataInicio', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Data de fim *</label>
              <input style={INPUT} type="date" value={form.dataFim} required onChange={e => set('dataFim', e.target.value)} />
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

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | PeriodoLetivo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<PeriodoLetivo[]>('/periodos-letivos');
      setPeriodos(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deletar(id: string) {
    if (!confirm('Excluir este período?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/periodos-letivos/${id}`, { method: 'DELETE' });
      setPeriodos(p => p.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Períodos Letivos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{periodos.length} período{periodos.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Período</button>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Período', 'Início', 'Fim', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodos.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum período cadastrado ainda.</td></tr>
              )}
              {periodos.map((p, i) => {
                const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.PLANEJADO;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.ano}/{p.semestre === 'S1' ? '1' : '2'}</td>
                    <td style={{ padding: '10px 14px' }}>{fmt(p.dataInicio)}</td>
                    <td style={{ padding: '10px 14px' }}>{fmt(p.dataFim)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(p)}>Editar</button>
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                          disabled={deleting === p.id} onClick={() => deletar(p.id)}>
                          {deleting === p.id ? '...' : 'Excluir'}
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
        <PeriodoModal
          periodo={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
