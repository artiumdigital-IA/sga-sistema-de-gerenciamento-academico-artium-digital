import { BancoCnab, LayoutCnab } from '@prisma/client';

export interface BoletoParaRemessa {
  nossoNumero: string;
  carteira: string;
  valor: number;
  dataVencimento: Date;
  numeroDocumento: string; // identificador que volta no retorno pra bater com o nosso registro
  sacadoNome: string;
  sacadoCpfCnpj: string | null;
}

export interface ContaBancariaParaRemessa {
  codigoBancoFebraban: string;
  agencia: string;
  numeroConta: string;
  codigoCedente: string;
  carteira: string;
  titular: string;
  cnpjCpfTitular: string | null;
}

export interface OcorrenciaParseada {
  nossoNumero: string;
  codigoOcorrencia: string;
  descricaoOcorrencia: string;
  dataOcorrencia: Date;
  valorPago?: number;
  valorJuros?: number;
  valorMulta?: number;
  valorDesconto?: number;
  // true = ocorrência de liquidação (baixa automática do título); false =
  // só atualiza status/histórico, sem mexer na parcela.
  liquidacao: boolean;
}

// Interface única de banco — cada banco implementa a geração do arquivo de
// remessa e a leitura do arquivo de retorno com o layout que lhe é próprio;
// o resto do sistema (RemessaService/RetornoService) só conhece esta
// interface, nunca o formato de arquivo de um banco específico.
export interface CnabBankAdapter {
  banco: BancoCnab;
  layout: LayoutCnab;
  gerarRemessa(params: { boletos: BoletoParaRemessa[]; conta: ContaBancariaParaRemessa; sequencial: number; dataGeracao: Date }): string;
  parseRetorno(conteudoArquivo: string): OcorrenciaParseada[];
}
