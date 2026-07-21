'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiFetch, apiUpload } from '@/lib/api';
import { INPUT, CARD } from '../boletos/ui';

interface ContaBancaria { id: string; banco: string; agencia: string; numeroConta: string; cnabHabilitado: boolean; }
interface Retorno {
  id: string; banco: string; nomeArquivoOriginal: string; dataImportacao: string;
  quantidadeRegistros: number; valorTotalOcorrencias: number;
  contaBancaria: { banco: string; agencia: string; numeroConta: string };
}

const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
function fmtMoeda(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

export default function RetornosPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaEscolhida, setContaEscolhida] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState('');

  const [retornos, setRetornos] = useState<Retorno[]>([]);
  const [carregando, setCarregando] = useState(true);

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
    apiFetch<Retorno[]>('/financeiro/cnab/retornos')
      .then(setRetornos)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function importar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const arquivo = fileRef.current?.files?.[0];
    if (!contaEscolhida) { setErro('Escolha a conta bancária.'); return; }
    if (!arquivo) { setErro('Selecione o arquivo de retorno.'); return; }

    setImportando(true);
    try {
      const fd = new FormData();
      fd.append('contaBancariaId', contaEscolhida);
      fd.append('arquivo', arquivo);
      const criado = await apiUpload<{ id: string }>('/financeiro/cnab/retornos', fd);
      if (fileRef.current) fileRef.current.value = '';
      carregar();
      window.location.assign(`/dashboard/financeiro/cnab/retornos/${criado.id}`);
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao importar retorno'); }
    finally { setImportando(false); }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Retornos (CNAB)</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Importe o arquivo de retorno que o banco disponibiliza — a baixa das parcelas pagas
          acontece automaticamente, sem precisar localizar boleto por boleto.
        </p>
      </div>

      <form onSubmit={importar} style={{ ...CARD, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 260 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Conta bancária (CNAB)</label>
          <select style={INPUT} value={contaEscolhida} onChange={e => setContaEscolhida(e.target.value)}>
            <option value="">Selecione...</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.banco} — ag. {c.agencia} / cc {c.numeroConta}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Arquivo de retorno</label>
          <input ref={fileRef} type="file" style={{ fontSize: 12 }} />
        </div>
        <button type="submit" style={BTN_P} disabled={importando}>{importando ? 'Importando...' : 'Importar retorno'}</button>
      </form>
      {erro && <p style={{ color: '#dc2626', fontSize: 12.5, margin: '0 0 16px' }}>{erro}</p>}

      <div style={CARD}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Retornos importados</h2>
        {carregando && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Carregando...</p>}
        {!carregando && retornos.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Nenhum retorno importado ainda.</p>}
        {retornos.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                {['Banco', 'Conta', 'Arquivo', 'Data', 'Ocorrências', 'Valor total'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retornos.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <Link href={`/dashboard/financeiro/cnab/retornos/${r.id}`} style={{ color: 'var(--accent-blue-text)', textDecoration: 'none' }}>
                      {r.contaBancaria.banco}
                    </Link>
                  </td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>{r.contaBancaria.agencia}/{r.contaBancaria.numeroConta}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{r.nomeArquivoOriginal}</td>
                  <td style={{ padding: '8px 10px' }}>{new Date(r.dataImportacao).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px' }}>{r.quantidadeRegistros}</td>
                  <td style={{ padding: '8px 10px' }}>{fmtMoeda(Number(r.valorTotalOcorrencias))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
