'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

interface Contracheque {
  colaborador: { nome: string; cpf: string; cargo: string; dataAdmissao: string | null };
  competencia: { mes: number; mesLabel: string; ano: number };
  proventos: { descricao: string; valor: number }[];
  descontos: { descricao: string; valor: number }[];
  totalProventos: number;
  totalDescontos: number;
  fgts: number;
  salarioLiquido: number;
  status: string;
}

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function fmtData(v: string | null) { return v ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(v)) : '—'; }

export default function ContrachequePage() {
  const { itemId } = useParams<{ itemId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<Contracheque | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Contracheque>(`/cpagar/contracheque/${itemId}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Item não encontrado'))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          🖨️ Imprimir / Salvar PDF
        </button>
        <button onClick={() => window.history.back()}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          ← Voltar
        </button>
      </div>

      <div id="documento" style={{ background: '#fff', maxWidth: 720, margin: '0 auto', padding: '40px 48px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 13, color: '#000', border: '1px solid #999' }}>
        <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #000', paddingBottom: 14 }}>
          {logoUrl && <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 44, objectFit: 'contain', margin: '0 auto 8px' }} />}
          <strong style={{ fontSize: 15 }}>{branding.nomeCompleto}</strong>
          <div style={{ fontSize: 13, marginTop: 4 }}>Recibo de Pagamento — {data.competencia.mesLabel}/{data.competencia.ano}</div>
        </div>

        <div style={{ display: 'flex', border: '1px solid #000', marginBottom: 10 }}>
          <div style={{ flex: 2, borderRight: '1px solid #000', padding: '4px 8px' }}>
            <div style={{ fontSize: 9, color: '#333' }}>Nome</div>
            <div>{data.colaborador.nome}</div>
          </div>
          <div style={{ flex: 1, borderRight: '1px solid #000', padding: '4px 8px' }}>
            <div style={{ fontSize: 9, color: '#333' }}>CPF</div>
            <div>{data.colaborador.cpf}</div>
          </div>
          <div style={{ flex: 1, padding: '4px 8px' }}>
            <div style={{ fontSize: 9, color: '#333' }}>Cargo</div>
            <div>{data.colaborador.cargo}</div>
          </div>
        </div>
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '4px 8px', marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#333' }}>Admissão</div>
          <div>{fmtData(data.colaborador.dataAdmissao)}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Proventos</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', fontWeight: 600, width: 110 }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.proventos.map((p, i) => (
              <tr key={i}>
                <td style={{ padding: '3px 8px', border: '1px solid #000' }}>{p.descricao}</td>
                <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'right' }}>{fmt(p.valor)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700 }}>
              <td style={{ padding: '3px 8px', border: '1px solid #000' }}>Total de proventos</td>
              <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'right' }}>{fmt(data.totalProventos)}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Descontos</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', fontWeight: 600, width: 110 }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.descontos.map((d, i) => (
              <tr key={i}>
                <td style={{ padding: '3px 8px', border: '1px solid #000' }}>{d.descricao}</td>
                <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'right' }}>{fmt(d.valor)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700 }}>
              <td style={{ padding: '3px 8px', border: '1px solid #000' }}>Total de descontos</td>
              <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'right' }}>{fmt(data.totalDescontos)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', border: '2px solid #000', padding: '8px 12px', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
          <span>Salário líquido</span>
          <span>{fmt(data.salarioLiquido)}</span>
        </div>
        <p style={{ fontSize: 10.5, color: '#555', margin: '0 0 24px' }}>
          FGTS do mês (informativo, não é desconto do colaborador): {fmt(data.fgts)}
        </p>

        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 11 }}>{branding.nomeCompleto}</div>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 11 }}>{data.colaborador.nome}</div>
          </div>
        </div>
      </div>
    </>
  );
}
