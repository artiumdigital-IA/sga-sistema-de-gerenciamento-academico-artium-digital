'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import { ItfBarcode } from '@/lib/barcodeItf';
import { StatusBadge, fmtMoeda, fmtDataUtc } from '../ui';

interface BoletoDetalhe {
  id: string; nossoNumero: string; carteira: string; status: string;
  linhaDigitavel: string; codigoBarras: string;
  criadoEm: string;
  parcela: {
    numero: number; valor: number; dataVencimento: string;
    contrato: { aluno: {
      nome: string; ra: string; cpf: string | null;
      logradouro: string | null; numero: string | null; complemento: string | null;
      bairro: string | null; municipio: string | null; uf: string | null; cep: string | null;
    } };
  };
  contaBancaria: {
    banco: string; agencia: string; numeroConta: string; titular: string;
    cnpjCpfTitular: string | null; codigoBancoFebraban: string | null;
  };
  ocorrencias: { codigoOcorrencia: string; descricaoOcorrencia: string; dataOcorrencia: string }[];
}

// DV do código do banco (3 dígitos) — módulo 11, pesos 2..9 da direita p/ esquerda.
// Ex.: 341 → 7 ("341-7").
function dvBancoFebraban(cod: string): number {
  let soma = 0, peso = 2;
  for (let i = cod.length - 1; i >= 0; i--) {
    soma += Number(cod[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const dv = 11 - (soma % 11);
  return dv >= 10 ? 0 : dv; // resto 0 → 11 → 0; resto 1 → 10 → 0
}

// Célula estilo boleto (rótulo pequeno em cima, valor embaixo).
function Campo({ label, children, flex = 1, right = false, ultima = false, alto = false }: {
  label: string; children: React.ReactNode; flex?: number; right?: boolean; ultima?: boolean; alto?: boolean;
}) {
  return (
    <div style={{ flex, borderRight: ultima ? 'none' : '1px solid #000', padding: '1px 6px', minWidth: 0, textAlign: right ? 'right' : 'left' }}>
      <div style={{ fontSize: 7.5, lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 11, lineHeight: 1.25, minHeight: alto ? 30 : 15, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
}
const ROW: React.CSSProperties = { display: 'flex', borderTop: '1px solid #000' };

export default function BoletoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const branding = useBranding();
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

  const cb = data.codigoBarras;
  // DVs lidos direto do código de barras (fonte de verdade) — sem duplicar lógica.
  // Campo livre começa no índice 19: carteira(19-21) NN(22-29) dvNN(30) ag(31-34) conta(35-39) dacAgConta(40).
  const dvNN = cb.length === 44 ? cb[30] : '';
  const dacAgConta = cb.length === 44 ? cb[40] : '';
  const codBanco = data.contaBancaria.codigoBancoFebraban ?? '341';
  const bancoComDv = `${codBanco}-${dvBancoFebraban(codBanco)}`;
  const nossoNumeroFmt = `${data.carteira}/${data.nossoNumero}${dvNN ? '-' + dvNN : ''}`;
  const contaSemDv = data.contaBancaria.numeroConta.split('-')[0];
  const agCodBenef = `${data.contaBancaria.agencia}/${contaSemDv}${dacAgConta ? '-' + dacAgConta : ''}`;
  const valorFmt = fmtMoeda(Number(data.parcela.valor));
  const vencFmt = fmtDataUtc(data.parcela.dataVencimento);
  const procFmt = fmtDataUtc(data.criadoEm);

  const al = data.parcela.contrato.aluno;
  const enderecoPagador = [
    [al.logradouro, al.numero].filter(Boolean).join(', '),
    al.complemento,
    al.bairro,
    [al.municipio, al.uf].filter(Boolean).join(' - '),
    al.cep ? `CEP ${al.cep}` : null,
  ].filter(Boolean).join(' — ');
  const beneficiario = `${branding.nomeCompleto}${data.contaBancaria.cnpjCpfTitular ? ` — CNPJ ${data.contaBancaria.cnpjCpfTitular}` : ''}`;

  // Cabeçalho do banco (Itaú) — texto do banco à esquerda, código à direita.
  // Segue o padrão de ficha de compensação; a identidade FIURJ fica no topo do documento.
  const FaixaBanco = ({ direita }: { direita: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '3px solid #000', borderTop: '1px solid #000' }}>
      <div style={{ fontWeight: 800, fontSize: 15, padding: '3px 10px', borderRight: '2px solid #000', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        Banco {data.contaBancaria.banco} S/A
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, padding: '3px 12px', borderRight: '2px solid #000', display: 'flex', alignItems: 'center' }}>
        {bancoComDv}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '3px 8px', minWidth: 0 }}>
        {direita}
      </div>
    </div>
  );

  return (
    <>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

      <div id="documento" style={{ background: '#fff', maxWidth: 760, margin: '0 auto', padding: 28, fontFamily: 'Arial, Helvetica, sans-serif', color: '#000' }}>
        {/* Logo FIURJ (beneficiário) — imagem fixa a 200x72 */}
        <div style={{ marginBottom: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logoColorida.png.webp" alt={branding.nomeInstituicao}
            width={200} height={72} style={{ width: 200, height: 72, objectFit: 'contain' }} />
        </div>

        {/* ===== RECIBO DO PAGADOR ===== */}
        <FaixaBanco direita={<span style={{ fontSize: 13, fontWeight: 700 }}>Recibo do Pagador</span>} />
        <div style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
          <div style={{ display: 'flex' }}>
            <Campo label="Beneficiário" flex={3}>{beneficiario}</Campo>
            <Campo label="Vencimento" right ultima>{vencFmt}</Campo>
          </div>
          <div style={ROW}>
            <Campo label="Pagador" flex={3}>{al.nome}{al.cpf ? ` — CPF ${al.cpf}` : ''}</Campo>
            <Campo label="Nº do documento">{data.nossoNumero}</Campo>
          </div>
          <div style={ROW}>
            <Campo label="Nosso número" flex={3}>{nossoNumeroFmt}</Campo>
            <Campo label="Valor do documento" right ultima>{valorFmt}</Campo>
          </div>
          <div style={ROW}>
            <Campo label="Demonstrativo" ultima alto>
              Mensalidade — parcela {data.parcela.numero}. RA {al.ra}.
            </Campo>
          </div>
          <div style={{ ...ROW, justifyContent: 'flex-end', padding: '2px 8px', fontSize: 8, color: '#333' }}>
            Autenticação mecânica — Recibo do Pagador
          </div>
        </div>

        {/* linha de corte */}
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0', textAlign: 'right', fontSize: 8, color: '#333' }}>corte na linha pontilhada</div>

        {/* ===== FICHA DE COMPENSAÇÃO ===== */}
        <FaixaBanco direita={<span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{data.linhaDigitavel}</span>} />
        <div style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
          <div style={{ display: 'flex' }}>
            <Campo label="Local de pagamento" flex={3}>Pagável em qualquer banco ou correspondente não bancário.</Campo>
            <Campo label="Vencimento" right ultima>{vencFmt}</Campo>
          </div>
          <div style={ROW}>
            <Campo label="Beneficiário" flex={3}>{beneficiario}</Campo>
            <Campo label="Agência / Código do beneficiário" right ultima>{agCodBenef}</Campo>
          </div>
          <div style={ROW}>
            <Campo label="Data do documento">{procFmt}</Campo>
            <Campo label="Nº do documento">{data.nossoNumero}</Campo>
            <Campo label="Espécie doc.">DM</Campo>
            <Campo label="Aceite">N</Campo>
            <Campo label="Data processamento">{procFmt}</Campo>
            <Campo label="Nosso número" right ultima>{nossoNumeroFmt}</Campo>
          </div>
          <div style={ROW}>
            <Campo label="Uso do banco"> </Campo>
            <Campo label="Carteira">{data.carteira}</Campo>
            <Campo label="Espécie">R$</Campo>
            <Campo label="Quantidade"> </Campo>
            <Campo label="(x) Valor" right ultima>{valorFmt}</Campo>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3, borderRight: '1px solid #000' }}>
              <div style={{ borderTop: '1px solid #000', padding: '1px 6px' }}>
                <div style={{ fontSize: 7.5 }}>Instruções (texto de responsabilidade do beneficiário)</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.4, minHeight: 90, whiteSpace: 'pre-wrap' }}>
                  {`Sr. Caixa, não receber após o vencimento sem consultar o beneficiário.\nApós o vencimento: multa de 2% + juros de 1% ao mês.\nReferente à mensalidade — parcela ${data.parcela.numero}.`}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Campo label="(=) Valor do documento" right ultima>{valorFmt}</Campo>
              <div style={ROW}><Campo label="(-) Desconto / Abatimento" right ultima> </Campo></div>
              <div style={ROW}><Campo label="(+) Juros / Multa" right ultima> </Campo></div>
              <div style={ROW}><Campo label="(=) Valor cobrado" right ultima> </Campo></div>
            </div>
          </div>
          <div style={ROW}>
            <Campo label="Pagador" ultima>
              {al.nome}{al.cpf ? ` — CPF/CNPJ ${al.cpf}` : ''}
              {enderecoPagador ? `\n${enderecoPagador}` : ''}
            </Campo>
          </div>
          <div style={ROW}>
            <Campo label="Sacador / Avalista" ultima> </Campo>
          </div>
          <div style={{ ...ROW, justifyContent: 'flex-end', padding: '2px 8px', fontSize: 8, color: '#333' }}>
            Autenticação mecânica — Ficha de Compensação
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <ItfBarcode value={data.codigoBarras} height={50} />
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
