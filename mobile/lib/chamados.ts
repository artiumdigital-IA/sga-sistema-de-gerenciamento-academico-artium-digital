/**
 * lib/chamados.ts — tipos e helpers pro módulo de Suporte (Chamados de
 * Manutenção, ver backend/src/registry/chamado-manutencao/). Mesmo formato
 * do mobile-docente/lib/chamados.ts — os dois apps falam com os mesmos
 * endpoints self-service (`solicitanteId` sempre resolvido pelo backend a
 * partir do JWT, nunca enviado daqui).
 */
import { apiFetch } from './api';

export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export const PRIORIDADES: { value: Prioridade; label: string }[] = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

export type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export const STATUS_CHAMADO_LABEL: Record<StatusChamado, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export type TipoChamado = { id: string; nome: string; ativo: boolean };

export type Chamado = {
  id: string;
  numero: string;
  local: string;
  prioridade: Prioridade;
  titulo: string;
  descricao: string | null;
  status: StatusChamado;
  dataAbertura: string;
  dataConclusao: string | null;
  tipo: TipoChamado;
  responsavel: { id: string; nome: string | null; email: string } | null;
};

export function getTiposChamado() {
  return apiFetch<TipoChamado[]>('/tipos-chamado-manutencao');
}

export function getMeusChamados() {
  return apiFetch<Chamado[]>('/chamados-manutencao/meus');
}

export function criarChamado(dto: { tipoId: string; local: string; prioridade: Prioridade; titulo: string; descricao?: string }) {
  return apiFetch<Chamado>('/chamados-manutencao', { method: 'POST', body: JSON.stringify(dto) });
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatarData(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
}
