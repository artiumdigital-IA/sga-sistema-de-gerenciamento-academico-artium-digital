// Campo livre (25 posições) do código de barras/linha digitável e os
// dígitos verificadores (DAC) usados nele — formato Itaú (banco 341).
//
// ✅ VALIDADO (Ago/2026) contra o manual técnico oficial do Itaú
// ("COBRANÇA BANCÁRIA — Intercâmbio Eletrônico de Arquivos", Janeiro/2017,
// itens 7.3/7.4 e Anexos 3 e 4 — baixado de
// https://download.itau.com.br/bankline/layout_cobranca_400bytes_cnab_itau.pdf)
// e conferido posição a posição contra 4 arquivos de retorno reais do
// convênio da FIURJ (agosto/2026).
//
// Achado corrigido nesta validação: a versão anterior calculava o DAC do
// Nosso Número com módulo 11 (a fórmula certa é a do DAC GERAL do código de
// barras, Anexo 2 — usada em linha-digitavel.util.ts, essa sim correta) em
// vez do módulo 10 do Anexo 4, e também não incluía a Conta Corrente na
// sequência de cálculo, e não calculava o segundo DAC (Agência/Conta,
// Anexo 3) que ocupa a posição 22 do campo livre — as posições 22-25 saíam
// fixas como "0000" em vez de "<DAC>000". Os dois erros juntos geravam um
// DAC de Nosso Número quase sempre errado, e o boleto seria rejeitado no
// primeiro envio real.
//
// Campo livre Itaú (25 dígitos) -- item 7.3.2 do manual:
//   posições 1-3   (3): carteira
//   posições 4-11  (8): nosso número (sem DAC)
//   posição  12    (1): DAC [Agência/Conta/Carteira/Nosso Número] (Anexo 4)
//   posições 13-16 (4): agência
//   posições 17-21 (5): conta corrente (sem DAC)
//   posição  22    (1): DAC [Agência/Conta] (Anexo 3)
//   posições 23-25 (3): zeros

import { modulo10 } from './linha-digitavel.util';

// Agência/conta costumam vir com "-DV" no cadastro (ex.: "1234-5") — só os
// dígitos entram no campo livre.
const soDigitos = (s: string) => s.replace(/\D/g, '');

// Se o valor cadastrado inclui o dígito verificador (ex.: "13377-4" ou até
// "133774" sem hífen), descartar só os últimos N dígitos por posição fixa
// (padStart+slice) rouba o primeiro dígito da conta de verdade em vez de
// remover o DV — foi exatamente esse bug que gerou remessa/boleto com a
// conta errada (13377 virou 33774) em ago/2026. O DV nunca deve entrar
// aqui: ele é sempre recalculado à parte por dacAgenciaContaItau/
// dvNossoNumeroItau. Regra: se tem hífen, usa só a parte antes dele; senão,
// assume que já veio sem DV.
function semDigitoVerificador(valor: string): string {
  return soDigitos(valor.split('-')[0]);
}

export function agenciaLimpa(agencia: string): string {
  return semDigitoVerificador(agencia).padStart(4, '0').slice(-4);
}
export function contaLimpa(contaCorrente: string): string {
  return semDigitoVerificador(contaCorrente).padStart(5, '0').slice(-5);
}

// Anexo 3 do manual — DAC de Agência/Conta, módulo 10 (mesmo algoritmo do
// campo 1/2/3 da linha digitável, ver modulo10 em linha-digitavel.util.ts).
// Usado tanto na posição 22 do campo livre quanto no campo "DAC" dos
// registros header/detalhe do arquivo CNAB (mesmos 9 dígitos agência+conta
// em ambos os casos — ver itau.adapter.ts).
export function dacAgenciaContaItau(agencia: string, contaCorrente: string): string {
  return String(modulo10(`${agenciaLimpa(agencia)}${contaLimpa(contaCorrente)}`));
}

// Anexo 4 do manual — DAC do campo Agência/Conta/Carteira/Nosso Número,
// módulo 10, sobre a sequência AGÊNCIA(4) + CONTA sem DAC(5) + CARTEIRA(3)
// + NOSSO NÚMERO(8) = 20 dígitos.
//
// ⚠️ Exceção documentada no Anexo 4 e NÃO implementada aqui: as carteiras
// 126, 131, 146, 150 e 168 calculam esse DAC só sobre CARTEIRA+NOSSO NÚMERO
// (sem agência/conta). Nenhuma das carteiras vistas nos arquivos reais da
// FIURJ (109, 157) cai nessa exceção — se a FIURJ vier a contratar uma
// dessas 5 carteiras, este cálculo precisa de um caso especial.
export function dvNossoNumeroItau(agencia: string, carteira: string, nossoNumero: string, contaCorrente: string): string {
  const seq = [
    agenciaLimpa(agencia),
    contaLimpa(contaCorrente),
    soDigitos(carteira).padStart(3, '0').slice(-3),
    soDigitos(nossoNumero).padStart(8, '0').slice(-8),
  ].join('');
  return String(modulo10(seq));
}

export function montarCampoLivreItau(params: {
  agencia: string;
  contaCorrente: string;
  carteira: string;
  nossoNumero: string; // 8 dígitos, sem DAC
}): string {
  const agencia = agenciaLimpa(params.agencia);
  const contaCorrente = contaLimpa(params.contaCorrente);
  const carteira = soDigitos(params.carteira).padStart(3, '0').slice(-3);
  const nossoNumero = soDigitos(params.nossoNumero).padStart(8, '0').slice(-8);
  const dv = dvNossoNumeroItau(agencia, carteira, nossoNumero, contaCorrente);
  const dacAgConta = dacAgenciaContaItau(agencia, contaCorrente);

  return `${carteira}${nossoNumero}${dv}${agencia}${contaCorrente}${dacAgConta}000`;
}
