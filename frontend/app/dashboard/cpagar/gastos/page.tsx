'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Categoria { id: string; nome: string; descricao: string | null; ativa: boolean; }
interface GastoFixo { id: string; categoriaId: string; categoria: { id: string; nome: string }; descricao: string; valorMensal: number; diaVencimento: number; ativo: boolean; }
interface GastoVariavel { id: string; categoriaId: string; categoria: { id: string; nome: string }; descricao: string; valor: number; data: string; observacoes: string | null; }

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'ghost' | 'danger') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function fmtData(v: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(v)); }

function ModalCategoria({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [nome, setNome] = useState(''); const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try { await apiFetch('/cpagar/categorias-despesa', { method: 'POST', body: JSON.stringify({ nome, descricao: descricao || undefined }) }); onSave(); onClose(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar'); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 380, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Nova Categoria de Despesa</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={LABEL}>Nome *</label><input style={INPUT} required value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div><label style={LABEL}>Descrição</label><input style={INPUT} value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
          {error && <p style={{ color: '#dc2626', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalGastoFixo({ categorias, onClose, onSave }: { categorias: Categoria[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ categoriaId: '', descricao: '', valorMensal: '', diaVencimento: '10' });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch('/cpagar/gastos-fixos', { method: 'POST', body: JSON.stringify({ categoriaId: form.categoriaId, descricao: form.descricao, valorMensal: Number(form.valorMensal), diaVencimento: Number(form.diaVencimento) }) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar'); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Novo Gasto Fixo</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={LABEL}>Categoria *</label>
            <select style={INPUT} required value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}>
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div><label style={LABEL}>Descrição *</label><input style={INPUT} required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>Valor mensal *</label><input style={INPUT} type="number" step="0.01" required value={form.valorMensal} onChange={e => setForm(f => ({ ...f, valorMensal: e.target.value }))} /></div>
            <div><label style={LABEL}>Dia vencimento</label><input style={INPUT} type="number" min={1} max={28} value={form.diaVencimento} onChange={e => setForm(f => ({ ...f, diaVencimento: e.target.value }))} /></div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalGastoVariavel({ categorias, onClose, onSave }: { categorias: Categoria[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ categoriaId: '', descricao: '', valor: '', data: new Date().toISOString().slice(0, 10), observacoes: '' });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch('/cpagar/gastos-variaveis', { method: 'POST', body: JSON.stringify({ categoriaId: form.categoriaId, descricao: form.descricao, valor: Number(form.valor), data: form.data, observacoes: form.observacoes || undefined }) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar'); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Novo Gasto Variável</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={LABEL}>Categoria *</label>
            <select style={INPUT} required value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}>
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div><label style={LABEL}>Descrição *</label><input style={INPUT} required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>Valor *</label><input style={INPUT} type="number" step="0.01" required value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
            <div><label style={LABEL}>Data *</label><input style={INPUT} type="date" required value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
          </div>
          <div><label style={LABEL}>Observações</label><textarea style={{ ...INPUT, minHeight: 50, resize: 'vertical' }} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          {error && <p style={{ color: '#dc2626', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GastosPage() {
  const [aba, setAba] = useState<'fixos' | 'variaveis' | 'categorias'>('fixos');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [gastosFixos, setGastosFixos] = useState<GastoFixo[]>([]);
  const [gastosVariaveis, setGastosVariaveis] = useState<GastoVariavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'categoria' | 'fixo' | 'variavel' | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch<Categoria[]>('/cpagar/categorias-despesa').catch(() => []),
      apiFetch<GastoFixo[]>('/cpagar/gastos-fixos').catch(() => []),
      apiFetch<GastoVariavel[]>('/cpagar/gastos-variaveis').catch(() => []),
    ]).then(([c, f, v]) => { setCategorias(c); setGastosFixos(f); setGastosVariaveis(v); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalFixos = gastosFixos.filter(g => g.ativo).reduce((s, g) => s + Number(g.valorMensal), 0);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Gastos Fixos e Variáveis</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Controle de despesas da instituição por categoria.</p>
        </div>
        {aba === 'categorias' && <button style={BTN('primary')} onClick={() => setModal('categoria')}>+ Nova Categoria</button>}
        {aba === 'fixos' && <button style={BTN('primary')} onClick={() => setModal('fixo')}>+ Novo Gasto Fixo</button>}
        {aba === 'variaveis' && <button style={BTN('primary')} onClick={() => setModal('variavel')}>+ Novo Gasto Variável</button>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--gray-200)' }}>
        {([['fixos', 'Gastos Fixos'], ['variaveis', 'Gastos Variáveis'], ['categorias', 'Categorias']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setAba(v)}
            style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              borderBottom: aba === v ? '2px solid var(--accent-blue-text)' : '2px solid transparent',
              color: aba === v ? 'var(--accent-blue-text)' : 'var(--gray-500)' }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}

      {!loading && aba === 'fixos' && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Total mensal ativo: {fmt(totalFixos)}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--gray-50)' }}>{['Descrição', 'Categoria', 'Valor mensal', 'Dia venc.', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
            <tbody>
              {gastosFixos.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum gasto fixo cadastrado.</td></tr>}
              {gastosFixos.map((g, i) => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px' }}>{g.descricao}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12 }}>{g.categoria.nome}</td>
                  <td style={{ padding: '10px 14px' }}>{fmt(Number(g.valorMensal))}</td>
                  <td style={{ padding: '10px 14px' }}>{g.diaVencimento}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: g.ativo ? '#d1fae5' : 'var(--gray-100)', color: g.ativo ? '#065f46' : 'var(--gray-500)' }}>{g.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && aba === 'variaveis' && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--gray-50)' }}>{['Data', 'Descrição', 'Categoria', 'Valor', 'Observações'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
            <tbody>
              {gastosVariaveis.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum gasto variável lançado.</td></tr>}
              {gastosVariaveis.map((g, i) => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px' }}>{fmtData(g.data)}</td>
                  <td style={{ padding: '10px 14px' }}>{g.descricao}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12 }}>{g.categoria.nome}</td>
                  <td style={{ padding: '10px 14px' }}>{fmt(Number(g.valor))}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{g.observacoes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && aba === 'categorias' && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--gray-50)' }}>{['Nome', 'Descrição', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
            <tbody>
              {categorias.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma categoria cadastrada.</td></tr>}
              {categorias.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12 }}>{c.descricao ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.ativa ? '#d1fae5' : 'var(--gray-100)', color: c.ativa ? '#065f46' : 'var(--gray-500)' }}>{c.ativa ? 'Ativa' : 'Inativa'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'categoria' && <ModalCategoria onClose={() => setModal(null)} onSave={load} />}
      {modal === 'fixo' && <ModalGastoFixo categorias={categorias} onClose={() => setModal(null)} onSave={load} />}
      {modal === 'variavel' && <ModalGastoVariavel categorias={categorias} onClose={() => setModal(null)} onSave={load} />}
    </div>
  );
}
