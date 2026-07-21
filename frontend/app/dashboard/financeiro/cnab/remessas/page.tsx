'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiDownload } from '@/lib/api';
import { INPUT, BTN_G, CARD, fmtMoeda } from '../boletos/ui';

interface ContaBancaria { id: string; banco: string; agencia: string; numeroConta: string; cnabHabilitado: boolean; }
interface Remessa {
  id: string; banco: string; layout: string; sequencial: number; dataGeracao: string;
  quantidadeRegistros: number; valorTotal: number; status: string; arquivoNome: string;
  contaBancaria: { banco: string; agencia: string; numeroConta: string };
}

const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };

export default function RemessasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaEscolhida, setContaEscolhida] = useState('');
  const [gerando, setGerando] = useState(false);
  const [gerandoBaixa, setGerandoBaixa] = useState(false);
  const [erro, setErro] = useState('');
  const [remessas, setRemessas] = useState<Remessa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ContaBancaria[]>('/financeiro/contas-bancarias?somenteAtivas=true')
      .then(cs => {
        const habilitadas = cs.filter(c => c.cnabHabilitado);
        setContas(habilitadas);
        if (habilitadas.length === 1) setContaEscolhida(habilitadas[0].id);
      })
      .catch(() => {});
  }, []);

  const carregar = useCallback(() => {
    setCarregando(true);
    apiFetch<Remessa[]>('/financeiro/cnab/remessas')
      .then(setRemessas)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function gerar() {
    if (!contaEscolhida) { setErro('Escolha a conta bancária.'); return; }
    setErro(''); setGerando(true);
    try {
      await apiFetch('/financeiro/cnab/remessas', { method: 'POST', body: JSON.stringify({ contaBancariaId: contaEscolhida }) });
      carregar();
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao gerar remessa'); }
    finally { setGerando(false); }
  }

  async function gerarBaixa() {
    if (!contaEscolhida) { setErro('Escolha a conta bancária.'); return; }
    if (!confirm('Gerar remessa de baixa/cancelamento pra todos os boletos enviados/registrados dessa conta? Eles vão passar pra status Cancelado.')) return;
    setErro(''); setGerandoBaixa(true);
    try {
      await apiFetch('/financeiro/cnab/remessas/baixa', { method: 'POST', body: JSON.stringify({ contaBancariaId: contaEscolhida }) });
      carregar();
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao gerar remessa de baixa'); }
    finally { setGerandoBaixa(false); }
  }

  async function baixar(r: Remessa) {
    setBaixando(r.id);
    try { await apiDownload(`/financeiro/cnab/remessas/${r.id}/download`, r.arquivoNome); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erro ao baixar arquivo'); }
    finally { setBaixando(null); }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Remessas (CNAB)</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Gera o arquivo de remessa com os boletos emitidos e ainda não enviados. Baixe o arquivo e
          envie pelo Internet Banking do banco — o registro oficial dos boletos acontece lá.
        </p>
      </div>

      <div style={{ ...CARD, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, maxWidth: 340 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Conta bancária (CNAB)</label>
          <select style={INPUT} value={contaEscolhida} onChange={e => setContaEscolhida(e.target.value)}>
            <option value="">Selecione...</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.banco} — ag. {c.agencia} / cc {c.numeroConta}</option>)}
          </select>
        </div>
        <button style={BTN_P} disabled={gerando || !contaEscolhida} onClick={gerar}>
          {gerando ? 'Gerando...' : 'Gerar remessa'}
        </button>
        <button style={{ ...BTN_P, background: 'transparent', color: '#dc2626', border: '1px solid #dc2626' }} disabled={gerandoBaixa || !contaEscolhida} onClick={gerarBaixa}>
          {gerandoBaixa ? 'Gerando...' : 'Gerar remessa de baixa'}
        </button>
      </div>
      {erro && <p style={{ color: '#dc2626', fontSize: 12.5, margin: '0 0 16px' }}>{erro}</p>}

      <div style={CARD}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Remessas geradas</h2>
        {carregando && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Carregando...</p>}
        {!carregando && remessas.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Nenhuma remessa gerada ainda.</p>}
        {remessas.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                {['Banco', 'Conta', 'Seq.', 'Data', 'Qtd. boletos', 'Valor total', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {remessas.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 10px' }}>{r.contaBancaria.banco}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>{r.contaBancaria.agencia}/{r.contaBancaria.numeroConta}</td>
                  <td style={{ padding: '8px 10px' }}>{r.sequencial}</td>
                  <td style={{ padding: '8px 10px' }}>{new Date(r.dataGeracao).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px' }}>{r.quantidadeRegistros}</td>
                  <td style={{ padding: '8px 10px' }}>{fmtMoeda(Number(r.valorTotal))}</td>
                  <td style={{ padding: '8px 10px' }}>{r.status}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button style={{ ...BTN_G, padding: '4px 10px', fontSize: 12 }} disabled={baixando === r.id} onClick={() => baixar(r)}>
                      {baixando === r.id ? '...' : '↓ Baixar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
