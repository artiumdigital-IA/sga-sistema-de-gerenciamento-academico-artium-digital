/**
 * Cálculo de multa/juros de mora sobre parcela vencida — regra confirmada
 * com o usuário (Jul/2026, ajustada): multa fixa de 2% (cobrada uma única
 * vez a partir do vencimento) + juros de 1% ao mês, pró-rata por DIA
 * CORRIDO de atraso (conta sábado/domingo também), no modelo de mês
 * comercial de 30 dias. Nunca armazenado — sempre recalculado no momento
 * da consulta (mesmo padrão de CR/Integralização já usado no projeto:
 * evita ficar desatualizado).
 *
 * Data de referência pro cálculo (Jul/2026, ajustada de novo — mora
 * retroativa): parcela ainda em aberto (VENCIDO/PENDENTE) usa "hoje";
 * parcela já PAGA ou SUBSTITUÍDA (por Acordo) usa a própria data de
 * pagamento/resolução — mostra quanto de multa/juros acumulou até ali,
 * mesmo já estando quitada. CANCELADO nunca tem mora (dívida anulada).
 */

const MULTA_PERCENTUAL = 0.02;
const JUROS_MENSAL_PERCENTUAL = 0.01;
const DIAS_MES_REFERENCIA = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function inicioDoDiaUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Dias corridos decorridos entre duas datas (fim - inicio, em dias completos). */
export function contarDiasCorridos(inicio: Date, fim: Date): number {
  const ini = inicioDoDiaUtc(inicio);
  const end = inicioDoDiaUtc(fim);
  return Math.floor((end.getTime() - ini.getTime()) / MS_POR_DIA);
}

export interface CalculoMora {
  diasAtraso: number;
  multa: number;
  juros: number;
  mora: number; // multa + juros
  valorAtualizado: number; // valor original + mora
}

export function calcularMora(
  valor: number,
  dataVencimento: Date,
  status: string,
  hoje: Date = new Date(),
  dataPagamento: Date | null = null,
): CalculoMora {
  const zero: CalculoMora = { diasAtraso: 0, multa: 0, juros: 0, mora: 0, valorAtualizado: valor };

  let dataReferencia: Date;
  if (status === 'VENCIDO' || status === 'PENDENTE') {
    dataReferencia = hoje;
  } else if ((status === 'PAGO' || status === 'SUBSTITUIDA') && dataPagamento) {
    dataReferencia = dataPagamento; // mora retroativa até a quitação/resolução
  } else {
    return zero; // CANCELADO, ou PAGO/SUBSTITUIDA sem data de pagamento registrada
  }

  const diasAtraso = contarDiasCorridos(dataVencimento, dataReferencia);
  if (diasAtraso <= 0) return zero;

  const multa = Number((valor * MULTA_PERCENTUAL).toFixed(2));
  const juros = Number((valor * JUROS_MENSAL_PERCENTUAL * (diasAtraso / DIAS_MES_REFERENCIA)).toFixed(2));
  const mora = Number((multa + juros).toFixed(2));
  return { diasAtraso, multa, juros, mora, valorAtualizado: Number((valor + mora).toFixed(2)) };
}
