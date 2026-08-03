// Adapter Itaú — CNAB 400. Banco piloto do módulo CNAB (ver plano em
// C:\Users\fiurj\.claude\plans\wiggly-rolling-stearns.md).
//
// ✅ VALIDADO (Ago/2026) contra o manual técnico oficial do Itaú
// ("COBRANÇA BANCÁRIA — Intercâmbio Eletrônico de Arquivos", Janeiro/2017 —
// baixado de https://download.itau.com.br/bankline/layout_cobranca_400bytes_cnab_itau.pdf)
// e conferido posição a posição contra 4 arquivos de retorno reais do
// convênio da FIURJ (CN30036A.RET, CN30036C.RET, CN28046A.RET, CN28046B.RET).
//
// Achados corrigidos nesta validação (a versão anterior nunca tinha sido
// comparada contra o manual oficial nem contra um arquivo real):
//  1. O header (registro 0) da remessa/retorno tem um campo "NOME DA EMPRESA"
//     de 30 posições entre o código do cedente e o código do banco que a
//     versão anterior simplesmente não tinha — todo campo posterior (banco,
//     data, etc.) saía deslocado 30 posições à esquerda.
//  2. O que a versão anterior chamava de "código cedente" (20 posições
//     alfanuméricas livres) na verdade são 4 campos numéricos: Agência(4) +
//     "00"(2) + Conta(5) + DAC Agência/Conta(1) + brancos(8) — confirmado
//     batendo exatamente com os arquivos reais (ex.: "809700133774" =
//     agência 8097 + "00" + conta 13377 + DAC 4).
//  3. O registro de detalhe da remessa usava um "campo livre" de 25 posições
//     (carteira+nosso número+DAC+agência+conta+zeros) igual ao do código de
//     barras — mas esse campo NÃO EXISTE no registro CNAB da remessa/retorno
//     do Itaú; agência, conta, carteira e nosso número são campos separados
//     e o nosso número vai puro (sem DAC embutido). O "campo livre" só existe
//     dentro do código de barras impresso no boleto (ver itau-campo-livre.util.ts).
//  4. Código de ocorrência da remessa: uma entrada nova (registro normal de
//     um boleto) manda código "01" — a versão anterior mandava "00" (código
//     inválido) sempre que a operação não era baixa.
//  5. Agência cobradora (remessa): o manual manda preencher com ZEROS
//     ("o Itaú define a agência pelo CEP do pagador") — a versão anterior
//     mandava brancos.
//  6. As posições do registro de detalhe do RETORNO (nosso número, código/
//     data de ocorrência, vencimento, valores) estavam com posições erradas
//     — corrigidas e conferidas contra os 4 arquivos reais (ex.: uma
//     ocorrência "06 - Liquidação normal" real tinha valor do título e
//     "valor principal" idênticos, e frequência/datas plausíveis).
//  7. A tabela de códigos de ocorrência tinha pelo menos dois erros graves:
//     código "15" era descrito como "Liquidação em cartório" (na verdade é
//     "Baixas rejeitadas") e "17" como uma liquidação (na verdade é
//     "Alteração/exclusão de dados rejeitados") — os dois eram tratados
//     como CODIGOS_LIQUIDACAO, ou seja, uma baixa ou alteração REJEITADA
//     dava baixa automática (pagamento) indevida na parcela.
//
// Campos secundários pouco usados (instrução de protesto/desconto, rateio de
// crédito, complemento multa etc.) continuam zerados/em branco — omitir
// esses recursos é sempre seguro num arquivo CNAB.

import { BancoCnab, LayoutCnab } from '@prisma/client';
import { CnabBankAdapter, BoletoParaRemessa, ContaBancariaParaRemessa, OcorrenciaParseada } from './cnab-bank-adapter.interface';
import { alfa, num, brancos, zeros, dataDDMMAA, montarLinha400, fatiaPosicional, paraNumero, paraData } from './cnab-fixo.util';
import { dacAgenciaContaItau } from './itau-campo-livre.util';

