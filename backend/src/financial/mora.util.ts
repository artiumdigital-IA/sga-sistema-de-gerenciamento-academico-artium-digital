/**
 * Cálculo de multa/juros de mora sobre parcela vencida — regra confirmada
 * com o usuário (Jul/2026): multa fixa de 2% (cobrada uma única vez a partir
 * do vencimento) + juros de 1% ao mês, pró-rata por DIA ÚTIL de atraso
 * (sábado e domingo não contam como dia de atraso). Nunca armazenado —
 * sempre recalculado no momento da consulta (mesmo padrão de CR/
 * Integralização já usado no projeto: evita ficar desatualizado).
 *
 * Taxa diária do juros = 1% / 30 (mês de referência de 30 dias, convenção
 * comum de "juros de mora de 1% ao mês" no Brasil) aplicada por dia útil
 * decorrido — não por dia corrido.
 */

const MULTA_PERCENTUAL = 0.02;
const JUROS_MENSAL_PERCENTUAL = 0.01;
const DIAS_MES_REFERENCIA = 30;

function inicioDoDiaUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Conta dias úteis (segunda a sexta) no intervalo [inicio, fim], inclusive. O(1). */
export function contarDiasUteis(inicio: Date, fim: Date): number {
  const ini = inicioDoDiaUtc(inicio);
  const end = inicioDoDiaUtc(fim);
  if (ini > end) return 0;
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const totalDias = Math.round((end.getTime() - ini.getTime()) / MS_POR_DIA) + 1;
  const semanasCompletas = Math.floor(totalDias / 7);
  let count = semanasCompletas * 5;
  const resto = totalDias % 7;
  const diaSemanaInicio = ini.getUTCDay(); // 0=domingo..6=sábado
  for (let i = 0; i < resto; i++) {
    const dow = (diaSemanaInicio + i) % 7;
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export interface CalculoMora {
  diasUteisAtraso: number;
  multa: number;
  juros: number;
  mora: number; // multa + juros
  valorAtualizado: number; // valor original + mora
}

/** Só há mora se a parcela estiver vencida (não paga/cancelada/substituída) e o vencimento já passou. */
export function calcularMora(valor: number, dataVencimento: Date, status: string, hoje: Date = new Date()): CalculoMora {
  const zero: CalculoMora = { diasUteisAtraso: 0, multa: 0, juros: 0, mora: 0, valorAtualizado: valor };
  if (status !== 'VENCIDO' && status !== 'PENDENTE') return zero;

  const diaSeguinteVencimento = new Date(Date.UTC(
    dataVencimento.getUTCFullYear(), dataVencimento.getUTCMonth(), dataVencimento.getUTCDate() + 1,
  ));
  const diasUteisAtraso = contarDiasUteis(diaSeguinteVencimento, hoje);
  if (diasUteisAtraso <= 0) return zero;

  const multa = Number((valor * MULTA_PERCENTUAL).toFixed(2));
  const juros = Number((valor * JUROS_MENSAL_PERCENTUAL * (diasUteisAtraso / DIAS_MES_REFERENCIA)).toFixed(2));
  const mora = Number((multa + juros).toFixed(2));
  return { diasUteisAtraso, multa, juros, mora, valorAtualizado: Number((valor + mora).toFixed(2)) };
}
