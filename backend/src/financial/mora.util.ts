/**
 * Cálculo de multa/juros de mora sobre parcela vencida — regra confirmada
 * com o usuário (Jul/2026, ajustada): multa fixa de 2% (cobrada uma única
 * vez a partir do vencimento) + juros de 1% ao mês, pró-rata por DIA
 * CORRIDO de atraso (conta sábado/domingo também), no modelo de mês
 * comercial de 30 dias. Nunca armazenado — sempre recalculado no momento
 * da consulta (mesmo padrão de CR/Integralização já usado no projeto:
 * evita ficar desatualizado).
 *
 * Ajuste em relação à versão anterior: a contagem era só em dias úteis
 * (segunda a sexta); agora conta todo dia corrido, incluindo fim de semana.
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

/** Só há mora se a parcela estiver vencida (não paga/cancelada/substituída) e o vencimento já passou. */
export function calcularMora(valor: number, dataVencimento: Date, status: string, hoje: Date = new Date()): CalculoMora {
  const zero: CalculoMora = { diasAtraso: 0, multa: 0, juros: 0, mora: 0, valorAtualizado: valor };
  if (status !== 'VENCIDO' && status !== 'PENDENTE') return zero;

  const diasAtraso = contarDiasCorridos(dataVencimento, hoje);
  if (diasAtraso <= 0) return zero;

  const multa = Number((valor * MULTA_PERCENTUAL).toFixed(2));
  const juros = Number((valor * JUROS_MENSAL_PERCENTUAL * (diasAtraso / DIAS_MES_REFERENCIA)).toFixed(2));
  const mora = Number((multa + juros).toFixed(2));
  return { diasAtraso, multa, juros, mora, valorAtualizado: Number((valor + mora).toFixed(2)) };
}
