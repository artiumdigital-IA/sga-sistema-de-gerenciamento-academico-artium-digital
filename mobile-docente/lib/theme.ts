/**
 * lib/theme.ts — cores base da identidade FIURJ.
 *
 * Idêntico ao mobile/lib/theme.ts (app do aluno) de propósito — os dois apps
 * compartilham a mesma identidade visual (ver CLAUDE.md). Espelha os defaults
 * do model `ConfiguracaoVisual` no backend (backend/prisma/schema.prisma).
 */
export const theme = {
  corPrimaria: '#1C3A6B',
  corSecundaria: '#C8102E',
  branco: '#FFFFFF',
  cinza50: '#F9FAFB',
  cinza100: '#F3F4F6',
  cinza200: '#E5E7EB',
  cinza400: '#9CA3AF',
  cinza500: '#6B7280',
  cinza700: '#374151',
  cinza900: '#111827',
  sucesso: '#16A34A',
  erro: '#DC2626',
  aviso: '#D97706',
};
