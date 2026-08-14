// Adapter Safra — CNAB 400 (NÃO CNAB 240, ver achado abaixo).
//
// ✅ VALIDADO (Ago/2026) contra o manual técnico oficial do Safra ("Manual
// de Transferência de Arquivos Cobrança — Produto 001, Layout Padrão SAFRA
// 400", Dezembro/2017 — baixado de
// https://www.safra.com.br/data/files/74/70/C8/0F/1451971028EDDE77E03EF9C2/Leiaute%20de%20Arquivos%20-%20Cobranca%20CNAB%20400.pdf)
// e com o cálculo do DV do Nosso Número conferido contra os 3 exemplos
// numéricos do próprio manual (item 7.1). Produto usado: "Cobrança Direta
// Eletrônica" (banco 422 no código de barras) — não um dos dois "bancos
// correspondentes" (Bradesco/Itaú) que o mesmo manual também descreve pra
// outros clientes Safra.
//
// ⚠️ Achado que motivou esta reescrita: até essa validação, o Safra usava o
// adapter genérico `cnab240-generico.adapter.ts` (CNAB 240) — mas o manual
// oficial do Safra é literalmente chamado "LAYOUT PADRÃO SAFRA 400", e um
// arquivo de retorno real do convênio fornecido numa sessão anterior
// (RETORNO_001INSTUNIR....txt) também já era CNAB 400. O adapter genérico
// estava, portanto, no formato inteiramente errado pro Safra (não é só
// posição de campo — é padrão de arquivo diferente).
//
// ✅ CONFIRMADO (Ago/2026) contra RETORNO_001INSTUNIR0142964706.txt (arquivo
// de retorno real do convênio da FIURJ): "Cod. Empresa" do header e do
// detalhe é um código de 14 dígitos fornecido pelo banco ("13800005911236"
// pro convênio da FIURJ), NÃO uma concatenação mecânica de agência(5)+
// conta(9) — ver nota detalhada em safra-campo-livre.util.ts. Este adapter
// usa `conta.codigoCedente` diretamente como esse código (o cadastro da
// ContaBancaria precisa ter esse valor exato, copiado do arquivo do banco —
// não calculado). Também confirmados contra o mesmo arquivo real: posições
// de Nosso Número (63-71), Cod. Ocorrência (109-110), Dt. Ocorrência
// (111-116) e Valor Pago (254-266) do registro de detalhe do retorno — uma
// ocorrência real "06 - Liquidação normal" trouxe valor do título e valor
// pago idênticos (R$650,96), como esperado.
//
// ⚠️ NÃO VALIDADO ainda (pendente de mais arquivos reais):
//  1. Espécie do título (posição 148-149 do detalhe) — usamos "01"
//     (duplicata mercantil); o arquivo real de retorno também mostrou "01"
//     nessa posição pro único título observado, mas não é uma confirmação
//     definitiva de que a REMESSA deva sempre mandar esse valor.
//  2. Agência depositária (posição 143-147) — preenchida com zeros por
//     analogia ao Itaú; o arquivo real de retorno mostra um valor diferente
//     nessa posição ("00001"), mas esse campo é preenchido pelo BANCO no
//     retorno, não necessariamente o que a EMPRESA deve mandar na remessa.
// Nenhum desses 2 pontos impede o teste do fluxo no sistema, mas os dois
// precisam ser confirmados (ou o ambiente de homologação do banco) antes de
// transmitir uma remessa de verdade.

import { BancoCnab, LayoutCnab } from '@prisma/client';
import { CnabBankAdapter, BoletoParaRemessa, ContaBancariaParaRemessa, OcorrenciaParseada } from './cnab-bank-adapter.interface';
import { alfa, num, brancos, zeros, dataDDMMAA, montarLinha400, fatiaPosicional, paraNumero, paraData } from './cnab-fixo.util';
import { codigoBeneficiarioSafra, nossoNumeroComDV } from './safra-campo-livre.util';

// 6.2.2 - CÓDIGO INDICADOR DA OCORRÊNCIA (arquivo retorno) — tabela
// completa do manual oficial. Diferente da tabela do Itaú: aqui "15" é
// genuinamente uma liquidação ("Liquidação em cartório") e "41" também
// ("Liquidação de título baixado") — nenhum dos dois existe com esse
// sentido na tabela do Itaú, e o "17" que o adapter genérico CNAB240 tinha
// como liquidação nem existe nesta tabela do Safra.
const CODIGOS_OCORRENCIA: Record<string, string> = {
  '02': 'Entrada confirmada',
  '03': 'Entrada rejeitada',
  '04': 'Transferência de carteira (entrada)',
  '05': 'Transferência de carteira (baixa)',
  '06': 'Liquidação normal',
  '09': 'Baixado automaticamente',
  '10': 'Baixado conforme instruções',
  '11': 'Títulos em ser (arquivo mensal)',
  '12': 'Abatimento concedido',
  '13': 'Abatimento cancelado',
  '14': 'Vencimento alterado',
  '15': 'Liquidação em cartório',
  '19': 'Confirmação de instrução de protesto',
  '20': 'Confirmação de sustar protesto',
  '21': 'Transferência de beneficiário',
  '23': 'Título enviado a cartório',
  '40': 'Baixa de título protestado',
  '41': 'Liquidação de título baixado',
  '42': 'Título retirado do cartório',
  '43': 'Despesa de cartório',
  '44': 'Aceite do título DDA pelo pagador',
  '45': 'Não aceite do título DDA pelo pagador',
  '51': 'Valor do título alterado',
  '52': 'Acerto de data de emissão',
  '53': 'Acerto de código espécie do documento',
  '54': 'Alteração de seu número',
  '56': 'Instrução negativação aceita',
  '57': 'Instrução baixa de negativação aceita',
  '58': 'Instrução não negativar aceita',
};

