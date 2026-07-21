'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Colaborador { id: string; nome: string; cpf: string; tipoVinculo: string; ativo: boolean; }
interface Pagamento {
  id: string; data: string; descricaoServico: string; numeroNotaFiscal: string | null;
  valorBruto: number; valorIssRetido: number | null; valorLiquido: number; status: string;
  colaborador: { id: string; nome: string; cpf: string };
}
type FormData = { colaboradorId: string; data: string; descricaoServico: string; numeroNotaFiscal: string; valorBruto: string; valorIssRetido: string };

const EMPTY: FormData = { colaboradorId: '', data: new Date().toISOString().slice(0, 10), descricaoServico: '', numeroNotaFiscal: '', valorBruto: '', valorIssRetido: '' };

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'ghost' | 'danger') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  PENDENTE: { bg: 'var(--gray-100)', fg: 'var(--gray-500)' }, PAGO: { bg: '#d1fae5', fg: '#065f46' },
  VENCIDO: { bg: '#fee2e2', fg: '#991b1b' }, CANCELADO: { bg: 'var(--gray-100)', fg: 'var(--gray-400)' },
};
function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function fmtData(v: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(v)); }

function NovoModal({ prestadores, onClose, onSave }: { prestadores: Colaborador[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch('/cpagar/pagamentos-prestador', {
        method: 'POST',
        body: JSON.stringify({
          colaboradorId: form.colaboradorId,
          data: form.data,
          descricaoServico: form.descricaoServico,
          numeroNotaFiscal: form.numeroNotaFiscal || undefined,
          valorBruto: Number(form.valorBruto),
          valorIssRetido: form.valorIssRetido ? Number(form.valorIssRetido) : undefined,
        }),
      });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Novo Pagamento de Prestador</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={LABEL}>Prestador *</label>
            <select style={INPUT} required value={form.colaboradorId} onChange={e => setForm(f => ({ ...f, colaboradorId: e.target.value }))}>
              <option value="">Selecione...</option>
              {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>Data *</label><input style={INPUT} type="date" required value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div><label style={LABEL}>Nota fiscal</label><input style={INPUT} value={form.numeroNotaFiscal} onChange={e => setForm(f => ({ ...f, numeroNotaFiscal: e.target.value }))} /></div>
          </div>
          <div><label style={LABEL}>Descrição do serviço *</label><input style={INPUT} required value={form.descricaoServico} onChange={e => setForm(f => ({ ...f, descricaoServico: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>Valor bruto *</label><input style={INPUT} type="number" step="0.01" required value={form.valorBruto} onChange={e => setForm(f => ({ ...f, valorBruto: e.target.value }))} /></div>
            <div><label style={LABEL}>ISS retido</label><input style={INPUT} type="number" step="0.01" value={form.valorIssRetido} onChange={e => setForm(f => ({ ...f, valorIssRetido: e.target.value }))} /></div>
          </div>
          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PrestadoresPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [prestadores, setPrestadores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Pagamento[]>('/cpagar/pagamentos-prestador').then(setPagamentos).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { apiFetch<Colaborador[]>('/cpagar/colaboradores?tipoVinculo=PRESTADOR_SERVICO&ativo=true').then(setPrestadores).catch(() => {}); }, []);

  async function marcarPago(id: string) {
    try { await apiFetch(`/cpagar/pagamentos-prestador/${id}/pagar`, { method: 'PATCH' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erro ao marcar pago'); }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Prestadores de Serviço</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            Pagamentos avulsos, sem retenção de INSS/IRRF (a maioria emite nota fiscal como PJ) — ISS retido é opcional.
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModalNovo(true)}>+ Novo Pagamento</button>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Prestador', 'Data', 'Serviço', 'NF', 'Bruto', 'ISS', 'Líquido', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagamentos.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum pagamento registrado ainda.</td></tr>
              )}
              {pagamentos.map((p, i) => {
                const s = STATUS_COLOR[p.status] ?? STATUS_COLOR.PENDENTE;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.colaborador.nome}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtData(p.data)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{p.descricaoServico}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{p.numeroNotaFiscal ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{fmt(Number(p.valorBruto))}</td>
                    <td style={{ padding: '10px 14px' }}>{p.valorIssRetido != null ? fmt(Number(p.valorIssRetido)) : '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{fmt(Number(p.valorLiquido))}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.fg }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {p.status === 'PENDENTE' && <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => marcarPago(p.id)}>Marcar pago</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalNovo && <NovoModal prestadores={prestadores} onClose={() => setModalNovo(false)} onSave={load} />}
    </div>
  );
}
