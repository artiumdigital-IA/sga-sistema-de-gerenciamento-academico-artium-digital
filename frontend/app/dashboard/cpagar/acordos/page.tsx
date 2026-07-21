'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { formatarData } from '@/lib/format';

type ParcelaPagar = {
  id: string; numero: number; valor: number; dataVencimento: string;
  dataPagamento: string | null; valorPago: number | null;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'; formaPagamento: string | null;
};
type AcordoPagar = {
  id: string; fornecedorNome: string; cnpjCpf: string | null; valorTotal: number;
  numeroParcelas: number; diaVencimento: number; status: string; observacoes: string | null;
  parcelas: ParcelaPagar[];
};

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: '#f59e0b', PAGO: '#10b981', VENCIDO: '#ef4444', CANCELADO: 'var(--gray-400)',
  ATIVO: '#10b981', CONCLUIDO: 'var(--gray-500)',
};

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function Badge({ s }: { s: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: (STATUS_COLOR[s] ?? 'var(--gray-200)') + '22', color: STATUS_COLOR[s] ?? 'var(--gray-700)' }}>{s}</span>;
}

function ModalNovoAcordo({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fornecedorNome: '', cnpjCpf: '', valorTotal: '', numeroParcelas: '6', diaVencimento: '10', observacoes: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    if (!form.fornecedorNome || !form.valorTotal) { setErr('Preencha fornecedor e valor total.'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/cpagar/acordos', {
        method: 'POST',
        body: JSON.stringify({
          fornecedorNome: form.fornecedorNome, cnpjCpf: form.cnpjCpf || undefined,
          valorTotal: parseFloat(form.valorTotal), numeroParcelas: parseInt(form.numeroParcelas),
          diaVencimento: parseInt(form.diaVencimento), observacoes: form.observacoes || undefined,
        }),
      });
      onSaved();
    } catch (e: any) { setErr(e.message ?? 'Erro ao salvar'); } finally { setSaving(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
  const box: React.CSSProperties = { background: 'var(--white)', borderRadius: 10, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' };
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Novo Acordo (Contas a Pagar)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Fornecedor / Prestador *</label><input style={inp} value={form.fornecedorNome} onChange={set('fornecedorNome')} /></div>
          <div><label style={lbl}>CNPJ/CPF</label><input style={inp} value={form.cnpjCpf} onChange={set('cnpjCpf')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><label style={lbl}>Valor Total (R$) *</label><input style={inp} type="number" step="0.01" value={form.valorTotal} onChange={set('valorTotal')} /></div>
            <div><label style={lbl}>Nº Parcelas</label><input style={inp} type="number" min="1" max="60" value={form.numeroParcelas} onChange={set('numeroParcelas')} /></div>
            <div><label style={lbl}>Dia Vencimento</label><input style={inp} type="number" min="1" max="28" value={form.diaVencimento} onChange={set('diaVencimento')} /></div>
          </div>
          <div><label style={lbl}>Observações</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={form.observacoes} onChange={set('observacoes')} /></div>
          {err && <div style={{ color: '#ef4444', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button style={{ padding: '7px 16px', border: '1px solid var(--gray-300)', borderRadius: 5, background: 'var(--white)', cursor: 'pointer', fontSize: 13 }} onClick={onClose}>Cancelar</button>
            <button style={{ padding: '7px 16px', border: 'none', borderRadius: 5, background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Criar Acordo'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalPagar({ parcela, onClose, onSaved }: { parcela: ParcelaPagar; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ valorPago: String(parcela.valor), formaPagamento: 'PIX', dataPagamento: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };

  async function pagar() {
    setSaving(true);
    try {
      await apiFetch(`/cpagar/acordos/parcelas/${parcela.id}/pagar`, { method: 'PATCH', body: JSON.stringify({ valorPago: parseFloat(form.valorPago), formaPagamento: form.formaPagamento, dataPagamento: form.dataPagamento }) });
      onSaved();
    } finally { setSaving(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
  const box: React.CSSProperties = { background: 'var(--white)', borderRadius: 10, padding: 24, width: 360 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Registrar Pagamento — Parcela {parcela.numero}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Valor Pago (R$)</label><input style={inp} type="number" step="0.01" value={form.valorPago} onChange={set('valorPago')} /></div>
          <div><label style={lbl}>Forma de Pagamento</label>
            <select style={inp} value={form.formaPagamento} onChange={set('formaPagamento')}>
              {['PIX', 'BOLETO', 'TED', 'DINHEIRO', 'TRANSFERENCIA'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Data do Pagamento</label><input style={inp} type="date" value={form.dataPagamento} onChange={set('dataPagamento')} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button style={{ padding: '7px 14px', border: '1px solid var(--gray-300)', borderRadius: 5, background: 'var(--white)', cursor: 'pointer', fontSize: 13 }} onClick={onClose}>Cancelar</button>
            <button style={{ padding: '7px 14px', border: 'none', borderRadius: 5, background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={pagar} disabled={saving}>{saving ? '...' : 'Confirmar Pagamento'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcordosPage() {
  const [acordos, setAcordos] = useState<AcordoPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pagarParcela, setPagarParcela] = useState<ParcelaPagar | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<AcordoPagar[]>('/cpagar/acordos').then(setAcordos).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = acordos.filter(a => a.fornecedorNome.toLowerCase().includes(search.toLowerCase()));
  const totalPago = (a: AcordoPagar) => a.parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + (p.valorPago ?? 0), 0);
  const totalVencido = (a: AcordoPagar) => a.parcelas.filter(p => p.status === 'VENCIDO').reduce((s, p) => s + p.valor, 0);

  return (
    <div style={{ padding: '24px 28px' }}>
      {showNovo && <ModalNovoAcordo onClose={() => setShowNovo(false)} onSaved={() => { setShowNovo(false); load(); }} />}
      {pagarParcela && <ModalPagar parcela={pagarParcela} onClose={() => setPagarParcela(null)} onSaved={() => { setPagarParcela(null); load(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Acordos (Contas a Pagar)</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--gray-500)' }}>Parcelamento de dívida com fornecedor/prestador.</p>
        </div>
        <button style={{ padding: '7px 16px', border: 'none', borderRadius: 5, background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => setShowNovo(true)}>+ Novo Acordo</button>
      </div>

      <input
        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginBottom: 14, boxSizing: 'border-box' }}
        placeholder="Buscar por fornecedor..."
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>Carregando...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum acordo encontrado.</div>}
          {filtered.map(a => {
            const isOpen = expanded === a.id;
            const pago = totalPago(a);
            const vencido = totalVencido(a);
            return (
              <div key={a.id} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: 12 }} onClick={() => setExpanded(isOpen ? null : a.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.fornecedorNome} {a.cnpjCpf && <span style={{ color: 'var(--gray-500)', fontWeight: 400, fontSize: 12 }}>({a.cnpjCpf})</span>}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{a.numeroParcelas}x de {fmt(a.valorTotal / a.numeroParcelas)} · venc. dia {a.diaVencimento}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(a.valorTotal)}</div>
                    <div style={{ color: '#10b981' }}>{fmt(pago)} pago</div>
                    {vencido > 0 && <div style={{ color: '#ef4444' }}>{fmt(vencido)} vencido</div>}
                  </div>
                  <Badge s={a.status} />
                  <span style={{ color: 'var(--gray-400)', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--gray-100)', padding: '0 16px 12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead>
                        <tr>
                          {['Nº', 'Vencimento', 'Valor', 'Status', 'Pagamento', 'Forma', 'Ação'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-100)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {a.parcelas.map(p => (
                          <tr key={p.id}>
                            <td style={{ padding: '6px 8px', fontSize: 13 }}>{p.numero}</td>
                            <td style={{ padding: '6px 8px', fontSize: 13 }}>{formatarData(p.dataVencimento)}</td>
                            <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>{fmt(p.valor)}</td>
                            <td style={{ padding: '6px 8px' }}><Badge s={p.status} /></td>
                            <td style={{ padding: '6px 8px', fontSize: 12, color: 'var(--gray-500)' }}>{p.dataPagamento ? formatarData(p.dataPagamento) : '—'}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12, color: 'var(--gray-500)' }}>{p.formaPagamento ?? '—'}</td>
                            <td style={{ padding: '6px 8px' }}>
                              {(p.status === 'PENDENTE' || p.status === 'VENCIDO') && (
                                <button style={{ padding: '3px 10px', border: 'none', borderRadius: 4, background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                  onClick={() => setPagarParcela(p)}>
                                  Pagar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
