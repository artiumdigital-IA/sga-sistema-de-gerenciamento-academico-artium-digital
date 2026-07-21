'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import { ItfBarcode } from '@/lib/barcodeItf';
import { StatusBadge, fmtMoeda, fmtDataUtc } from '../ui';

interface BoletoDetalhe {
  id: string; nossoNumero: string; carteira: string; status: string;
  linhaDigitavel: string; codigoBarras: string;
  criadoEm: string;
  parcela: {
    numero: number; valor: number; dataVencimento: string;
    contrato: { aluno: { nome: string; ra: string; cpf: string | null } };
  };
  contaBancaria: {
    banco: string; agencia: string; numeroConta: string; titular: string; cnpjCpfTitular: string | null;
  };
  ocorrencias: { codigoOcorrencia: string; descricaoOcorrencia: string; dataOcorrencia: string }[];
}

export default function BoletoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<BoletoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mudando, setMudando] = useState(false);

  function carregar() {
    apiFetch<BoletoDetalhe>(`/financeiro/cnab/boletos/${id}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Boleto não encontrado'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { carregar(); }, [id]);

  async function mudarStatus(novoStatus: string, confirmacao: string) {
    if (!confirm(confirmacao)) return;
    setMudando(true);
    try {
      await apiFetch(`/financeiro/cnab/boletos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: novoStatus }) });
      carregar();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erro ao mudar status'); }
    finally { setMudando(false); }
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  const linha = (label: string, valor: React.ReactNode) => (
    <div style={{ borderRight: '1px solid #000', padding: '2px 8px', flex: 1 }}>
      <div style={{ fontSize: 8, color: '#333' }}>{label}</div>
      <div style={{ fontSize: 12 }}>{valor}</div>
    </div>
  );

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
        <div style={{ marginLeft: 12 }}><StatusBadge status={data.status} /></div>
        <div style={{ flex: 1 }} />
        {!['CANCELADO', 'LIQUIDADO'].includes(data.status) && (
          <button disabled={mudando}
            onClick={() => mudarStatus('CANCELADO', 'Marcar este boleto como cancelado? Isso não gera arquivo de remessa de baixa — pra pedir cancelamento no banco, use "Gerar remessa de baixa" na tela de Remessas.')}
            style={{ padding: '7px 14px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer', fontSize: 12.5 }}>
            Cancelar boleto
          </button>
        )}
        {data.status === 'REGISTRADO' && (
          <button disabled={mudando} onClick={() => mudarStatus('PROTESTADO', 'Marcar este boleto como protestado?')}
            style={{ padding: '7px 14px', background: 'transparent', color: '#92400e', border: '1px solid #92400e', borderRadius: 4, cursor: 'pointer', fontSize: 12.5 }}>
            Marcar protestado
          </button>
        )}
        {data.status === 'PROTESTADO' && (
          <button disabled={mudando} onClick={() => mudarStatus('REGISTRADO', 'Sustar o protesto e voltar o boleto pra Registrado?')}
            style={{ padding: '7px 14px', background: 'transparent', color: 'var(--gray-700)', border: '1px solid var(--gray-300)', borderRadius: 4, cursor: 'pointer', fontSize: 12.5 }}>
            Sustar protesto
          </button>
        )}
      </div>

      <div id="documento" style={{ background: '#fff', maxWidth: 720, margin: '0 auto', padding: 32, fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', border: '1px solid #999' }}>
        {/* Recibo do sacado */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            {logoUrl && <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 32, objectFit: 'contain' }} />}
            <strong style={{ fontSize: 13 }}>{branding.nomeCompleto}</strong>
          </div>
          <div style={{ display: 'flex', border: '1px solid #000' }}>
            {linha('Sacado', data.parcela.contrato.aluno.nome)}
            {linha('Vencimento', fmtDataUtc(data.parcela.dataVencimento))}
            {linha('Valor', fmtMoeda(Number(data.parcela.valor)))}
          </div>
          <p style={{ fontSize: 10, color: '#555', margin: '6px 0 0' }}>Recibo do sacado — retire antes do pagamento.</p>
        </div>

        {/* Ficha de compensação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl && <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 28, objectFit: 'contain' }} />}
            <span style={{ fontSize: 16, fontWeight: 700 }}>{data.contaBancaria.banco}</span>
          </div>
          <span style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: 0.5 }}>{data.linhaDigitavel}</span>
        </div>

        <div style={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
          <div style={{ flex: 2, borderRight: '1px solid #000', padding: '2px 8px' }}>
            <div style={{ fontSize: 8, color: '#333' }}>Cedente</div>
            <div style={{ fontSize: 12 }}>{branding.nomeCompleto} — {data.contaBancaria.cnpjCpfTitular ?? ''}</div>
          </div>
          {linha('Agência/Código cedente', `${data.contaBancaria.agencia} / ${data.contaBancaria.numeroConta}`)}
        </div>
        <div style={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
          {linha('Nosso número', data.nossoNumero)}
          {linha('Carteira', data.carteira)}
          {linha('Espécie', 'R$')}
          {linha('Vencimento', fmtDataUtc(data.parcela.dataVencimento))}
        </div>
        <div style={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
          <div style={{ flex: 2, borderRight: '1px solid #000', padding: '2px 8px' }}>
            <div style={{ fontSize: 8, color: '#333' }}>Sacado</div>
            <div style={{ fontSize: 12 }}>
              {data.parcela.contrato.aluno.nome} — RA {data.parcela.contrato.aluno.ra}
              {data.parcela.contrato.aluno.cpf ? ` — CPF ${data.parcela.contrato.aluno.cpf}` : ''}
            </div>
          </div>
          {linha('Valor do documento', fmtMoeda(Number(data.parcela.valor)))}
        </div>
        <div style={{ border: '1px solid #000', borderTop: 'none', minHeight: 40, padding: '2px 8px' }}>
          <div style={{ fontSize: 8, color: '#333' }}>Instruções</div>
          <div style={{ fontSize: 11 }}>Não receber após o vencimento sem consultar a instituição. Parcela {data.parcela.numero}.</div>
        </div>

        <div style={{ marginTop: 16 }}>
          <ItfBarcode value={data.codigoBarras} height={45} />
        </div>

        {data.ocorrencias.length > 0 && (
          <div className="no-print" style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, margin: '0 0 6px' }}>Ocorrências do banco</p>
            {data.ocorrencias.map((o, i) => (
              <div key={i} style={{ fontSize: 11, color: '#555' }}>
                {fmtDataUtc(o.dataOcorrencia)} — [{o.codigoOcorrencia}] {o.descricaoOcorrencia}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
