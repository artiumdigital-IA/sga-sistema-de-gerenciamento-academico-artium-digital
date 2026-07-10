'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: string;
}
interface Contrato {
  id: string;
  valorTotal: number;
  numeroParcelas: number;
  status: string;
  periodoLetivo: { ano: number; semestre: number };
  parcelas: Parcela[];
}

const STATUS_PARCELA_COLOR: Record<string, string> = { PAGO: '#16a34a', PENDENTE: '#3b82f6', VENCIDO: '#dc2626', CANCELADO: 'var(--gray-500)' };
const STATUS_CONTRATO_LABEL: Record<string, string> = { ATIVO: 'Ativo', SUSPENSO: 'Suspenso', CANCELADO: 'Cancelado', ENCERRADO: 'Encerrado' };

function formatarMoeda(v: number): string {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinanceiroDiscentePage() {
  const [contratos, setContratos] = useState<Contrato[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<Contrato[]>('/discente/financeiro')
      .then(setContratos)
      .catch(e => setErro(e.message ?? 'Erro ao carregar dados financeiros.'));
  }, []);

  const th: React.CSSProperties = { padding: '6px 10px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' };
  const td: React.CSSProperties = { padding: '6px 10px', fontSize: 12.5, borderBottom: '1px solid var(--gray-100)' };

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Financeiro</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Seus contratos e parcelas — consulta apenas. Pagamentos e negociações continuam sendo tratados pelo Financeiro/secretaria.
      </p>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !contratos && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}
      {contratos && contratos.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhum contrato encontrado.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
        {contratos?.map(c => (
          <div key={c.id} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Contrato {c.periodoLetivo.ano}/{c.periodoLetivo.semestre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>{formatarMoeda(c.valorTotal)} em {c.numeroParcelas}x</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>{STATUS_CONTRATO_LABEL[c.status] ?? c.status}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Parcela', 'Valor', 'Vencimento', 'Pagamento', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {c.parcelas.map(p => (
                  <tr key={p.id}>
                    <td style={td}>{p.numero}</td>
                    <td style={td}>{formatarMoeda(p.valor)}</td>
                    <td style={td}>{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</td>
                    <td style={td}>{p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={td}>
                      <span style={{ color: STATUS_PARCELA_COLOR[p.status] ?? 'var(--gray-500)', fontWeight: 600 }}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