// (17) CÓDIGO DE OCORRÊNCIA (ARQUIVO RETORNO) — tabela completa do manual
// oficial (item 4, nota 17). Descrições resumidas (sem a referência às
// sub-tabelas "NOTA 20" de motivo de rejeição, que não implementamos).
const CODIGOS_OCORRENCIA: Record<string, string> = {
  '02': 'Entrada confirmada',
  '03': 'Entrada rejeitada',
  '04': 'Alteração de dados acatada (nova entrada ou alteração/exclusão)',
  '05': 'Alteração de dados - baixa',
  '06': 'Liquidação normal',
  '07': 'Liquidação parcial - Cobrança Inteligente (B2B)',
  '08': 'Liquidação em cartório',
  '09': 'Baixa simples',
  '10': 'Baixa por ter sido liquidado',
  '11': 'Em ser (só no retorno mensal)',
  '12': 'Abatimento concedido',
  '13': 'Abatimento cancelado',
  '14': 'Vencimento alterado',
  '15': 'Baixas rejeitadas',
  '16': 'Instruções rejeitadas',
  '17': 'Alteração/exclusão de dados rejeitados',
  '18': 'Cobrança contratual - instruções/alterações rejeitadas/pendentes',
  '19': 'Confirma recebimento de instrução de protesto',
  '20': 'Confirma recebimento de instrução de sustação de protesto/tarifa',
  '21': 'Confirma recebimento de instrução de não protestar',
  '23': 'Título enviado a cartório/tarifa',
  '24': 'Instrução de protesto rejeitada/sustada/pendente',
  '25': 'Alegações do pagador',
  '26': 'Tarifa de aviso de cobrança',
  '27': 'Tarifa de extrato posição (B40X)',
  '28': 'Tarifa de relação das liquidações',
  '29': 'Tarifa de manutenção de títulos vencidos',
  '30': 'Débito mensal de tarifas (para entradas e baixas)',
  '32': 'Baixa por ter sido protestado',
  '33': 'Custas de protesto',
  '34': 'Custas de sustação',
  '35': 'Custas de cartório distribuidor',
  '36': 'Custas de edital',
  '37': 'Tarifa de emissão de boleto/tarifa de envio de duplicata',
  '38': 'Tarifa de instrução',
  '39': 'Tarifa de ocorrências',
  '40': 'Tarifa mensal de emissão de boleto/tarifa mensal de envio de duplicata',
  '41': 'Débito mensal de tarifas - extrato de posição',
  '42': 'Débito mensal de tarifas - outras instruções',
  '43': 'Débito mensal de tarifas - manutenção de títulos vencidos',
  '44': 'Débito mensal de tarifas - outras ocorrências',
  '45': 'Débito mensal de tarifas - protesto',
  '46': 'Débito mensal de tarifas - sustação de protesto',
  '47': 'Baixa com transferência para desconto',
  '48': 'Custas de sustação judicial',
  '51': 'Tarifa mensal ref. a entradas bancos correspondentes na carteira',
  '52': 'Tarifa mensal baixas na carteira',
  '53': 'Tarifa mensal baixas em bancos correspondentes na carteira',
  '54': 'Tarifa mensal de liquidações na carteira',
  '55': 'Tarifa mensal de liquidações em bancos correspondentes na carteira',
  '56': 'Custas de irregularidade',
  '57': 'Instrução cancelada',
  '59': 'Baixa por crédito em C/C através do SISPAG',
  '60': 'Entrada rejeitada carnê',
  '61': 'Tarifa emissão aviso de movimentação de títulos',
  '62': 'Débito mensal de tarifa - aviso de movimentação de títulos',
  '63': 'Título sustado judicialmente',
  '64': 'Entrada confirmada com rateio de crédito',
  '65': 'Pagamento com cheque - aguardando compensação',
  '69': 'Cheque devolvido',
  '71': 'Entrada registrada, aguardando avaliação',
  '72': 'Baixa por crédito em C/C através do SISPAG sem título correspondente',
  '73': 'Confirmação de entrada na cobrança simples - não aceita na cobrança contratual',
  '74': 'Instrução de negativação expressa rejeitada',
  '75': 'Confirmação de recebimento de instrução de entrada em negativação expressa',
  '76': 'Cheque compensado',
  '77': 'Confirmação de recebimento de instrução de exclusão de negativação expressa',
  '78': 'Confirmação de recebimento de instrução de cancelamento de negativação expressa',
  '79': 'Negativação expressa informacional',
  '80': 'Confirmação de entrada em negativação expressa - tarifa',
  '82': 'Confirmação do cancelamento de negativação expressa - tarifa',
  '83': 'Confirmação de exclusão de entrada em negativação expressa por liquidação - tarifa',
  '85': 'Tarifa por boleto (até 03 envios) cobrança ativa eletrônica',
  '86': 'Tarifa email cobrança ativa eletrônica',
  '87': 'Tarifa SMS cobrança ativa eletrônica',
  '88': 'Tarifa mensal por boleto (até 03 envios) cobrança ativa eletrônica',
  '89': 'Tarifa mensal email cobrança ativa eletrônica',
  '90': 'Tarifa mensal SMS cobrança ativa eletrônica',
  '91': 'Tarifa mensal de exclusão de entrada de negativação expressa',
  '92': 'Tarifa mensal de cancelamento de negativação expressa',
  '93': 'Tarifa mensal de exclusão de negativação expressa por liquidação',
};

