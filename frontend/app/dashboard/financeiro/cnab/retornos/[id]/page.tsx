'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { CARD } from '../../boletos/ui';

interface Ocorrencia {
  id: string; nossoNumero: string; codigoOcorrencia: string; descricaoOcorrencia: string;
  dataOcorrencia: string; valorPago: number | null; statusProcessamento: 'PROCESSADA' | 'NAO_LOCALIZADO' | 'ERRO';
  mensagemErro: string | null;
  boleto: { id: string; parcela: { contrato: { aluno: { nome: string; ra: string } } } } | null;
}
interface RetornoDetalhe {
  id: string; nomeArquivoOriginal: string; dataImportacao: string;
  contaBancaria: { banco: string; agencia: string; numeroConta: string };
  ocorrencias: Ocorrencia[];
}

const STATUS_LABEL: Record<string, { texto: string; bg: string; fg: string }> = {
  PROCESSADA: { texto: 'Processada', bg: '#d1fae5', fg: '#065f46' },
  NAO_LOCALIZADO: { texto: 'Não localizado', bg: '#fef3c7', fg: '#92400e' },
  ERRO: { texto: 'Erro', bg: '#fee2e2', fg: '#991b1b' },
};

function fmtDataUtc(iso: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(iso)); }
function fmtMoeda(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

export default function RetornoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RetornoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<RetornoDetalhe>(`/financeiro/cnab/retornos/${id}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Retorno não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, color: 'var(--gray-500)' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#dc2626' }}>{error}</div>;
  if (!data) return null;

  const resumo = data.ocorrencias.reduce(
    (acc, o) => { acc[o.statusProcessamento] = (acc[o.statusProcessamento] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/dashboard/financeiro/cnab/retornos" style={{ fontSize: 12.5, color: 'var(--gray-500)', textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ margin: '6px 0 4px', fontSize: 20, fontWeight: 700 }}>
          Retorno — {data.contaBancaria.banco} — {data.nomeArquivoOriginal}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Importado em {new Date(data.dataImportacao).toLocaleString('pt-BR')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} style={{ ...CARD, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{resumo[k] ?? 0}</div>
            <div style={{ fontSize: 12, color: v.fg, fontWeight: 600 }}>{v.texto}</div>
          </div>
        ))}
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Ocorrências</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
              {['Nosso Número', 'Aluno', 'Código', 'Ocorrência', 'Data', 'Valor pago', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.ocorrencias.map(o => {
              const s = STATUS_LABEL[o.statusProcessamento];
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>{o.nossoNumero}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {o.boleto ? (
                      <Link href={`/dashboard/financeiro/cnab/boletos/${o.boleto.id}`} style={{ color: 'var(--accent-blue-text)', textDecoration: 'none' }}>
                        {o.boleto.parcela.contrato.aluno.nome}
                      </Link>
                    ) : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>{o.codigoOcorrencia}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12.5 }}>{o.descricaoOcorrencia}</td>
                  <td style={{ padding: '8px 10px' }}>{fmtDataUtc(o.dataOcorrencia)}</td>
                  <td style={{ padding: '8px 10px' }}>{o.valorPago != null ? fmtMoeda(Number(o.valorPago)) : '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.fg }}>{s.texto}</span>
                    {o.mensagemErro && <div style={{ fontSize: 10.5, color: 'var(--gray-400)', marginTop: 2 }}>{o.mensagemErro}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