// Únicos 3 códigos de liquidação de verdade da tabela oficial do Safra —
// ver nota acima sobre a diferença pra tabela do Itaú.
const CODIGOS_LIQUIDACAO = new Set(['06', '15', '41']);

function codEmpresa(conta: ContaBancariaParaRemessa): string {
  return codigoBeneficiarioSafra(conta.codigoCedente); // 14 dígitos, ver nota no topo do arquivo
}

function montarHeader(conta: ContaBancariaParaRemessa, sequencialArquivo: number, dataGeracao: Date): string {
  const campos = [
    '0',                                    // 001-001 tipo de registro
    '1',                                    // 002-002 identificação arquivo (1=remessa)
    alfa('REMESSA', 7),                     // 003-009
    '01',                                   // 010-011 código do serviço
    alfa('COBRANCA', 8),                    // 012-019
    brancos(7),                             // 020-026
    codEmpresa(conta),                      // 027-040 (14 dígitos, código do beneficiário)
    brancos(6),                             // 041-046
    alfa(conta.titular, 30),                // 047-076
    num('422', 3),                          // 077-079 código do banco
    alfa('SAFRA', 11),                      // 080-090
    brancos(4),                             // 091-094
    dataDDMMAA(dataGeracao),                // 095-100
    brancos(291),                           // 101-391
    num(sequencialArquivo, 3),              // 392-394
    num(1, 6),                              // 395-400
  ];
  return montarLinha400(campos);
}

function montarDetalhe(
  boleto: BoletoParaRemessa,
  conta: ContaBancariaParaRemessa,
  sequencialArquivo: number,
  numeroRegistro: number,
  tipoOperacao: 'ENTRADA' | 'BAIXA',
): string {
  const cpfCnpjPagador = (boleto.sacadoCpfCnpj ?? '').replace(/\D/g, '');
  const tipoInscricaoPagador = cpfCnpjPagador.length > 11 ? '02' : '01';
  const valorCentavos = num(Math.round(boleto.valor * 100), 13);
  // 6.1.2 — 1 = Cobrança Simples, 2 = Cobrança Vinculada (não confundir com
  // a "carteira" numérica de 3 dígitos usada pelo Itaú/109/157).
  const codigoCarteira = num(boleto.carteira || '1', 1);

  const campos = [
    '1',                                          // 001-001 tipo de registro
    '02',                                         // 002-003 tipo inscrição empresa (02=CNPJ)
    num(conta.cnpjCpfTitular ?? '', 14),          // 004-017
    codEmpresa(conta),                            // 018-031 (14 dígitos, código do beneficiário)
    brancos(6),                                   // 032-037
    alfa(boleto.numeroDocumento, 25),             // 038-062 uso da empresa
    nossoNumeroComDV(boleto.nossoNumero),         // 063-071 nosso número (8 + DV)
    brancos(30),                                  // 072-101
    '0',                                          // 102-102 código IOF (0=isento)
    '00',                                         // 103-104 código moeda (00=Real)
    brancos(1),                                   // 105-105
    zeros(2),                                     // 106-107 3ª instrução (não usada)
    codigoCarteira,                               // 108-108
    tipoOperacao === 'BAIXA' ? '02' : '01',       // 109-110 ocorrência (01=remessa de títulos, 02=pedido de baixa)
    alfa(boleto.numeroDocumento, 10),             // 111-120 seu número
    dataDDMMAA(boleto.dataVencimento),            // 121-126
    valorCentavos,                                // 127-139
    num('422', 3),                                // 140-142 banco encarregado da cobrança
    zeros(5),                                     // 143-147 agência depositária (não confirmado — ver aviso no topo)
    '01',                                         // 148-149 espécie (duplicata mercantil — não confirmado, ver aviso)
    'N',                                          // 150-150 aceite
    dataDDMMAA(new Date()),                       // 151-156 data de emissão
    zeros(2),                                     // 157-158 1ª instrução (não usada)
    zeros(2),                                     // 159-160 2ª instrução (não usada)
    zeros(13),                                    // 161-173 juros de 1 dia (não usado)
    zeros(6),                                     // 174-179 desconto até (não usado)
    zeros(13),                                    // 180-192 valor do desconto (não usado)
    zeros(13),                                    // 193-205 valor do IOF (não usado)
    zeros(13),                                    // 206-218 abatimento/multa (não usado)
    tipoInscricaoPagador,                         // 219-220
    num(cpfCnpjPagador, 14),                      // 221-234
    alfa(boleto.sacadoNome, 40),                  // 235-274 nome do pagador
    alfa('', 40),                                 // 275-314 endereço (não coletado ainda)
    alfa('', 10),                                 // 315-324 bairro (não coletado ainda)
    brancos(2),                                   // 325-326
    zeros(8),                                     // 327-334 CEP (não coletado ainda)
    alfa('', 15),                                 // 335-349 cidade (não coletado ainda)
    alfa('', 2),                                  // 350-351 UF (não coletado ainda)
    alfa('', 30),                                 // 352-381 sacador/avalista (não usado)
    brancos(7),                                   // 382-388
    num('422', 3),                                // 389-391 banco emitente do boleto
    num(sequencialArquivo, 3),                    // 392-394
    num(numeroRegistro, 6),                       // 395-400
  ];
  return montarLinha400(campos);
}