// Códigos que representam dinheiro efetivamente liquidado (disparam baixa
// automática da parcela) — só os três "LIQUIDAÇÃO" de verdade da tabela
// oficial. '10' (baixa por ter sido liquidado) fica de fora de propósito:
// é ambíguo se vem sempre acompanhado de um '06'/'07'/'08' anterior ou se
// pode ser o único sinal de pagamento em algum fluxo — não confirmado
// contra um arquivo real com esse código, tratar como caso a validar
// separadamente antes de incluir.
const CODIGOS_LIQUIDACAO = new Set(['06', '07', '08']);

// Carteira → código de 1 letra da posição 108 (header/detalhe), tabela (5)
// do manual. A esmagadora maioria das carteiras usa "I" (carteiras
// Diretas/Escriturais comuns) — as poucas exceções documentadas no manual
// (dólar, transferência de desconto) ficam num mapa à parte. Confirmado
// contra arquivos reais: carteiras 109 e 157 (as duas usadas pela FIURJ)
// realmente vêm com "I".
const CODIGO_LETRA_CARTEIRA: Record<string, string> = { '150': 'U', '147': 'E', '191': '1' };
function codigoLetraCarteira(carteira: string): string {
  return CODIGO_LETRA_CARTEIRA[carteira.replace(/\D/g, '').padStart(3, '0')] ?? 'I';
}

function montarHeader(conta: ContaBancariaParaRemessa, dataGeracao: Date): string {
  const dac = dacAgenciaContaItau(conta.agencia, conta.numeroConta);
  const campos = [
    '0',                                   // 001-001 tipo de registro
    '1',                                   // 002-002 tipo de operação (1=remessa)
    alfa('REMESSA', 7),                    // 003-009
    '01',                                  // 010-011 código do serviço
    alfa('COBRANCA', 15),                  // 012-026
    num(conta.agencia, 4),                 // 027-030 agência
    '00',                                  // 031-032
    num(conta.numeroConta, 5),             // 033-037 conta
    dac,                                   // 038-038 DAC agência/conta
    brancos(8),                            // 039-046
    alfa(conta.titular, 30),               // 047-076 nome da empresa
    num('341', 3),                         // 077-079 código do banco
    alfa('BANCO ITAU SA', 15),             // 080-094
    dataDDMMAA(dataGeracao),               // 095-100
    brancos(294),                          // 101-394
    num(1, 6),                             // 395-400 número sequencial do registro
  ];
  return montarLinha400(campos);
}

