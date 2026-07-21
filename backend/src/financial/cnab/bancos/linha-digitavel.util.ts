// Cálculo de dígito verificador, código de barras e linha digitável de
// boleto bancário — algoritmos genéricos definidos pela FEBRABAN, válidos
// pra qualquer banco. O "campo livre" (25 posições, específico de cada
// banco) é montado à parte em cada adapter (ver bancos/itau.adapter.ts) e
// passado pronto pra montarCodigoBarras().
//
// ⚠️ Antes do primeiro envio real ao banco, validar a saída desta função
// contra uma calculadora de linha digitável de referência e, se possível,
// o ambiente de homologação do banco — erro de posição/DV faz o banco
// rejeitar o boleto inteiro.

// Módulo 10 — usado pros dígitos verificadores de cada campo da linha
// digitável (campos 1, 2 e 3). Soma dígitos multiplicados alternadamente
// por 2 e 1 da direita pra esquerda; se o produto for >= 10, soma os
// algarismos do resultado (equivalente a subtrair 9). DV = (10 - resto) % 10.
export function modulo10(campo: string): number {
  let peso = 2;
  let soma = 0;
  for (let i = campo.length - 1; i >= 0; i--) {
    let produto = Number(campo[i]) * peso;
    if (produto >= 10) produto = Math.floor(produto / 10) + (produto % 10);
    soma += produto;
    peso = peso === 2 ? 1 : 2;
  }
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

// Módulo 11 — usado pro dígito verificador geral do código de barras (43
// posições, sem o próprio DV). Pesos de 2 a 9, ciclando da direita pra
// esquerda. Tabela FEBRABAN: resto 0, 1 ou 10 → DV = 1; senão DV = 11 - resto.
export function modulo11CodigoBarras(campo43: string): number {
  let peso = 2;
  let soma = 0;
  for (let i = campo43.length - 1; i >= 0; i--) {
    soma += Number(campo43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  if (resto === 0 || resto === 1 || resto === 10) return 1;
  return 11 - resto;
}

// Fator de vencimento — dias corridos entre a data de vencimento e a data
//-base. A FEBRABAN mudou a data-base em 22/02/2025 (o contador de 4 dígitos
// a partir da base antiga, 07/10/1997, chegaria em 9999 nessa data) — nova
// base: 22/02/2025 = fator 1000. Como este sistema só emite boleto com
// vencimento em 2026+, só a regra nova é implementada.
const FATOR_VENCIMENTO_BASE = new Date(Date.UTC(2025, 1, 22)); // 22/02/2025
const FATOR_VENCIMENTO_BASE_VALOR = 1000;

export function fatorVencimento(dataVencimento: Date): string {
  const diffMs = Date.UTC(
    dataVencimento.getUTCFullYear(), dataVencimento.getUTCMonth(), dataVencimento.getUTCDate(),
  ) - FATOR_VENCIMENTO_BASE.getTime();
  const dias = Math.round(diffMs / (24 * 60 * 60 * 1000));
  const fator = FATOR_VENCIMENTO_BASE_VALOR + dias;
  if (fator < 1000 || fator > 9999) {
    throw new Error('Data de vencimento fora do intervalo suportado pelo fator de vencimento (base 22/02/2025).');
  }
  return String(fator).padStart(4, '0');
}

export interface DadosCodigoBarras {
  codigoBancoFebraban: string; // 3 dígitos, ex.: "341"
  valor: number; // em reais (ex.: 850.00)
  dataVencimento: Date;
  campoLivre: string; // 25 dígitos, montado pelo adapter do banco
}

// Código de barras (44 dígitos): banco(3) + moeda(1, "9"=Real) + DV geral(1)
// + fator de vencimento(4) + valor em centavos(10) + campo livre(25).
export function montarCodigoBarras(dados: DadosCodigoBarras): string {
  if (dados.campoLivre.length !== 25) {
    throw new Error(`Campo livre deve ter 25 dígitos, recebeu ${dados.campoLivre.length}.`);
  }
  const banco = dados.codigoBancoFebraban.padStart(3, '0');
  const moeda = '9';
  const fator = fatorVencimento(dados.dataVencimento);
  const valorCentavos = String(Math.round(dados.valor * 100)).padStart(10, '0');

  const semDv = `${banco}${moeda}${fator}${valorCentavos}${dados.campoLivre}`; // 43 dígitos
  const dv = modulo11CodigoBarras(semDv);
  return `${banco}${moeda}${dv}${fator}${valorCentavos}${dados.campoLivre}`; // 44 dígitos
}

// Linha digitável — reorganiza o código de barras de 44 dígitos em 5 campos
// legíveis, cada um dos 3 primeiros com seu próprio DV (módulo 10); o campo
// 4 é o DV geral do código de barras e o campo 5 é fator+valor.
export function montarLinhaDigitavel(codigoBarras44: string): string {
  if (codigoBarras44.length !== 44) {
    throw new Error(`Código de barras deve ter 44 dígitos, recebeu ${codigoBarras44.length}.`);
  }
  const banco = codigoBarras44.slice(0, 3);
  const moeda = codigoBarras44.slice(3, 4);
  const dvGeral = codigoBarras44.slice(4, 5);
  const fatorValor = codigoBarras44.slice(5, 19);
  const campoLivre = codigoBarras44.slice(19, 44);

  const campo1Base = `${banco}${moeda}${campoLivre.slice(0, 5)}`; // 9 dígitos
  const campo2Base = campoLivre.slice(5, 15); // 10 dígitos
  const campo3Base = campoLivre.slice(15, 25); // 10 dígitos

  const campo1 = `${campo1Base}${modulo10(campo1Base)}`;
  const campo2 = `${campo2Base}${modulo10(campo2Base)}`;
  const campo3 = `${campo3Base}${modulo10(campo3Base)}`;

  const f = (s: string, ...tamanhos: number[]) => {
    const partes: string[] = [];
    let i = 0;
    for (const t of tamanhos) { partes.push(s.slice(i, i + t)); i += t; }
    return partes.join('.');
  };

  return [f(campo1, 5, 5), f(campo2, 5, 5), f(campo3, 5, 5), dvGeral, fatorValor].join(' ');
}
