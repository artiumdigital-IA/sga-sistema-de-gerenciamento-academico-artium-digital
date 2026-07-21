// Motor de cálculo de INSS/IRRF — função pura, sem dependência do Prisma,
// pra poder ser testada isoladamente (ver ts-node de verificação usado ao
// implementar). As faixas vêm do banco (TabelaInss/TabelaIrrf, editável na
// tela) em vez de constante no código — ver aviso de risco em
// backend/prisma/schema.prisma, seção "CPAGAR".
//
// ⚠️ Tabela seed (2024) tem confiança razoável mas NÃO foi validada contra a
// publicação oficial vigente — confirmar com um contador antes de fechar
// qualquer folha real. Ver TABELA_INSS_2024/TABELA_IRRF_2024 em
// backend/prisma/seed.ts.

export interface FaixaCalculo {
  ordem: number;
  limiteInicial: number;
  limiteFinal: number | null; // null = última faixa, sem teto
  aliquota: number; // percentual, ex.: 14 = 14%
}

export interface FaixaIrrfCalculo extends FaixaCalculo {
  parcelaDeduzir: number;
}

function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

// INSS — progressivo por faixa de verdade: cada pedaço do salário que cai
// numa faixa paga a alíquota daquela faixa (não é "acha a faixa e aplica a
// alíquota dela em tudo" — isso é o erro mais comum de calcular INSS errado).
// Faixas cadastradas contíguas (limiteInicial da faixa N = limiteFinal da
// faixa N-1) — simplificação da convenção oficial de ".01" no início de
// cada faixa, sem efeito prático no valor final (diferença de centavos).
export function calcularInss(salarioBase: number, faixas: FaixaCalculo[]): { valor: number; detalhamento: { ordem: number; baseFaixa: number; aliquota: number; valorFaixa: number }[] } {
  const ordenadas = [...faixas].sort((a, b) => a.ordem - b.ordem);
  let total = 0;
  const detalhamento: { ordem: number; baseFaixa: number; aliquota: number; valorFaixa: number }[] = [];

  for (const faixa of ordenadas) {
    if (salarioBase <= faixa.limiteInicial) break; // salário não alcança essa faixa
    const tetoFaixa = faixa.limiteFinal ?? salarioBase;
    const baseFaixa = Math.min(salarioBase, tetoFaixa) - faixa.limiteInicial;
    if (baseFaixa <= 0) continue;
    const valorFaixa = round2(baseFaixa * (faixa.aliquota / 100));
    total += valorFaixa;
    detalhamento.push({ ordem: faixa.ordem, baseFaixa: round2(baseFaixa), aliquota: faixa.aliquota, valorFaixa });
    if (faixa.limiteFinal !== null && salarioBase <= faixa.limiteFinal) break;
  }

  return { valor: round2(total), detalhamento };
}

// IRRF — NÃO é progressivo por faixa como o INSS. É a "fórmula simplificada"
// que a Receita Federal publica: acha a faixa em que a base de cálculo
// inteira se encaixa, aplica a alíquota dessa faixa sobre a base inteira, e
// subtrai a parcela a deduzir daquela faixa (matematicamente equivalente ao
// cálculo progressivo de verdade, só que pré-computado). Método tradicional
// só (base = bruto − INSS − dependentes) — sem a opção de desconto
// simplificado (existe desde 2023, fora de escopo).
export function calcularIrrf(baseCalculo: number, faixas: FaixaIrrfCalculo[]): number {
  const ordenadas = [...faixas].sort((a, b) => a.ordem - b.ordem);
  for (const faixa of ordenadas) {
    const dentroDaFaixa = baseCalculo > faixa.limiteInicial && (faixa.limiteFinal === null || baseCalculo <= faixa.limiteFinal);
    if (dentroDaFaixa) {
      return round2(Math.max(0, baseCalculo * (faixa.aliquota / 100) - faixa.parcelaDeduzir));
    }
  }
  return 0; // base não bateu em nenhuma faixa (ex.: valor negativo/zero) — isento
}

export function baseCalculoIrrf(salarioBruto: number, inss: number, numeroDependentes: number, valorDeducaoPorDependente: number): number {
  return round2(Math.max(0, salarioBruto - inss - numeroDependentes * valorDeducaoPorDependente));
}

// FGTS — informativo, não é desconto do colaborador (depósito do empregador).
export function calcularFgts(salarioBruto: number): number {
  return round2(salarioBruto * 0.08);
}
