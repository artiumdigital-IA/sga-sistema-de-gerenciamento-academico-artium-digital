// Campo livre (25 posições) e dígito verificador do Nosso Número — formato
// Itaú (banco 341), amplamente documentado em bibliotecas de boleto
// brasileiras de código aberto.
//
// ⚠️ NÃO VALIDADO contra o manual técnico oficial do Itaú (não temos acesso
// a ele nesta sessão) — antes do primeiro envio real de remessa, conferir
// contra a documentação oficial ou o ambiente de homologação do banco. Ver
// seção "Riscos" do plano de implementação do módulo CNAB.
//
// Campo livre Itaú (25 dígitos):
//   posições 1-3   (3): carteira
//   posições 4-11  (8): nosso número (sem DV)
//   posição  12    (1): DV do nosso número
//   posições 13-16 (4): agência
//   posições 17-21 (5): conta corrente
//   posições 22-24 (3): "000" fixo
//   posição  25    (1): "0" fixo

// DV do Nosso Número — módulo 11 sobre agência(4) + carteira(3) + nosso
// número(8) = 15 dígitos, pesos 2 a 7 ciclando da direita pra esquerda.
// Resto 0 ou 1 → DV "0".
export function dvNossoNumeroItau(agencia: string, carteira: string, nossoNumero: string): string {
  const base = `${agencia.padStart(4, '0')}${carteira.padStart(3, '0')}${nossoNumero.padStart(8, '0')}`;
  let peso = 2;
  let soma = 0;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += Number(base[i]) * peso;
    peso = peso === 7 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto === 0 || resto === 1 ? '0' : String(11 - resto);
}

// Agência/conta costumam vir com "-DV" no cadastro (ex.: "1234-5") — só os
// dígitos entram no campo livre.
const soDigitos = (s: string) => s.replace(/\D/g, '');

export function montarCampoLivreItau(params: {
  agencia: string;
  contaCorrente: string;
  carteira: string;
  nossoNumero: string; // 8 dígitos, sem DV
}): string {
  const agencia = soDigitos(params.agencia).padStart(4, '0').slice(-4);
  const contaCorrente = soDigitos(params.contaCorrente).padStart(5, '0').slice(-5);
  const carteira = soDigitos(params.carteira).padStart(3, '0').slice(-3);
  const nossoNumero = soDigitos(params.nossoNumero).padStart(8, '0').slice(-8);
  const dv = dvNossoNumeroItau(agencia, carteira, nossoNumero);

  return `${carteira}${nossoNumero}${dv}${agencia}${contaCorrente}0000`;
}
