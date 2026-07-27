/**
 * lib/discente.ts — tipos e helpers pros endpoints /discente/* do backend
 * (ver backend/src/discente/discente.controller.ts e discente.service.ts).
 *
 * Diferença importante em relação a /documentos/:alunoId (usado por
 * boletim.tsx, historico.tsx, documentos.tsx): as rotas /discente/* são
 * "self-service" -- resolvem o aluno a partir do usuário logado
 * (req.user.id -> Usuario.alunoId no backend), sem receber :alunoId na URL.
 * Não têm o mesmo risco de IDOR que já corrigimos nas rotas antigas (ver
 * commit be01ffd) porque não dá pra pedir o painel/carteira de outro aluno
 * trocando um id na URL.
 */
import { apiFetch } from './api';

export type Painel = {
  aluno: { id: string; ra: string; nome: string; curso: string; situacaoVinculo: string; fotoUrl: string | null };
  progresso: { periodosCursados: number; totalPeriodos: number; percentual: number };
  cr: number;
  integralizacao: {
    chIntegralizada: number;
    chTotalCurso: number;
    percentual: number;
    disciplinasIntegralizadas: number;
  };
  documentosPendentes: number;
  protocolosAbertos: number;
};

export type Carteira = {
  aluno: {
    id: string;
    nome: string;
    ra: string;
    cpf: string;
    dataNascimento: string;
    situacaoVinculo: string;
    fotoUrl: string | null;
  };
  curso: { nome: string; grau: string };
  validaAte: string;
  codigoValidacao: string;
  geradoEm: string;
};

export type Parcela = {
  numero: number;
  valor: number;
  dataVencimento: string;
  status?: string;
  valorPago?: number | null;
};

export type ContratoFinanceiro = {
  id: string;
  status: string;
  valorTotal: number;
  numeroParcelas: number;
  periodoLetivo: { ano: number; semestre: string };
  parcelas: Parcela[];
};

export type LancamentoHoraComplementar = {
  id: string;
  horas: number;
  nomeArquivo: string;
  url: string;
  observacoes: string | null;
  criadoEm: string;
  professor: string;
};

export type HorasComplementares = {
  feitas: number;
  total: number;
  percentual: number;
  lancamentos: LancamentoHoraComplementar[];
};

export function getPainel() {
  return apiFetch<Painel>('/discente/painel');
}

export function getHorasComplementares() {
  return apiFetch<HorasComplementares>('/discente/horas-complementares');
}

export type TipoRequerimento = {
  id: string;
  nome: string;
  prazoDias: number | null;
  local: string | null;
  taxa: number;
  observacaoTaxa: string | null;
};

export type Requerimento = {
  id: string;
  tipo: string;
  descricao: string | null;
  status: string;
  resposta: string | null;
  criadoEm: string;
  tipoCatalogo: TipoRequerimento | null;
};

export function getTiposRequerimento() {
  return apiFetch<TipoRequerimento[]>('/discente/requerimentos/tipos');
}

export function getMeusRequerimentos() {
  return apiFetch<Requerimento[]>('/discente/requerimentos');
}

export function abrirRequerimento(dto: { tipoCatalogoId: string; descricao?: string }) {
  return apiFetch<Requerimento>('/discente/requerimentos', { method: 'POST', body: JSON.stringify(dto) });
}

export function formatarTaxa(t: TipoRequerimento): string {
  const valor = t.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return t.observacaoTaxa ? `${valor} (${t.observacaoTaxa})` : valor;
}

export function getCarteira() {
  return apiFetch<Carteira>('/discente/carteira');
}

export function getFinanceiro() {
  return apiFetch<ContratoFinanceiro[]>('/discente/financeiro');
}

/** Curso.grau é um enum sem acento (BACHARELADO, ESPECIALIZACAO, ...) --
 * só pra ficar apresentável na tela ("Bacharelado" em vez de "BACHARELADO"). */
const ROTULOS_GRAU: Record<string, string> = {
  BACHARELADO: 'Bacharelado',
  LICENCIATURA: 'Licenciatura',
  TECNOLOGO: 'Tecnólogo',
  ESPECIALIZACAO: 'Especialização',
  MESTRADO: 'Mestrado',
  DOUTORADO: 'Doutorado',
  POS_DOUTORADO: 'Pós-doutorado',
};

export function formatarGrau(grau: string): string {
  return ROTULOS_GRAU[grau] ?? grau;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatarData(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatarMesAno(iso: string): string {
  const d = new Date(iso);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
