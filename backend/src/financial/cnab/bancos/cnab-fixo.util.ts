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

// CNAB 240 usa ano com 4 dígitos na maioria das datas (DDMMAAAA), diferente
// do CNAB 400 (DDMMAA).
export function dataDDMMAAAA(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const aaaa = String(d.getUTCFullYear());
  return `${dd}${mm}${aaaa}`;
}

export function horaHHMMSS(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}${mm}${ss}`;
}

// Mesma ideia de montarLinha400, pro layout CNAB 240 (registros de 240
// posições, organizados em segmentos dentro de um lote).
export function montarLinha240(campos: string[]): string {
  const linha = campos.join('');
  if (linha.length !== 240) {
    throw new Error(`Linha CNAB 240 malformada: ${linha.length} caracteres (esperado 240).`);
  }
  return linha;
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

// Extrai um campo de uma linha já lida (1-indexed, inclusive, igual à
// documentação de layout CNAB — fatiaPosicional(linha, 38, 62) pega os
// caracteres da posição 38 até a 62).
export function fatiaPosicional(linha: string, inicio: number, fim: number): string {
  return linha.slice(inicio - 1, fim);
}

export function paraNumero(campo: string): number {
  const n = Number(campo.replace(/\D/g, '') || '0');
  return isNaN(n) ? 0 : n;
}

export function paraData(ddmmaa: string): Date | null {
  const digitos = ddmmaa.replace(/\D/g, '');
  if (digitos.length !== 6) return null;
  const dd = Number(digitos.slice(0, 2));
  const mm = Number(digitos.slice(2, 4));
  const aa = Number(digitos.slice(4, 6));
  if (dd === 0 || mm === 0) return null;
  const anoCompleto = aa <= 50 ? 2000 + aa : 1900 + aa; // janela de século comum em CNAB
  return new Date(Date.UTC(anoCompleto, mm - 1, dd));
}
