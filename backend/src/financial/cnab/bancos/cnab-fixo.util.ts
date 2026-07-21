// Helpers de campo de largura fixa pra montar linhas de arquivo CNAB —
// reaproveitados por qualquer adapter de banco (Itaú agora, Safra/Santander/
// Caixa na Fase 4).

// Remove acentos via \p{Diacritic} (Unicode property escape) em vez de um
// range de caracteres combinantes literal no código-fonte — mesma decisão
// já tomada na busca da Barra Rápida (RightPanel.tsx), pra não arriscar
// corromper o arquivo por causa de caractere combinante invisível no editor.
export function alfa(valor: string, tamanho: number): string {
  const limpo = (valor ?? '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return limpo.slice(0, tamanho).padEnd(tamanho, ' ');
}

export function num(valor: number | string, tamanho: number): string {
  const digitos = String(valor).replace(/\D/g, '') || '0';
  return digitos.slice(-tamanho).padStart(tamanho, '0');
}

export function brancos(tamanho: number): string {
  return ' '.repeat(tamanho);
}

export function zeros(tamanho: number): string {
  return '0'.repeat(tamanho);
}

export function dataDDMMAA(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const aa = String(d.getUTCFullYear()).slice(-2);
  return `${dd}${mm}${aa}`;
}

// Monta uma linha CNAB 400 a partir de uma lista de [valor, tamanho] e valida
// que o total fecha em 400 — pega erro de campo (tamanho errado/faltando)
// na hora de gerar, em vez de mandar arquivo corrompido pro banco.
export function montarLinha400(campos: string[]): string {
  const linha = campos.join('');
  if (linha.length !== 400) {
    throw new Error(`Linha CNAB 400 malformada: ${linha.length} caracteres (esperado 400).`);
  }
  return linha;
}
