// Tokens de estilo compartilhados nas telas de CNAB (boletos/remessas/retornos)
// — mesmo vocabulário visual já usado em outras telas de "gerador"/fluxo do
// SGA (ver secretaria/certificados/ui.ts), consistente com modo escuro.
export const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
export const LBL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };
export const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
export const BTN_G: React.CSSProperties = { padding: '6px 14px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: 'var(--white)', color: 'var(--gray-700)' };
export const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 };

export const STATUS_BOLETO_LABEL: Record<string, string> = {
  EMITIDO: 'Emitido', ENVIADO_REMESSA: 'Enviado (remessa)', REGISTRADO: 'Registrado',
  LIQUIDADO: 'Liquidado', REJEITADO: 'Rejeitado', CANCELADO: 'Cancelado', PROTESTADO: 'Protestado',
};
export const STATUS_BOLETO_COR: Record<string, { bg: string; fg: string }> = {
  EMITIDO: { bg: 'var(--gray-100)', fg: 'var(--gray-500)' },
  ENVIADO_REMESSA: { bg: '#dbeafe', fg: '#1e40af' },
  REGISTRADO: { bg: '#e0e7ff', fg: '#3730a3' },
  LIQUIDADO: { bg: '#d1fae5', fg: '#065f46' },
  REJEITADO: { bg: '#fee2e2', fg: '#991b1b' },
  CANCELADO: { bg: 'var(--gray-100)', fg: 'var(--gray-500)' },
  PROTESTADO: { bg: '#fef3c7', fg: '#92400e' },
};

export function StatusBadge({ status }: { status: string }) {
  const cor = STATUS_BOLETO_COR[status] ?? { bg: 'var(--gray-100)', fg: 'var(--gray-500)' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cor.bg, color: cor.fg }}>
      {STATUS_BOLETO_LABEL[status] ?? status}
    </span>
  );
}

export function fmtMoeda(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
export function fmtDataUtc(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d);
}
