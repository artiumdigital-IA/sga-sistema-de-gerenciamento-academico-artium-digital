'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type TipoConta = 'CORRENTE' | 'POUPANCA' | 'PAGAMENTO';
type LayoutCnab = 'CNAB400' | 'CNAB240';
interface Conta {
  id: string; banco: string; agencia: string; numeroConta: string; tipoConta: TipoConta;
  titular: string; cnpjCpfTitular: string | null; saldoInicial: number; ativa: boolean; observacoes: string | null;
  cnabHabilitado: boolean; codigoBancoFebraban: string | null; codigoCedente: string | null;
  carteira: string | null; variacaoCarteira: string | null; layoutCnab: LayoutCnab | null;
}
type FormData = Omit<Conta, 'id'>;

const TIPO_LABEL: Record<TipoConta, string> = { CORRENTE: 'Corrente', POUPANCA: 'Poupança', PAGAMENTO: 'Pagamento' };

// Bancos com adapter CNAB implementado hoje (ver backend/src/financial/cnab/bancos/bancos.util.ts) —
// os outros 3 do escopo (Safra, Santander, Caixa) ainda ficam disponíveis pra cadastro/preparo, mas
// a emissão de boleto de fato só funciona pro Itaú até a Fase 4 do módulo CNAB.
const BANCOS_FEBRABAN: { codigo: string; nome: string }[] = [
  { codigo: '341', nome: '341 — Itaú' },
  { codigo: '422', nome: '422 — Safra' },
  { codigo: '033', nome: '033 — Santander' },
  { codigo: '104', nome: '104 — Caixa Econômica Federal' },
];

const EMPTY: FormData = {
  banco: '', agencia: '', numeroConta: '', tipoConta: 'CORRENTE',
  titular: '', cnpjCpfTitular: '', saldoInicial: 0, ativa: true, observacoes: '',
  cnabHabilitado: false, codigoBancoFebraban: '', codigoCedente: '', carteira: '', variacaoCarteira: '', layoutCnab: 'CNAB400',
};

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}
function G({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}

function ContaModal({ conta, onClose, onSave }: { conta: Conta | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(conta ? { ...conta } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body = {
        ...form,
        cnpjCpfTitular: form.cnpjCpfTitular || undefined,
        observacoes: form.observacoes || undefined,
        codigoBancoFebraban: form.codigoBancoFebraban || undefined,
        codigoCedente: form.codigoCedente || undefined,
        carteira: form.carteira || undefined,
        variacaoCarteira: form.variacaoCarteira || undefined,
      };
      if (conta) await apiFetch(`/financeiro/contas-bancarias/${conta.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/financeiro/contas-bancarias', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{conta ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <F label="Banco *"><input style={INPUT} value={form.banco} required onChange={e => set('banco', e.target.value)} /></F>
          <G cols="1fr 1fr">
            <F label="Agência *"><input style={INPUT} value={form.agencia} required onChange={e => set('agencia', e.target.value)} /></F>
            <F label="Conta *"><input style={INPUT} value={form.numeroConta} required onChange={e => set('numeroConta', e.target.value)} /></F>
          </G>
          <G cols="1fr 1fr">
            <F label="Tipo">
              <select style={INPUT} value={form.tipoConta} onChange={e => set('tipoConta', e.target.value)}>
                {(Object.entries(TIPO_LABEL) as [TipoConta, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </F>
            <F label="Saldo inicial">
              <input style={INPUT} type="number" step="0.01" value={form.saldoInicial} onChange={e => set('saldoInicial', Number(e.target.value))} />
            </F>
          </G>
          <F label="Titular *"><input style={INPUT} value={form.titular} required onChange={e => set('titular', e.target.value)} /></F>
          <F label="CNPJ/CPF do titular"><input style={INPUT} value={form.cnpjCpfTitular ?? ''} onChange={e => set('cnpjCpfTitular', e.target.value)} /></F>
          <F label="Observações">
            <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} />
          </F>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
            <input type="checkbox" checked={form.ativa} onChange={e => set('ativa', e.target.checked)} />
            Conta ativa
          </label>

          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 12, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: form.cnabHabilitado ? 12 : 0 }}>
              <input type="checkbox" checked={form.cnabHabilitado} onChange={e => set('cnabHabilitado', e.target.checked)} />
              Habilitada pra CNAB (emissão de boleto)
            </label>

            {form.cnabHabilitado && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <G cols="1fr 1fr">
                  <F label="Banco (FEBRABAN) *">
                    <select style={INPUT} value={form.codigoBancoFebraban ?? ''} required={form.cnabHabilitado} onChange={e => set('codigoBancoFebraban', e.target.value)}>
                      <option value="">Selecione...</option>
                      {BANCOS_FEBRABAN.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                    </select>
                  </F>
                  <F label="Layout">
                    <select style={INPUT} value={form.layoutCnab ?? 'CNAB400'} onChange={e => set('layoutCnab', e.target.value)}>
                      <option value="CNAB400">CNAB 400</option>
                      <option value="CNAB240">CNAB 240</option>
                    </select>
                  </F>
                </G>
                <G cols="1fr 1fr">
                  <F label="Código do cedente (convênio) *">
                    <input style={INPUT} value={form.codigoCedente ?? ''} required={form.cnabHabilitado} onChange={e => set('codigoCedente', e.target.value)} />
                  </F>
                  <F label="Carteira *">
                    <input style={INPUT} value={form.carteira ?? ''} required={form.cnabHabilitado} onChange={e => set('carteira', e.target.value)} />
                  </F>
                </G>
                <F label="Variação da carteira">
                  <input style={INPUT} value={form.variacaoCarteira ?? ''} onChange={e => set('variacaoCarteira', e.target.value)} />
                </F>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray-500)' }}>
                  Dados fornecidos pelo banco na homologação do convênio de cobrança. Hoje só o Itaú
                  (341) tem emissão de boleto implementada.
                </p>
              </div>
            )}
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

export default function ContasBancariasPage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Conta | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setContas(await apiFetch<Conta[]>('/financeiro/contas-bancarias')); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remover(id: string) {
    if (!confirm('Excluir esta conta bancária?')) return;
    setDeleting(id);
    try { await apiFetch(`/financeiro/contas-bancarias/${id}`, { method: 'DELETE' }); setContas(c => c.filter(x => x.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir'); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Contas Bancárias</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            Cadastro interno das contas da instituição — base pra conciliação financeira.
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Nova Conta</button>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Banco', 'Agência', 'Conta', 'Tipo', 'Titular', 'Saldo inicial', 'Status', 'CNAB', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contas.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma conta cadastrada ainda.</td></tr>
              )}
              {contas.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.banco}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{c.agencia}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{c.numeroConta}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12 }}>{TIPO_LABEL[c.tipoConta]}</td>
                  <td style={{ padding: '10px 14px' }}>{c.titular}</td>
                  <td style={{ padding: '10px 14px' }}>{fmt(Number(c.saldoInicial))}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.ativa ? '#d1fae5' : 'var(--gray-100)', color: c.ativa ? '#065f46' : 'var(--gray-500)' }}>
                      {c.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {c.cnabHabilitado ? (
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>
                        {c.codigoBancoFebraban ?? 'sim'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>—</span>
                    )}
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
        <ContaModal conta={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={load} />
      )}
    </div>
  );
}
