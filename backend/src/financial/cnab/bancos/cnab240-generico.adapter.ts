// Adapter genérico CNAB 240 — usado por Safra, Santander e Caixa (Fase 4).
//
// ⚠️⚠️ CONFIANÇA MENOR que o adapter do Itaú (CNAB 400, banco piloto já
// testado com auto-consistência e usado como referência de risco no plano).
// CNAB 240 é mais padronizado entre bancos que CNAB 400 (é um padrão
// nacional FEBRABAN desenhado justamente pra unificar layout entre bancos),
// então o Header de Arquivo/Lote e os Trailers abaixo têm boa base — mas o
// Segmento P (nosso número, carteira) e principalmente a leitura do
// Segmento T/U no retorno têm posições específicas por banco que este
// adapter trata de forma GENÉRICA (mesma posição pros 3 bancos), sem
// nenhuma validação real. **Não usar em produção sem validar linha a linha
// contra o manual técnico de cada banco ou o ambiente de homologação.**
// Ver seção "Riscos" do plano de implementação do módulo CNAB.

import { BancoCnab, LayoutCnab } from '@prisma/client';
import { CnabBankAdapter, BoletoParaRemessa, ContaBancariaParaRemessa, OcorrenciaParseada } from './cnab-bank-adapter.interface';
import { alfa, num, brancos, zeros, dataDDMMAAAA, montarLinha240, fatiaPosicional, paraNumero } from './cnab-fixo.util';

const CODIGOS_OCORRENCIA: Record<string, string> = {
  '02': 'Confirmação de entrada do título (registrado)',
  '03': 'Entrada rejeitada',
  '06': 'Liquidação normal',
  '09': 'Baixado automaticamente via arquivo',
  '10': 'Baixado conforme instruções da agência',
  '15': 'Liquidação em cartório',
  '17': 'Liquidação após baixa ou título não registrado',
  '23': 'Remessa a cartório',
  '25': 'Protestado e baixado (manutenção em carteira)',
  '28': 'Débito de tarifas',
};
const CODIGOS_LIQUIDACAO = new Set(['06', '15', '17']);

export interface ConfigBancoCnab240 {
  banco: BancoCnab;
  codigoBancoFebraban: string;
  nomeBanco: string;
}

function montarFileHeader(conta: ContaBancariaParaRemessa, cfg: ConfigBancoCnab240, sequencial: number, dataGeracao: Date): string {
  const cnpj = (conta.cnpjCpfTitular ?? '').replace(/\D/g, '');
  const campos = [
    num(cfg.codigoBancoFebraban, 3),
    zeros(4),                          // lote de serviço do header de arquivo
    '0',                                // tipo de registro
    brancos(9),
    cnpj.length > 11 ? '02' : '01',
    num(cnpj, 14),
    alfa(conta.codigoCedente, 20),
    num(conta.agencia, 5),
    brancos(1),                        // DV agência (não calculado)
    num(conta.numeroConta, 12),
    brancos(1),                        // DV conta (não calculado)
    brancos(1),                        // DV agência/conta
    alfa(conta.titular, 30),
    alfa(cfg.nomeBanco, 30),
    brancos(5),
    '1',                                // 1 = remessa
    dataDDMMAAAA(dataGeracao),
    zeros(6),                          // hora (não crítico, zerado)
    num(sequencial, 7),
    num('103', 3),                     // versão do layout (convenção comum)
    brancos(3),
    brancos(25),
    brancos(20),
    brancos(29),
  ];
  return montarLinha240(campos);
}

function montarLoteHeader(conta: ContaBancariaParaRemessa, cfg: ConfigBancoCnab240): string {
  const cnpj = (conta.cnpjCpfTitular ?? '').replace(/\D/g, '');
  const campos = [
    num(cfg.codigoBancoFebraban, 3),
    num('1', 4),
    '1',                                // tipo de registro
    'R',                                // tipo de operação (remessa)
    '01',                               // tipo de serviço (cobrança)
    brancos(2),
    num('30', 3),                      // versão do layout do lote (convenção comum)
    brancos(1),
    cnpj.length > 11 ? '02' : '01',
    num(cnpj, 14),
    alfa(conta.codigoCedente, 20),
    num(conta.agencia, 5),
    brancos(1),
    num(conta.numeroConta, 12),
    brancos(1),
    brancos(1),
    alfa(conta.titular, 30),
    // Endereço do cedente, mensagens livres e demais campos opcionais do
    // header de lote — não coletados/usados ainda, um único bloco reservado
    // (137 = 240 - 103 já usados acima) garante o total correto.
    brancos(137),
  ];
  return montarLinha240(campos);
}

function montarSegmentoP(boleto: BoletoParaRemessa, conta: ContaBancariaParaRemessa, cfg: ConfigBancoCnab240, numeroSequencial: number): string {
  const nossoNumero20 = num(boleto.nossoNumero, 20);
  const valorCentavos = num(Math.round(boleto.valor * 100), 15);
  const campos = [
    num(cfg.codigoBancoFebraban, 3),
    num('1', 4),
    '3',                                // tipo de registro
    num(numeroSequencial, 5),
    'P',                                // segmento
    brancos(1),
    '01',                               // código de movimento (entrada de título)
    num(conta.agencia, 5),
    brancos(1),
    num(conta.numeroConta, 12),
    brancos(1),
    brancos(1),
    alfa(boleto.carteira, 3),
    '1',                                // forma de cadastramento (registrada)
    '2',                                // tipo de documento
    '2',                                // emissão do boleto pelo banco
    '2',                                // distribuição pelo banco
    nossoNumero20,
    '1',                                // código da carteira (registrada)
    '2',                                // código do documento
    alfa(boleto.numeroDocumento, 16),
    dataDDMMAAAA(boleto.dataVencimento),
    valorCentavos,
    zeros(3),
    brancos(1),
    '01',                               // espécie do título
    'N',                                // aceite
    dataDDMMAAAA(new Date()),
    zeros(2),
    zeros(8),
    zeros(15),
    zeros(2),
    zeros(8),
    zeros(15),
    zeros(15),
    zeros(15),
    alfa(boleto.numeroDocumento, 20),
    '3',                                // código pra protesto (3 = não protestar)
    zeros(2),
    '3',                                // código pra baixa/devolução (3 = não baixar)
    zeros(3),
    '09',                               // código da moeda (Real)
    zeros(10),
    brancos(1),
  ];
  return montarLinha240(campos);
}

