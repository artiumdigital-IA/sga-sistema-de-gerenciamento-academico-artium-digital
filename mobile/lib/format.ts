/**
 * lib/format.ts — formatação de datas "só calendário" (sem hora).
 *
 * Mesmo bug/fix do frontend web (ver frontend/lib/format.ts): campos
 * `@db.Date` do Prisma (ex.: Aluno.dataIngresso) chegam como ISO com
 * horário zerado em UTC ("2026-07-06T00:00:00.000Z"). `new
 * Date(iso).toLocaleDateString()` converte esse instante pro fuso do
 * aparelho — no Brasil (UTC-3), isso empurra a meia-noite UTC pro dia
 * anterior, exibindo a data errada. Lendo os componentes em UTC
 * (`getUTC*`) em vez de deixar o `Date` converter pro fuso local, a data
 * exibida é sempre a mesma que foi gravada.
 */
export function formatarData(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Variante "mês curto + ano" (ex.: carteirinha "mar/2027"), mesma lógica UTC. */
export function formatarDataMesAno(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return `${MESES_ABREV[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}