function montarTrailer(sequencialArquivo: number, quantidadeRegistros: number, valorTotal: number): string {
  const numeroRegistro = quantidadeRegistros + 2; // header + detalhes + este trailer
  const campos = [
    '9',                                           // 001-001
    brancos(367),                                  // 002-368
    num(quantidadeRegistros, 8),                   // 369-376
    num(Math.round(valorTotal * 100), 15),         // 377-391
    num(sequencialArquivo, 3),                     // 392-394
    num(numeroRegistro, 6),                        // 395-400
  ];
  return montarLinha400(campos);
}

// Posições do registro de detalhe do RETORNO (linhas que começam com "1"),
// conforme "6.2 - ARQUIVO RETORNO - DETALHE" do manual oficial. O Nosso
// Número aqui tem 9 posições (63-71, sequencial + DV) — só usamos as 8
// primeiras (63-70) porque o DV não faz parte do valor gravado em
// Boleto.nossoNumero (mesma convenção do campo livre/detalhe da remessa).
const POS = {
  nossoNumero: [63, 70] as const,
  codigoOcorrencia: [109, 110] as const,
  dataOcorrencia: [111, 116] as const,
  valorAbatimento: [228, 240] as const,
  valorDesconto: [241, 253] as const,
  valorPago: [254, 266] as const,
  valorJuros: [267, 279] as const,
};

function parseLinhaDetalhe(linha: string): OcorrenciaParseada | null {
  if (linha.length < 400) return null; // registro CNAB 400 completo

  const nossoNumero = fatiaPosicional(linha, ...POS.nossoNumero).replace(/^0+(?=\d)/, '') || '0';
  const codigo = fatiaPosicional(linha, ...POS.codigoOcorrencia);
  const dataOcorrencia = paraData(fatiaPosicional(linha, ...POS.dataOcorrencia)) ?? new Date();
  const valorPagoCentavos = paraNumero(fatiaPosicional(linha, ...POS.valorPago));
  const valorJurosCentavos = paraNumero(fatiaPosicional(linha, ...POS.valorJuros));
  const valorDescontoCentavos = paraNumero(fatiaPosicional(linha, ...POS.valorDesconto));

  return {
    nossoNumero: nossoNumero.padStart(8, '0'),
    codigoOcorrencia: codigo,
    descricaoOcorrencia: CODIGOS_OCORRENCIA[codigo] ?? `Ocorrência ${codigo} (código não mapeado)`,
    dataOcorrencia,
    valorPago: valorPagoCentavos > 0 ? valorPagoCentavos / 100 : undefined,
    valorJuros: valorJurosCentavos > 0 ? valorJurosCentavos / 100 : undefined,
    valorDesconto: valorDescontoCentavos > 0 ? valorDescontoCentavos / 100 : undefined,
    liquidacao: CODIGOS_LIQUIDACAO.has(codigo),
  };
}

export const safraAdapter: CnabBankAdapter = {
  banco: BancoCnab.SAFRA,
  layout: LayoutCnab.CNAB400,

  gerarRemessa({ boletos, conta, sequencial, dataGeracao, tipoOperacao = 'ENTRADA' }) {
    const linhas: string[] = [];
    linhas.push(montarHeader(conta, sequencial, dataGeracao));
    boletos.forEach((b, i) => linhas.push(montarDetalhe(b, conta, sequencial, i + 2, tipoOperacao)));
    const valorTotal = boletos.reduce((soma, b) => soma + b.valor, 0);
    linhas.push(montarTrailer(sequencial, boletos.length, valorTotal));
    return linhas.join('\r\n') + '\r\n';
  },

  parseRetorno(conteudoArquivo: string): OcorrenciaParseada[] {
    const linhas = conteudoArquivo.split(/\r?\n/).filter(l => l.length > 0);
    const ocorrencias: OcorrenciaParseada[] = [];
    for (const linha of linhas) {
      if (linha[0] !== '1') continue; // ignora header (0) e trailer (9)
      const ocorrencia = parseLinhaDetalhe(linha);
      if (ocorrencia) ocorrencias.push(ocorrencia);
    }
    return ocorrencias;
  },
};