function montarSegmentoQ(boleto: BoletoParaRemessa, numeroSequencial: number, cfg: ConfigBancoCnab240): string {
  const cpfCnpj = (boleto.sacadoCpfCnpj ?? '').replace(/\D/g, '');
  const campos = [
    num(cfg.codigoBancoFebraban, 3),
    num('1', 4),
    '3',
    num(numeroSequencial, 5),
    'Q',
    brancos(1),
    '01',
    cpfCnpj.length > 11 ? '02' : '01',
    num(cpfCnpj, 15),
    alfa(boleto.sacadoNome, 40),
    alfa('', 40),                      // endereço (não coletado ainda)
    alfa('', 15),                      // bairro
    zeros(8),                          // CEP
    alfa('', 15),                      // cidade
    alfa('', 2),                       // UF
    zeros(2),
    zeros(15),
    alfa('', 40),                      // sacador/avalista
    brancos(2),
    zeros(8),
    brancos(19),
  ];
  return montarLinha240(campos);
}

function montarLoteTrailer(cfg: ConfigBancoCnab240, quantidadeRegistros: number): string {
  const campos = [
    num(cfg.codigoBancoFebraban, 3),
    num('1', 4),
    '5',
    brancos(9),
    num(quantidadeRegistros + 2, 6),   // header + segmentos (P+Q por boleto) + este trailer
    zeros(6),
    zeros(17),
    zeros(6),
    zeros(17),
    zeros(6),
    zeros(17),
    zeros(6),
    zeros(17),
    brancos(125),
  ];
  return montarLinha240(campos);
}

function montarFileTrailer(quantidadeLinhasArquivo: number, cfg: ConfigBancoCnab240): string {
  const campos = [
    num(cfg.codigoBancoFebraban, 3),
    num('9999', 4),
    '9',
    brancos(9),
    num('1', 6),                       // quantidade de lotes
    num(quantidadeLinhasArquivo, 6),
    zeros(6),
    brancos(205),
  ];
  return montarLinha240(campos);
}

function extrairOcorrenciaSegmentoT(linha: string): OcorrenciaParseada | null {
  // Prefixo de 15 bytes é igual em qualquer segmento CNAB240 (banco+lote+
  // tipo+numseq+segmento+uso) — código de movimento em 16-17 é confiável.
  // As demais posições (nosso número, valores, datas) são um "melhor
  // esforço" e precisam de validação — ver aviso no topo do arquivo.
  if (linha.length < 240) return null;
  const codigo = fatiaPosicional(linha, 16, 17);
  // Só dígitos (campo pode vir com espaços em branco além dos zeros de
  // preenchimento) — pega os últimos 8, que é onde o nosso número real fica
  // num campo maior zero-preenchido à esquerda.
  const soDigitos = fatiaPosicional(linha, 59, 78).replace(/\D/g, '');
  const nossoNumero = (soDigitos.slice(-8) || '0').padStart(8, '0');
  const valorTituloCentavos = paraNumero(fatiaPosicional(linha, 82, 96));

  return {
    nossoNumero,
    codigoOcorrencia: codigo,
    descricaoOcorrencia: CODIGOS_OCORRENCIA[codigo] ?? `Ocorrência ${codigo} (código não mapeado)`,
    dataOcorrencia: new Date(),
    valorPago: valorTituloCentavos > 0 ? valorTituloCentavos / 100 : undefined,
    liquidacao: CODIGOS_LIQUIDACAO.has(codigo),
  };
}

export function criarAdapterCnab240(cfg: ConfigBancoCnab240): CnabBankAdapter {
  return {
    banco: cfg.banco,
    layout: LayoutCnab.CNAB240,

    gerarRemessa({ boletos, conta, sequencial, dataGeracao }) {
      const linhas: string[] = [];
      linhas.push(montarFileHeader(conta, cfg, sequencial, dataGeracao));
      linhas.push(montarLoteHeader(conta, cfg));
      let seq = 1;
      boletos.forEach(b => {
        linhas.push(montarSegmentoP(b, conta, cfg, ++seq));
        linhas.push(montarSegmentoQ(b, ++seq, cfg));
      });
      linhas.push(montarLoteTrailer(cfg, boletos.length * 2));
      linhas.push(montarFileTrailer(linhas.length + 1, cfg));
      return linhas.join('\r\n') + '\r\n';
    },

    parseRetorno(conteudoArquivo: string): OcorrenciaParseada[] {
      const linhas = conteudoArquivo.split(/\r?\n/).filter(l => l.length > 0);
      const ocorrencias: OcorrenciaParseada[] = [];
      for (const linha of linhas) {
        // tipo de registro (posição 8) "3" = detalhe, segmento (posição 14) "T"
        if (linha[7] !== '3' || linha[13] !== 'T') continue;
        const ocorrencia = extrairOcorrenciaSegmentoT(linha);
        if (ocorrencia) ocorrencias.push(ocorrencia);
      }
      return ocorrencias;
    },
  };
}
