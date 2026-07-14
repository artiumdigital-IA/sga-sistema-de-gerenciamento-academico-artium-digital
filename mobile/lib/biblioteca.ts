/**
 * lib/biblioteca.ts — tipos e helpers pros endpoints /biblioteca/* do backend
 * (ver backend/src/library/). Diferente de lib/discente.ts (que é só rotas
 * /discente/*, todas self-service): o catálogo (/biblioteca/livros) é
 * compartilhado com o dashboard web e qualquer autenticado pode ler; só
 * "/biblioteca/emprestimos/meus" é self-service de verdade -- resolve o
 * usuário a partir do JWT (req.user.id), sem receber id na URL, mesmo
 * cuidado de IDOR do discente.ts.
 */
import { apiFetch } from './api';

export type StatusItemBiblioteca = 'DISPONIVEL' | 'EMPRESTADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO';
export type StatusEmprestimo = 'EM_ANDAMENTO' | 'DEVOLVIDO' | 'PERDIDO';

export type Livro = {
  id: string;
  titulo: string;
  autor: string;
  editora: string | null;
  categoria: string | null;
  anoPublicacao: number | null;
  exemplares?: { id: string; status: StatusItemBiblioteca }[];
};

export type Emprestimo = {
  id: string;
  tipoItem: 'LIVRO' | 'EQUIPAMENTO';
  status: StatusEmprestimo;
  emAtraso: boolean;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  exemplarLivro: { codigoTombamento: string; livro: { titulo: string; autor: string } } | null;
  equipamento: { patrimonio: string; modelo: string } | null;
};

export function getAcervo(busca?: string) {
  const qs = busca ? `?busca=${encodeURIComponent(busca)}` : '';
  return apiFetch<Livro[]>(`/biblioteca/livros${qs}`);
}

export function getMeusEmprestimos() {
  return apiFetch<Emprestimo[]>('/biblioteca/emprestimos/meus');
}

export function contagemExemplares(livro: Livro): { disponiveis: number; total: number } {
  const total = livro.exemplares?.length ?? 0;
  const disponiveis = livro.exemplares?.filter((e) => e.status === 'DISPONIVEL').length ?? 0;
  return { disponiveis, total };
}

export function descricaoItemEmprestimo(e: Emprestimo): string {
  if (e.tipoItem === 'LIVRO' && e.exemplarLivro) return `${e.exemplarLivro.livro.titulo} — ${e.exemplarLivro.codigoTombamento}`;
  if (e.tipoItem === 'EQUIPAMENTO' && e.equipamento) return `${e.equipamento.patrimonio} — ${e.equipamento.modelo}`;
  return '—';
}

const ROTULOS_STATUS_EMPRESTIMO: Record<StatusEmprestimo, string> = {
  EM_ANDAMENTO: 'Em andamento',
  DEVOLVIDO: 'Devolvido',
  PERDIDO: 'Perdido',
};

export function rotuloStatusEmprestimo(s: StatusEmprestimo): string {
  return ROTULOS_STATUS_EMPRESTIMO[s];
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatarData(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
}
