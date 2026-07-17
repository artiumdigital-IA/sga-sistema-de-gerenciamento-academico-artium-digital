/**
 * lib/format.ts — formatação de datas "só calendário" (sem hora).
 *
 * Bug corrigido (achado no teste E2E, Jul/2026 — "Bug #6" no CLAUDE.md):
 * campos `@db.Date` do Prisma (nascimento, vencimento, pagamento, período
 * letivo, etc.) chegam do backend como ISO com horário zerado em UTC
 * (ex.: "2026-07-06T00:00:00.000Z"). `new Date(iso).toLocaleDateString()`
 * converte esse instante pro fuso do navegador — no Brasil (UTC-3), isso
 * empurra a meia-noite UTC pro dia anterior às 21h, exibindo a data errada
 * (ex.: vencimento dia 10 aparecia como dia 9).
 *
 * `formatarData()` lê os componentes em UTC (`getUTC*`) em vez de deixar o
 * `Date` converter pro fuso local — a data exibida é sempre a mesma que foi
 * gravada, independente do fuso de quem está olhando a tela.
 *
 * Não usar isso pra campos que são um instante de verdade (criadoEm,
 * atualizadoEm, ultimoLogin, dataAbertura de ticket/processo) — esses devem
 * continuar convertendo pro fuso local do navegador, que é o comportamento
 * correto pra "quando isso aconteceu de verdade".
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

/** Variante "mês curto + ano" (ex.: carteirinha "mar/2027"), mesma lógica UTC. */
export function formatarDataMesAno(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return utc.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
