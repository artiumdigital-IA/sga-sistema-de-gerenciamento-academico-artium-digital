'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type TipoVinculo = 'PRESTADOR_SERVICO' | 'COLABORADOR';
interface Colaborador {
  id: string; nome: string; cpf: string; email: string | null; telefone: string | null;
  tipoVinculo: TipoVinculo; cargo: string | null; salarioBase: number | null;
  numeroDependentes: number; dataAdmissao: string; dataDemissao: string | null; ativo: boolean;
  banco: string | null; agencia: string | null; contaBancaria: string | null; observacoes: string | null;
}
type FormData = Omit<Colaborador, 'id'>;

const TIPO_LABEL: Record<TipoVinculo, string> = { PRESTADOR_SERVICO: 'Prestador de Serviço', COLABORADOR: 'Colaborador' };

const EMPTY: FormData = {
  nome: '', cpf: '', email: '', telefone: '', tipoVinculo: 'COLABORADOR', cargo: '',
  salarioBase: null, numeroDependentes: 0, dataAdmissao: '', dataDemissao: null, ativo: true,
  banco: '', agencia: '', contaBancaria: '', observacoes: '',
};

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});

function fmt(v: number | null) { return v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function fmtData(v: string | null) { return v ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(v)) : '—'; }

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}
function G({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}

function ColaboradorModal({ colaborador, onClose, onSave }: { colaborador: Colaborador | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(colaborador ? { ...colaborador } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | number | boolean | null) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body = {
        ...form,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        cargo: form.cargo || undefined,
        salarioBase: form.salarioBase || undefined,
        dataDemissao: form.dataDemissao || undefined,
        banco: form.banco || undefined,
        agencia: form.agencia || undefined,
        contaBancaria: form.contaBancaria || undefined,
        observacoes: form.observacoes || undefined,
      };
      if (colaborador) await apiFetch(`/cpagar/colaboradores/${colaborador.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/cpagar/colaboradores', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <G cols="2fr 1fr">
            <F label="Nome *"><input style={INPUT} value={form.nome} required onChange={e => set('nome', e.target.value)} /></F>
            <F label="CPF *"><input style={INPUT} value={form.cpf} required onChange={e => set('cpf', e.target.value)} /></F>
          </G>
          <G cols="1fr 1fr">
            <F label="Tipo de vínculo *">
              <select style={INPUT} value={form.tipoVinculo} onChange={e => set('tipoVinculo', e.target.value)}>
                {(Object.entries(TIPO_LABEL) as [TipoVinculo, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </F>
            <F label="Cargo"><input style={INPUT} value={form.cargo ?? ''} onChange={e => set('cargo', e.target.value)} /></F>
          </G>
          <G cols="1fr 1fr">
            <F label="E-mail"><input style={INPUT} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} /></F>
            <F label="Telefone"><input style={INPUT} value={form.telefone ?? ''} onChange={e => set('telefone', e.target.value)} /></F>
          </G>
          {form.tipoVinculo === 'COLABORADOR' && (
            <G cols="1fr 1fr">
              <F label="Salário base"><input style={INPUT} type="number" step="0.01" value={form.salarioBase ?? ''} onChange={e => set('salarioBase', e.target.value ? Number(e.target.value) : null)} /></F>
              <F label="Nº dependentes (IRRF)"><input style={INPUT} type="number" min={0} value={form.numeroDependentes} onChange={e => set('numeroDependentes', Number(e.target.value))} /></F>
            </G>
          )}
          <G cols="1fr 1fr">
            <F label="Data de admissão *"><input style={INPUT} type="date" value={form.dataAdmissao?.slice(0, 10) ?? ''} required onChange={e => set('dataAdmissao', e.target.value)} /></F>
            <F label="Data de demissão"><input style={INPUT} type="date" value={form.dataDemissao?.slice(0, 10) ?? ''} onChange={e => set('dataDemissao', e.target.value || null)} /></F>
          </G>
          <G cols="1fr 1fr 1fr">
            <F label="Banco"><input style={INPUT} value={form.banco ?? ''} onChange={e => set('banco', e.target.value)} /></F>
            <F label="Agência"><input style={INPUT} value={form.agencia ?? ''} onChange={e => set('agencia', e.target.value)} /></F>
            <F label="Conta"><input style={INPUT} value={form.contaBancaria ?? ''} onChange={e => set('contaBancaria', e.target.value)} /></F>
          </G>
          <F label="Observações">
            <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} />
          </F>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
            <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} />
            Ativo
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

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Colaborador | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setColaboradores(await apiFetch<Colaborador[]>(`/cpagar/colaboradores${filtroTipo ? `?tipoVinculo=${filtroTipo}` : ''}`)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [filtroTipo]);

  useEffect(() => { load(); }, [load]);

  async function remover(id: string) {
    if (!confirm('Excluir este colaborador?')) return;
    setDeleting(id);
    try { await apiFetch(`/cpagar/colaboradores/${id}`, { method: 'DELETE' }); setColaboradores(c => c.filter(x => x.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir'); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Colaboradores</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            Cadastro de prestadores de serviço e colaboradores internos — base pra folha de pagamento (CPagar).
            Professores usam o cadastro acadêmico já existente, com dados de folha em aba própria.
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Colaborador</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <select style={{ ...INPUT, width: 240 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {(Object.entries(TIPO_LABEL) as [TipoVinculo, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Nome', 'CPF', 'Tipo', 'Cargo', 'Salário base', 'Admissão', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colaboradores.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum colaborador cadastrado ainda.</td></tr>
              )}
              {colaboradores.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{c.cpf}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12 }}>{TIPO_LABEL[c.tipoVinculo]}</td>
                  <td style={{ padding: '10px 14px' }}>{c.cargo ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{fmt(c.salarioBase != null ? Number(c.salarioBase) : null)}</td>
                  <td style={{ padding: '10px 14px' }}>{fmtData(c.dataAdmissao)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.ativo ? '#d1fae5' : 'var(--gray-100)', color: c.ativo ? '#065f46' : 'var(--gray-500)' }}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
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
        <ColaboradorModal colaborador={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={load} />
      )}
    </div>
  );
}
