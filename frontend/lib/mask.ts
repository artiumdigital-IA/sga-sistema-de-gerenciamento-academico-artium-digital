/**
 * mask.ts — mascaramento de dados sensíveis pra exibição em listagens.
 *
 * Bug corrigido: CPF completo aparecia direto na listagem dos módulos Alunos e
 * Professores (não só na tela de edição/detalhe) — dado sensível exposto sem
 * necessidade. `maskCpf` esconde o miolo do número, mantendo os 3 primeiros e
 * os 2 últimos dígitos visíveis (o suficiente pra reconhecimento/busca visual
 * sem expor o CPF inteiro na tela).
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11) return cpf; // formato inesperado — não mascara pra não esconder erro de dado
  return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9)}`;
}
