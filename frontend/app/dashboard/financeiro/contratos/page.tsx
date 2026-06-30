'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type Parcela = {
  id: string; numero: number; valor: number; dataVencimento: string;
  dataPagamento: string | null; valorPago: number | null;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'; formaPagamento: string | null;
};
type Contrato = {
  id: string; valorTotal: number; numeroParcelas: number; diaVencimento: number;
  status: string; observacoes: string | null; criadoEm: string;
  aluno: { id: string; nome: string; ra: string };
  periodoLetivo: { id: string; ano: number; semestre: number };
  parcelas: Parcela[];
};
type Aluno = { id: string; nome: string; ra: string };
type Periodo = { id: string; ano: number; semestre: number };

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: '#f59e0b', PAGO: '#10b981', VENCIDO: '#ef4444', CANCELADO: '#9ca3af',
  ATIVO: '#10b981', SUSPENSO: '#f59e0b', ENCERRADO: '#6b7280',
};

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('pt-BR'); }

function Badge({ s }: { s: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: (STATUS_COLOR[s] ?? '#e5e7eb') + '22', color: STATUS_COLOR[s] ?? '#374151' }}>{s}</span>;
}

// ── Modal Novo Contrato ────────────────────────────────────────────────────
function ModalNovoContrato({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [form, setForm] = useState({ alunoId: '', periodoLetivoId: '', valorTotal: '', numeroParcelas: '6', diaVencimento: '10', observacoes: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch<any>('/alunos?limit=500').then((d: any) => setAlunos(d.data ?? d));
    apiFetch<any>('/periodos-letivos').then((d: any) => setPeriodos(Array.isArray(d) ? d : d.data ?? []));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    if (!form.alunoId || !form.periodoLetivoId || !form.valorTotal) { setErr('Preencha todos os campos obrigatórios.'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/financeiro/contratos', {
        method: 'POST',
        body: JSON.stringify({ alunoId: form.alunoId, periodoLetivoId: form.periodoLetivoId, valorTotal: parseFloat(form.valorTotal), numeroParcelas: parseInt(form.numeroParcelas), diaVencimento: parseInt(form.diaVencimento), observacoes: form.observacoes || undefined }),
      });
      onSaved();
    } catch (e: any) { setErr(e.message ?? 'Erro ao salvar'); } finally { setSaving(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
  const box: React.CSSProperties = { background: '#fff', borderRadius: 10, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' };
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Novo Contrato</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>Aluno *</label>
            <select style={inp} value={form.alunoId} onChange={set('alunoId')}>
              <option value="">Selecione...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.ra})</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Período Letivo *</label>
            <select style={inp} value={form.periodoLetivoId} onChange={set('periodoLetivoId')}>
              <option value="">Selecione...</option>
              {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Valor Total (R$) *</label>
              <input style={inp} type="number" step="0.01" placeholder="0,00" value={form.valorTotal} onChange={set('valorTotal')} />
            </div>
            <div>
              <label style={lbl}>Nº Parcelas</label>
              <input style={inp} type="number" min="1" max="24" value={form.numeroParcelas} onChange={set('numeroParcelas')} />
            </div>
            <div>
              <label style={lbl}>Dia Vencimento</label>
              <input style={inp} type="number" min="1" max="28" value={form.diaVencimento} onChange={set('diaVencimento')} />
            </div>
          </div>
          <div>
            <label style={lbl}>Observações</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={form.observacoes} onChange={set('observacoes')} />
          </div>
          {err && <div style={{ color: '#ef4444', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button style={{ padding: '7px 16px', border: '1px solid #d1d5db', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 13 }} onClick={onClose}>Cancelar</button>
            <button style={{ padding: '7px 16px', border: 'none', borderRadius: 5, background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Criar Contrato'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Pagar Parcela ────────────────────────────────────────────────────
function ModalPagar({ parcela, onClose, onSaved }: { parcela: Parcela; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ valorPago: String(parcela.valor), formaPagamento: 'PIX', dataPagamento: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  async function pagar() {
    setSaving(true);
    try {
      await apiFetch(`/financeiro/parcelas/${parcela.id}/pagar`, { method: 'PATCH', body: JSON.stringify({ valorPago: parseFloat(form.valorPago), formaPagamento: form.formaPagamento, dataPagamento: form.dataPagamento }) });
      onSaved();
    } finally { setSaving(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
  const box: React.CSSProperties = { background: '#fff', borderRadius: 10, padding: 24, width: 360 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Registrar Pagamento — Parcela {parcela.numero}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Valor Pago (R$)</label><input style={inp} type="number" step="0.01" value={form.valorPago} onChange={set('valorPago')} /></div>
          <div><label style={lbl}>Forma de Pagamento</label>
            <select style={inp} value={form.formaPagamento} onChange={set('formaPagamento')}>
              {['PIX', 'BOLETO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'TRANSFERENCIA'].map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Data do Pagamento</label><input style={inp} type="date" value={form.dataPagamento} onChange={set('dataPagamento')} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button style={{ padding: '7px 14px', border: '1px solid #d1d5db', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 13 }} onClick={onClose}>Cancelar</button>
            <button style={{ padding: '7px 14px', border: 'none', borderRadius: 5, background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={pagar} disabled={saving}>{saving ? '...' : 'Confirmar Pagamento'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pagarParcela, setPagarParcela] = useState<Parcela | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Contrato[]>('/financeiro/contratos')
      .then(d => setContratos(Array.isArray(d) ? d : (d as any).data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contratos.filter(c =>
    c.aluno.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.aluno.ra.includes(search)
  );

  const totalPago = (c: Contrato) => c.parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + (p.valorPago ?? 0), 0);
  const totalVencido = (c: Contrato) => c.parcelas.filter(p => p.status === 'VENCIDO').reduce((s, p) => s + p.valor, 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {showNovo && <ModalNovoContrato onClose={() => setShowNovo(false)} onSaved={() => { setShowNovo(false); load(); }} />}
      {pagarParcela && <ModalPagar parcela={pagarParcela} onClose={() => setPagarParcela(null)} onSaved={() => { setPagarParcela(null); load(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Contratos / Mensalidades</h2>
        <button style={{ padding: '7px 16px', border: 'none', borderRadius: 5, background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => setShowNovo(true)}>+ Novo Contrato</button>
      </div>

      <input
        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 14, boxSizing: 'border-box' }}
        placeholder="Buscar por nome ou RA..."
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {loading ? <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Carregando...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Nenhum contrato encontrado.</div>}
          {filtered.map(c => {
            const isOpen = expanded === c.id;
            const pago = totalPago(c);
            const vencido = totalVencido(c);
            return (
              <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: 12 }} onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.aluno.nome} <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 12 }}>({c.aluno.ra})</span></div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{c.periodoLetivo.ano}/{c.periodoLetivo.semestre} · {c.numeroParcelas}x de {fmt(c.valorTotal / c.numeroParcelas)} · venc. dia {c.diaVencimento}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(c.valorTotal)}</div>
                    <div style={{ color: '#10b981' }}>{fmt(pago)} pago</div>
                    {vencido > 0 && <div style={{ color: '#ef4444' }}>{fmt(vencido)} vencido</div>}
                  </div>
                  <Badge s={c.status} />
                  <span style={{ color: '#9ca3af', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Parcelas */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '0 16px 12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead>
                        <tr>
                          {['Nº', 'Vencimento', 'Valor', 'Status', 'Pagamento', 'Forma', 'Ação'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {c.parcelas.map(p => (
                          <tr key={p.id}>
                            <td style={{ padding: '6px 8px', fontSize: 13 }}>{p.numero}</td>
                            <td style={{ padding: '6px 8px', fontSize: 13 }}>{fmtDate(p.dataVencimento)}</td>
                            <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>{fmt(p.valor)}</td>
                            <td style={{ padding: '6px 8px' }}><Badge s={p.status} /></td>
                            <td style={{ padding: '6px 8px', fontSize: 12, color: '#6b7280' }}>{p.dataPagamento ? fmtDate(p.dataPagamento) : '—'}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12, color: '#6b7280' }}>{p.formaPagamento ?? '—'}</td>
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
