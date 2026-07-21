// Adapter Itaú — CNAB 400. Banco piloto do módulo CNAB (ver plano em
// C:\Users\fiurj\.claude\plans\wiggly-rolling-stearns.md).
//
// ⚠️ Layout montado a partir do padrão CNAB 400 amplamente documentado em
// bibliotecas de boleto brasileiras de código aberto — header/trailer
// seguem a estrutura padronizada pela FEBRABAN (comum a qualquer banco em
// CNAB 400); o registro de detalhe usa os campos "core" (identificação da
// empresa, agência/conta, nosso número, carteira, vencimento, valor, dados
// do sacado, campo livre) na posição mais amplamente documentada pro Itaú.
// Campos secundários pouco usados (instrução de protesto automático em dias,
// código de multa/desconto avançado etc.) ficam zerados/em branco — omitir
// esses recursos é sempre seguro num arquivo CNAB, "posição errada" que
// preencheria algo indevido é que não é. **Antes do primeiro envio real,
// validar linha a linha contra o manual técnico oficial do Itaú ou o
// ambiente de homologação do banco** — ver seção "Riscos" do plano.

import { BancoCnab, LayoutCnab } from '@prisma/client';
import { CnabBankAdapter, BoletoParaRemessa, ContaBancariaParaRemessa, OcorrenciaParseada } from './cnab-bank-adapter.interface';
import { alfa, num, brancos, zeros, dataDDMMAA, montarLinha400 } from './cnab-fixo.util';
import { montarCampoLivreItau } from './itau-campo-livre.util';

function montarHeader(conta: ContaBancariaParaRemessa, sequencial: number, dataGeracao: Date): string {
  const campos = [
    { v: '0', t: 1 },                          // tipo de registro
    { v: '1', t: 1 },                          // tipo de operação (remessa)
    { v: alfa('REMESSA', 7), t: 7 },
    { v: '01', t: 2 },                         // tipo de serviço (cobrança)
    { v: alfa('COBRANCA', 15), t: 15 },
    { v: alfa(conta.codigoCedente, 20), t: 20 },// código/nome cedente no banco
    { v: num('341', 3), t: 3 },                // código do banco
    { v: alfa('BANCO ITAU SA', 15), t: 15 },
    { v: dataDDMMAA(dataGeracao), t: 6 },
    { v: brancos(295), t: 295 },               // reservado
    { v: alfa('MX', 2), t: 2 },                // identificação do sistema
    { v: num(sequencial, 7), t: 7 },           // sequencial de remessa
    { v: brancos(20), t: 20 },
    { v: num(1, 6), t: 6 },                    // número sequencial do registro no arquivo
  ];
  return montarLinha400(campos.map(c => c.v));
}

function montarDetalhe(boleto: BoletoParaRemessa, conta: ContaBancariaParaRemessa, numeroRegistro: number): string {
  const campoLivre = montarCampoLivreItau({
    agencia: conta.agencia,
    contaCorrente: conta.numeroConta,
    carteira: boleto.carteira,
    nossoNumero: boleto.nossoNumero,
  });
  const cpfCnpj = (boleto.sacadoCpfCnpj ?? '').replace(/\D/g, '');
  const tipoInscricaoSacado = cpfCnpj.length > 11 ? '02' : '01';
  const valorCentavos = num(Math.round(boleto.valor * 100), 13);

  const campos = [
    { v: '1', t: 1 },                              // tipo de registro (detalhe)
    { v: '02', t: 2 },                             // tipo inscrição empresa (02=CNPJ)
    { v: num(conta.cnpjCpfTitular ?? '', 14), t: 14 },
    { v: alfa(conta.codigoCedente, 20), t: 20 },    // uso da empresa / código cedente
    { v: brancos(2), t: 2 },
    { v: num(conta.agencia, 4), t: 4 },
    { v: brancos(2), t: 2 },
    { v: num(conta.numeroConta, 5), t: 5 },
    { v: brancos(1), t: 1 },
    { v: alfa(boleto.numeroDocumento, 25), t: 25 }, // número de controle do participante
    { v: campoLivre, t: 25 },                       // carteira+nosso número+DV+agência+conta+zeros
    { v: brancos(1), t: 1 },
    { v: zeros(13), t: 13 },                        // valor do desconto (não usado)
    { v: zeros(13), t: 13 },                        // valor do IOF (não usado)
    { v: zeros(13), t: 13 },                        // valor do abatimento (não usado)
    { v: dataDDMMAA(boleto.dataVencimento), t: 6 },
    { v: valorCentavos, t: 13 },
    { v: num('341', 3), t: 3 },                     // banco cobrador
    { v: brancos(5), t: 5 },                        // agência cobradora (não usado)
    { v: '01', t: 2 },                              // espécie do título (01 = duplicata mercantil)
    { v: 'N', t: 1 },                               // aceite
    { v: dataDDMMAA(new Date()), t: 6 },            // data de emissão
    { v: zeros(2), t: 2 },                          // instrução 1 (não usado)
    { v: zeros(2), t: 2 },                          // instrução 2 (não usado)
    { v: zeros(13), t: 13 },                        // valor de mora/dia (não usado)
    { v: zeros(6), t: 6 },                          // data limite p/ desconto (não usado)
    { v: zeros(13), t: 13 },                        // valor do desconto por antecipação (não usado)
    { v: tipoInscricaoSacado, t: 2 },
    { v: num(cpfCnpj, 14), t: 14 },
    { v: alfa(boleto.sacadoNome, 40), t: 40 },
    { v: alfa('', 40), t: 40 },                     // endereço do sacado (não coletado ainda)
    { v: alfa('', 12), t: 12 },                     // bairro (não coletado ainda)
    { v: zeros(8), t: 8 },                          // CEP (não coletado ainda)
    { v: alfa('', 15), t: 15 },                     // cidade (não coletado ainda)
    { v: alfa('', 2), t: 2 },                       // UF (não coletado ainda)
    { v: alfa('', 30), t: 30 },                     // sacador/avalista (não usado)
    { v: zeros(3), t: 3 },                          // dias de protesto automático (não usado)
    { v: brancos(1), t: 1 },
    { v: '0', t: 1 },                               // código de moeda (0 = Real)
    { v: brancos(13), t: 13 },                      // reservado/uso do banco
    { v: num(numeroRegistro, 6), t: 6 },            // número sequencial do registro no arquivo
  ];
  return montarLinha400(campos.map(c => c.v));
}

function montarTrailer(quantidadeRegistros: number): string {
  const numeroRegistro = quantidadeRegistros + 2; // header + detalhes + este trailer
  const campos = [
    { v: '9', t: 1 },
    { v: brancos(393), t: 393 },
    { v: num(numeroRegistro, 6), t: 6 },
  ];
  return montarLinha400(campos.map(c => c.v));
}

export const itauAdapter: CnabBankAdapter = {
  banco: BancoCnab.ITAU,
  layout: LayoutCnab.CNAB400,

  gerarRemessa({ boletos, conta, sequencial, dataGeracao }) {
    const linhas: string[] = [];
    linhas.push(montarHeader(conta, sequencial, dataGeracao));
    boletos.forEach((b, i) => linhas.push(montarDetalhe(b, conta, i + 2)));
    linhas.push(montarTrailer(boletos.length));
    return linhas.join('\r\n') + '\r\n';
  },

  parseRetorno(_conteudoArquivo: string): OcorrenciaParseada[] {
    throw new Error('Leitura de retorno CNAB do Itaú ainda não implementada (Fase 3 do módulo CNAB).');
  },
};
