// Tokens de estilo compartilhados entre as abas Frente/Verso do Gerador de
// Certificado — mesmo vocabulário visual já usado em outras telas de
// "gerador" do SGA (ver docente/gerador-prova/page.tsx), pra ficar
// consistente com o resto do sistema (inclui modo escuro via var(--...)).
export const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
export const LBL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };
export const BTN_P: React.CSSProperties = { padding: '8px 18px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
export const BTN_G: React.CSSProperties = { padding: '7px 14px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: 'var(--white)', color: 'var(--gray-700)' };
export const BTN_D: React.CSSProperties = { padding: '4px 10px', borderRadius: 5, border: '1px solid #dc2626', background: 'transparent', cursor: 'pointer', fontSize: 11.5, color: '#dc2626', fontWeight: 500 };
export const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 };
export const CHECK_LABEL: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 11.5, color: 'var(--gray-500)', cursor: 'pointer', marginTop: 6 };
