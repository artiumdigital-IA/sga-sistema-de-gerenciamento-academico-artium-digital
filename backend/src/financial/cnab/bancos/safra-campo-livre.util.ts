// Campo livre (25 posições) do código de barras/linha digitável do boleto
// Safra (banco 422) — produto "Cobrança Direta Eletrônica" / "Cobrança
// Registrada" (item 7.2.2 do manual). Não confundir com os outros dois
// formatos de boleto que o mesmo manual descreve pra clientes Safra:
// "Banco Correspondente Bradesco" (banco 237) e "Banco Correspondente Itaú"
// (banco 341) — a FIURJ usa o produto próprio Safra (banco 422 no código de
// barras), confirmado pelos dados reais da conta (agência 0138, conta
// 00591123-6).
//
// ✅ VALIDADO (Ago/2026) contra o manual técnico oficial do Safra
// ("Manual de Transferência de Arquivos Cobrança — Produto 001, Layout
// Padrão SAFRA 400", Dezembro/2017) e contra um arquivo de retorno REAL do
// convênio da FIURJ (RETORNO_001INSTUNIR0142964706.txt, Jul/2026).
// O cálculo do dígito de controle do Nosso Número (módulo 11) foi conferido
// batendo exatamente contra os 3 exemplos numéricos do item 7.1 do manual
// (94550200→1, 93199999→5, 26173001→1, incluindo os dois casos especiais de
// resto 0/1).
//
// ⚠️ ACHADO IMPORTANTE (corrigido nesta validação): o manual descreve o
// campo "Agência" (5 dígitos) e "Conta" (9 dígitos) do campo livre como se
// fossem simplesmente os números de agência/conta do cliente, zero-
// preenchidos à esquerda — igual à convenção do Itaú. O arquivo de retorno
// real, porém, mostrou que o "Cod. Empresa" do CNAB (mesmo par Ag(5)+Cta(9)
// citado pelo manual, campo usado no header/detalhe do arquivo) é
// "13800005911236" — e isso NÃO é "0138" (agência, zero-preenchida pra 5)
// seguido de "005911236" (conta com DV, zero-preenchida pra 9) como uma
// fórmula ingênua produziria. A parte da CONTA bate exatamente (últimos 9
// dígitos = "005911236" = "00591123-6" COM o dígito verificador incluído,
// sem tirar) — mas os 5 primeiros dígitos ("13800") não correspondem a
// nenhuma transformação óbvia de "0138". Provável explicação: o "Código do
// Beneficiário" que o Safra usa internamente no CNAB é um código
// atribuído pelo banco (visto no manual como "fornecido pelo Banco por
// ocasião do início dos testes"), não uma concatenação mecânica dos números
// de agência/conta exibidos no internet banking.
//
// Por isso este código NÃO calcula agência/conta separadamente — usa
// diretamente o "Código do Beneficiário" (14 dígitos) cadastrado em
// ContaBancaria.codigoCedente, copiado literal do arquivo real do banco
// (pro convênio da FIURJ: "13800005911236"). Isso é mais seguro que
// reproduzir uma fórmula não confirmada.
//
// Campo livre Safra (25 dígitos) — item 7.2.2 do manual, tabela
// "FORMATAÇÃO DO CÓDIGO DE BARRAS - COBRANÇA REGISTRADA":
//   posição  1     (1): "7" fixo — dígito identificador do Banco Safra
//   posições 2-15  (14): código do beneficiário (mesmo valor do "Cod.
//                        Empresa" do arquivo CNAB — ver nota acima)
//   posições 16-24 (9): nosso número (8 dígitos sequenciais + 1 DV)
//   posição  25    (1): "2" fixo — tipo de cobrança (2 = cobrança registrada)

const soDigitos = (s: string) => (s ?? '').replace(/\D/g, '');

// "Código do Beneficiário no Banco" (Cod. Empresa do CNAB) — código opaco
// de 14 dígitos fornecido pelo Safra, NÃO calculado a partir de agência e
// conta (ver nota acima). Aceita o valor já limpo ou com hífen/espaços.
export function codigoBeneficiarioSafra(codigoCedente: string): string {
  return soDigitos(codigoCedente).padStart(14, '0').slice(-14);
}

// Item 7.1 do manual — Cálculo de Dígito do Número Bancário (Nosso Número,
// módulo 11). Pesos 9,8,7,6,5,4,3,2 aplicados da ESQUERDA pra direita sobre
// os 8 dígitos sequenciais (diferente do módulo 10/11 padrão FEBRABAN usado
// em linha-digitavel.util.ts, que pesa da direita pra esquerda — esse aqui é
// o algoritmo específico do Safra pro Nosso Número, com dois casos especiais
// documentados no manual).
export function dvNossoNumeroSafra(sequencial8: string): string {
  const seq = soDigitos(sequencial8).padStart(8, '0').slice(-8);
  const pesos = [9, 8, 7, 6, 5, 4, 3, 2];
  const soma = seq.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  if (resto === 0) return '1'; // caso especial do manual
  if (resto === 1) return '0'; // caso especial do manual
  return String(11 - resto);
}

// Nosso Número + DV concatenados (9 dígitos) — mesma composição usada tanto
// no campo livre do código de barras quanto no registro de detalhe do
// arquivo CNAB (posição 63-71, ver safra.adapter.ts), então fica exportado
// à parte pra não duplicar o cálculo do DV nos dois lugares.
export function nossoNumeroComDV(nossoNumero: string): string {
  const sequencial = soDigitos(nossoNumero).padStart(8, '0').slice(-8);
  return `${sequencial}${dvNossoNumeroSafra(sequencial)}`;
}

export function montarCampoLivreSafra(params: {
  codigoCedente: string; // "Código do Beneficiário no Banco", 14 dígitos — ver nota acima
  nossoNumero: string; // 8 dígitos, sem DV
}): string {
  const codigoBeneficiario = codigoBeneficiarioSafra(params.codigoCedente);
  return `7${codigoBeneficiario}${nossoNumeroComDV(params.nossoNumero)}2`;
}
