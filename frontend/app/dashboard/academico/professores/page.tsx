'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type Titulacao = 'GRADUADO' | 'ESPECIALISTA' | 'MESTRE' | 'DOUTOR' | 'POS_DOUTOR';
type RegimeTrabalho = 'HORISTA' | 'PARCIAL' | 'INTEGRAL';

interface Professor {
  id: string;
  nome: string;
  cpf: string;
  titulacao: Titulacao;
  regimeTrabalho: RegimeTrabalho;
  lattes?: string;
  email: string;
  telefone?: string;
}

type FormData = Omit<Professor, 'id'>;

const TITULACAO_LABEL: Record<Titulacao, string> = {
  GRADUADO: 'Graduado', ESPECIALISTA: 'Especialista',
  MESTRE: 'Mestre', DOUTOR: 'Doutor', POS_DOUTOR: 'Pós-doutor',
};
const REGIME_LABEL: Record<RegimeTrabalho, string> = {
  HORISTA: 'Horista', PARCIAL: 'Parcial (20h)', INTEGRAL: 'Integral (40h)',
};

const EMPTY: FormData = {
  nome: '', cpf: '', titulacao: 'MESTRE', regimeTrabalho: 'HORISTA',
  lattes: '', email: '', telefone: '',
};

const BTN = (variant: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: variant === 'primary' ? '#1a56db' : variant === 'danger' ? '#e02424' : 'transparent',
  color: variant === 'ghost' ? '#374151' : '#fff',
  ...(variant === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

// ── modal ──────────────────────────────────────────────────────────────
function ProfessorModal({ professor, onClose, onSave }: {
  professor: Professor | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    professor
      ? { nome: professor.nome, cpf: professor.cpf, titulacao: professor.titulacao,
          regimeTrabalho: professor.regimeTrabalho, lattes: professor.lattes ?? '',
          email: professor.email, telefone: professor.telefone ?? '' }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        ...form,
        lattes: form.lattes || undefined,
        telefone: form.telefone || undefined,
      };
      if (professor) {
        await apiFetch(`/professores/${professor.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/professores', { method: 'POST', body: JSON.stringify(body) });
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
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {professor ? 'Editar Professor' : 'Novo Professor'}
        </h2>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Nome completo *</label>
            <input style={INPUT} value={form.nome} required onChange={e => set('nome', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>CPF *</label>
              <input style={INPUT} value={form.cpf} required onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <label style={LABEL}>E-mail *</label>
              <input style={INPUT} type="email" value={form.email} required onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Titulação (Censo) *</label>
              <select style={INPUT} value={form.titulacao} onChange={e => set('titulacao', e.target.value as Titulacao)}>
                {Object.entries(TITULACAO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Regime de trabalho (Censo) *</label>
              <select style={INPUT} value={form.regimeTrabalho} onChange={e => set('regimeTrabalho', e.target.value as RegimeTrabalho)}>
                {Object.entries(REGIME_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Telefone</label>
              <input style={INPUT} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(21) 99999-9999" />
            </div>
            <div>
              <label style={LABEL}>Lattes (URL)</label>
              <input style={INPUT} value={form.lattes} onChange={e => set('lattes', e.target.value)} placeholder="http://lattes.cnpq.br/..." />
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

// ── badge de titulação ─────────────────────────────────────────────────
const TITULACAO_STYLE: Record<Titulacao, { bg: string; color: string }> = {
  GRADUADO:    { bg: '#f3f4f6', color: '#374151' },
  ESPECIALISTA:{ bg: '#fef3c7', color: '#92400e' },
  MESTRE:      { bg: '#dbeafe', color: '#1e40af' },
  DOUTOR:      { bg: '#ede9fe', color: '#5b21b6' },
  POS_DOUTOR:  { bg: '#fce7f3', color: '#9d174d' },
};

// ── página principal ───────────────────────────────────────────────────
export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Professor | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Professor[]>('/professores');
      setProfessores(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteProfessor(id: string) {
    if (!confirm('Excluir este professor?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/professores/${id}`, { method: 'DELETE' });
      setProfessores(p => p.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = professores.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Professores</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
            {professores.length} professor{professores.length !== 1 ? 'es' : ''} cadastrado{professores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Professor</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 280 }}
        placeholder="Buscar por nome, CPF ou e-mail..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nome', 'CPF', 'E-mail', 'Titulação', 'Regime', 'Lattes', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  {search ? 'Nenhum resultado.' : 'Nenhum professor cadastrado ainda.'}
                </td></tr>
              )}
              {filtered.map((p, i) => {
                const ts = TITULACAO_STYLE[p.titulacao];
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.nome}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>{p.cpf}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{p.email}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: ts.bg, color: ts.color }}>
                        {TITULACAO_LABEL[p.titulacao]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{REGIME_LABEL[p.regimeTrabalho]}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {p.lattes
                        ? <a href={p.lattes} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#1a56db', fontSize: 12 }}>Ver ↗</a>
                        : <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(p)}>Editar</button>
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                          disabled={deleting === p.id} onClick={() => deleteProfessor(p.id)}>
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
        <ProfessorModal
          professor={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