function montarDetalhe(boleto: BoletoParaRemessa, conta: ContaBancariaParaRemessa, numeroRegistro: number, tipoOperacao: 'ENTRADA' | 'BAIXA'): string {
  const dacAgConta = dacAgenciaContaItau(conta.agencia, conta.numeroConta);
  const cpfCnpj = (boleto.sacadoCpfCnpj ?? '').replace(/\D/g, '');
  const tipoInscricaoSacado = cpfCnpj.length > 11 ? '02' : '01';
  const valorCentavos = num(Math.round(boleto.valor * 100), 13);

  const campos = [
    '1',                                          // 001-001 tipo de registro
    '02',                                         // 002-003 tipo inscrição empresa (02=CNPJ)
    num(conta.cnpjCpfTitular ?? '', 14),          // 004-017
    num(conta.agencia, 4),                        // 018-021 agência
    '00',                                         // 022-023
    num(conta.numeroConta, 5),                    // 024-028 conta
    dacAgConta,                                   // 029-029 DAC agência/conta
    brancos(8),                                   // 030-037
    alfa(boleto.numeroDocumento, 25),             // 038-062 uso da empresa
    num(boleto.nossoNumero, 8),                   // 063-070 nosso número (sem DAC)
    zeros(13),                                    // 071-083 qtde de moeda variável (moeda=Real)
    num(boleto.carteira, 3),                      // 084-086 nº da carteira
    brancos(21),                                  // 087-107 uso do banco
    codigoLetraCarteira(boleto.carteira),         // 108-108 código da carteira
    tipoOperacao === 'BAIXA' ? '02' : '01',       // 109-110 código de ocorrência (01=entrada, 02=pedido de baixa)
    alfa(boleto.numeroDocumento, 10),             // 111-120 nº do documento
    dataDDMMAA(boleto.dataVencimento),            // 121-126
    valorCentavos,                                // 127-139 valor do título
    num('341', 3),                                // 140-142 código do banco
    zeros(5),                                     // 143-147 agência cobradora (nota 9: preencher com zeros)
    '01',                                         // 148-149 espécie (duplicata mercantil)
    'N',                                          // 150-150 aceite
    dataDDMMAA(new Date()),                       // 151-156 data de emissão
    zeros(2),                                     // 157-158 instrução 1 (não usado)
    zeros(2),                                     // 159-160 instrução 2 (não usado)
    zeros(13),                                    // 161-173 juros de 1 dia (não usado)
    zeros(6),                                     // 174-179 desconto até (não usado)
    zeros(13),                                    // 180-192 valor do desconto (não usado)
    zeros(13),                                    // 193-205 valor do IOF (não usado)
    zeros(13),                                    // 206-218 abatimento (não usado)
    tipoInscricaoSacado,                          // 219-220
    num(cpfCnpj, 14),                             // 221-234
    alfa(boleto.sacadoNome, 40),                  // 235-274 nome do pagador (30) + brancos (10), agrupados
    alfa('', 40),                                 // 275-314 logradouro (não coletado ainda)
    alfa('', 12),                                 // 315-326 bairro (não coletado ainda)
    zeros(8),                                     // 327-334 CEP (não coletado ainda)
    alfa('', 15),                                 // 335-349 cidade (não coletado ainda)
    alfa('', 2),                                  // 350-351 UF (não coletado ainda)
    alfa('', 30),                                 // 352-381 sacador/avalista (não usado)
    brancos(4),                                   // 382-385
    zeros(6),                                     // 386-391 data de mora (não usado)
    zeros(2),                                     // 392-393 prazo em dias (não usado)
    brancos(1),                                   // 394-394
    num(numeroRegistro, 6),                       // 395-400
  ];
  return montarLinha400(campos);
}

function montarTrailer(quantidadeRegistros: number): string {
  const numeroRegistro = quantidadeRegistros + 2; // header + detalhes + este trailer
  const campos = [
    '9',
    brancos(393),
    num(numeroRegistro, 6),
  ];
  return montarLinha400(campos);
}

// Posições do registro de detalhe do RETORNO (linhas que começam com "1"),
// conforme "ARQUIVO RETORNO REGISTRO DETALHE DE ARQUIVO" do manual oficial
// — conferidas contra 4 arquivos de retorno reais (nosso número, datas e
// valores batendo exatamente, inclusive um caso de liquidação normal onde
// valor do título e valor principal saíram idênticos, como esperado).
const POS = {
  nossoNumero: [63, 70] as const,
  codigoOcorrencia: [109, 110] as const,
  dataOcorrencia: [111, 116] as const,
  dataVencimento: [147, 152] as const,
  valorTitulo: [153, 165] as const,
  valorAbatimento: [228, 240] as const,
  valorDesconto: [241, 253] as const,
  // "VALOR PRINCIPAL" (valor lançado em conta corrente) = valor líquido pago.
  valorPago: [254, 266] as const,
  // "JUROS DE MORA/MULTA" — campo único no layout, não separa juros de multa.
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

export const itauAdapter: CnabBankAdapter = {
  banco: BancoCnab.ITAU,
  layout: LayoutCnab.CNAB400,

  gerarRemessa({ boletos, conta, dataGeracao, tipoOperacao = 'ENTRADA' }) {
    const linhas: string[] = [];
    linhas.push(montarHeader(conta, dataGeracao));
    boletos.forEach((b, i) => linhas.push(montarDetalhe(b, conta, i + 2, tipoOperacao)));
    linhas.push(montarTrailer(boletos.length));
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
