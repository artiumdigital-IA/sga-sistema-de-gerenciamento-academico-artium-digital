'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface FaixaInss { ordem: number; limiteInicial: number; limiteFinal: number | null; aliquota: number; }
interface FaixaIrrf extends FaixaInss { parcelaDeduzir: number; }
interface TabelaInss { id: string; vigenciaInicio: string; ativa: boolean; faixas: FaixaInss[]; }
interface TabelaIrrf { id: string; vigenciaInicio: string; ativa: boolean; valorDeducaoPorDependente: number; faixas: FaixaIrrf[]; }

const INPUT: React.CSSProperties = { padding: '6px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12.5, boxSizing: 'border-box', width: '100%' };
const BTN = (v: 'primary' | 'ghost' | 'danger') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, flex: 1, minWidth: 380 };
function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

function ModalInss({ tabela, onClose, onSave }: { tabela: TabelaInss; onClose: () => void; onSave: () => void }) {
  const [faixas, setFaixas] = useState<FaixaInss[]>(tabela.faixas.map(f => ({ ...f })));
  const [vigenciaInicio, setVigenciaInicio] = useState(tabela.vigenciaInicio.slice(0, 10));
  const [ativa, setAtiva] = useState(tabela.ativa);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setFaixa(i: number, campo: keyof FaixaInss, valor: number | null) {
    setFaixas(fs => fs.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f));
  }
  function addFaixa() {
    const ultima = faixas[faixas.length - 1];
    setFaixas(fs => [...fs, { ordem: fs.length + 1, limiteInicial: ultima?.limiteFinal ?? 0, limiteFinal: null, aliquota: 0 }]);
  }
  function removerFaixa(i: number) {
    setFaixas(fs => fs.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, ordem: idx + 1 })));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch(`/cpagar/tabelas-inss/${tabela.id}`, { method: 'PATCH', body: JSON.stringify({ vigenciaInicio, ativa, faixas }) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Editar Tabela de INSS</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Vigência a partir de</label>
              <input style={INPUT} type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 20 }}>
              <input type="checkbox" checked={ativa} onChange={e => setAtiva(e.target.checked)} /> Tabela ativa
            </label>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>{['Faixa', 'Limite inicial', 'Limite final (vazio = sem teto)', 'Alíquota %', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 11, color: 'var(--gray-500)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {faixas.map((f, i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 6px' }}>{f.ordem}</td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.limiteInicial} onChange={e => setFaixa(i, 'limiteInicial', Number(e.target.value))} /></td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.limiteFinal ?? ''} onChange={e => setFaixa(i, 'limiteFinal', e.target.value ? Number(e.target.value) : null)} /></td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.aliquota} onChange={e => setFaixa(i, 'aliquota', Number(e.target.value))} /></td>
                  <td style={{ padding: '3px 6px' }}><button type="button" style={{ ...BTN('danger'), padding: '3px 8px', fontSize: 11 }} onClick={() => removerFaixa(i)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" style={{ ...BTN('ghost'), alignSelf: 'flex-start', fontSize: 12, padding: '4px 10px' }} onClick={addFaixa}>+ Faixa</button>

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

function ModalIrrf({ tabela, onClose, onSave }: { tabela: TabelaIrrf; onClose: () => void; onSave: () => void }) {
  const [faixas, setFaixas] = useState<FaixaIrrf[]>(tabela.faixas.map(f => ({ ...f })));
  const [vigenciaInicio, setVigenciaInicio] = useState(tabela.vigenciaInicio.slice(0, 10));
  const [ativa, setAtiva] = useState(tabela.ativa);
  const [deducaoDependente, setDeducaoDependente] = useState(tabela.valorDeducaoPorDependente);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setFaixa(i: number, campo: keyof FaixaIrrf, valor: number | null) {
    setFaixas(fs => fs.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f));
  }
  function addFaixa() {
    const ultima = faixas[faixas.length - 1];
    setFaixas(fs => [...fs, { ordem: fs.length + 1, limiteInicial: ultima?.limiteFinal ?? 0, limiteFinal: null, aliquota: 0, parcelaDeduzir: 0 }]);
  }
  function removerFaixa(i: number) {
    setFaixas(fs => fs.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, ordem: idx + 1 })));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch(`/cpagar/tabelas-irrf/${tabela.id}`, { method: 'PATCH', body: JSON.stringify({ vigenciaInicio, ativa, valorDeducaoPorDependente: deducaoDependente, faixas }) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Editar Tabela de IRRF</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Vigência a partir de</label>
              <input style={INPUT} type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Dedução por dependente</label>
              <input style={INPUT} type="number" step="0.01" value={deducaoDependente} onChange={e => setDeducaoDependente(Number(e.target.value))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 20 }}>
              <input type="checkbox" checked={ativa} onChange={e => setAtiva(e.target.checked)} /> Tabela ativa
            </label>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>{['Faixa', 'Limite inicial', 'Limite final (vazio = sem teto)', 'Alíquota %', 'Parcela a deduzir', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 11, color: 'var(--gray-500)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {faixas.map((f, i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 6px' }}>{f.ordem}</td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.limiteInicial} onChange={e => setFaixa(i, 'limiteInicial', Number(e.target.value))} /></td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.limiteFinal ?? ''} onChange={e => setFaixa(i, 'limiteFinal', e.target.value ? Number(e.target.value) : null)} /></td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.aliquota} onChange={e => setFaixa(i, 'aliquota', Number(e.target.value))} /></td>
                  <td style={{ padding: '3px 6px' }}><input style={INPUT} type="number" step="0.01" value={f.parcelaDeduzir} onChange={e => setFaixa(i, 'parcelaDeduzir', Number(e.target.value))} /></td>
                  <td style={{ padding: '3px 6px' }}><button type="button" style={{ ...BTN('danger'), padding: '3px 8px', fontSize: 11 }} onClick={() => removerFaixa(i)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" style={{ ...BTN('ghost'), alignSelf: 'flex-start', fontSize: 12, padding: '4px 10px' }} onClick={addFaixa}>+ Faixa</button>

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

export default function TabelasImpostoPage() {
  const [inss, setInss] = useState<TabelaInss | null>(null);
  const [irrf, setIrrf] = useState<TabelaIrrf | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modal, setModal] = useState<'inss' | 'irrf' | null>(null);

  const load = useCallback(() => {
    setLoading(true); setErro('');
    Promise.all([
      apiFetch<TabelaInss>('/cpagar/tabelas-inss/vigente').catch(() => null),
      apiFetch<TabelaIrrf>('/cpagar/tabelas-irrf/vigente').catch(() => null),
    ]).then(([i, r]) => { setInss(i); setIrrf(r); if (!i || !r) setErro('Nenhuma tabela ativa cadastrada ainda.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Tabelas de Imposto (INSS / IRRF)</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Usadas pelo motor de cálculo da Folha de Pagamento. Editar aqui não exige deploy.
        </p>
      </div>

      <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: '#991b1b', fontWeight: 600 }}>
        ⚠️ A tabela cadastrada é uma referência de 2024 e NÃO foi validada contra a publicação oficial
        vigente. Confira/atualize com um contador antes de fechar qualquer folha real.
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p style={{ color: '#e02424', fontSize: 14 }}>{erro}</p>}

      {!loading && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {inss && (
            <div style={CARD}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>INSS</h2>
                <button style={{ ...BTN('ghost'), padding: '4px 12px', fontSize: 12 }} onClick={() => setModal('inss')}>Editar</button>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--gray-500)' }}>
                Vigência: {new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(inss.vigenciaInicio))}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>{['Faixa', 'De', 'Até', 'Alíquota'].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 11, color: 'var(--gray-500)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {inss.faixas.map(f => (
                    <tr key={f.ordem} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '4px 6px' }}>{f.ordem}</td>
                      <td style={{ padding: '4px 6px' }}>{fmt(f.limiteInicial)}</td>
                      <td style={{ padding: '4px 6px' }}>{f.limiteFinal != null ? fmt(f.limiteFinal) : 'sem teto'}</td>
                      <td style={{ padding: '4px 6px' }}>{f.aliquota}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {irrf && (
            <div style={CARD}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>IRRF</h2>
                <button style={{ ...BTN('ghost'), padding: '4px 12px', fontSize: 12 }} onClick={() => setModal('irrf')}>Editar</button>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--gray-500)' }}>
                Vigência: {new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(irrf.vigenciaInicio))} ·
                Dedução por dependente: {fmt(irrf.valorDeducaoPorDependente)}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>{['Faixa', 'De', 'Até', 'Alíquota', 'Deduzir'].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 11, color: 'var(--gray-500)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {irrf.faixas.map(f => (
                    <tr key={f.ordem} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '4px 6px' }}>{f.ordem}</td>
                      <td style={{ padding: '4px 6px' }}>{fmt(f.limiteInicial)}</td>
                      <td style={{ padding: '4px 6px' }}>{f.limiteFinal != null ? fmt(f.limiteFinal) : 'sem teto'}</td>
                      <td style={{ padding: '4px 6px' }}>{f.aliquota}%</td>
                      <td style={{ padding: '4px 6px' }}>{fmt(f.parcelaDeduzir)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal === 'inss' && inss && <ModalInss tabela={inss} onClose={() => setModal(null)} onSave={load} />}
      {modal === 'irrf' && irrf && <ModalIrrf tabela={irrf} onClose={() => setModal(null)} onSave={load} />}
    </div>
  );
}
