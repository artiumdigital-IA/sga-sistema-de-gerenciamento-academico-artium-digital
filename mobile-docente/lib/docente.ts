/**
 * lib/docente.ts — tipos e helpers pros endpoints do Menu Docente
 * (backend/src/docente/) e das telas que ele reaproveita (notas-pauta,
 * avaliações, consolidação de resultado). Toda rota do backend já resolve o
 * professor a partir do JWT (nunca recebe professorId por parâmetro) e
 * valida que a oferta/aluno pertence às turmas desse professor — o app não
 * precisa (nem consegue) escolher outro professor.
 */
import { apiFetch, apiUpload } from './api';

// ---------------------------------------------------------------------------
// Ofertas (minhas turmas) — alimenta o seletor de todas as outras telas.
// ---------------------------------------------------------------------------

export type Oferta = {
  id: string;
  turno: string;
  disciplina: { nome: string; codigo: string };
  periodoLetivo: { ano: number; semestre: string; status: string };
  _count: { matriculas: number };
};

export function getOfertas() {
  return apiFetch<Oferta[]>('/docente/ofertas');
}

export function rotuloOferta(o: Oferta): string {
  return `${o.disciplina.codigo} - ${o.disciplina.nome}`;
}

export function rotuloPeriodo(o: Oferta): string {
  return `${o.periodoLetivo.ano}/${o.periodoLetivo.semestre} · ${o.turno}`;
}

// ---------------------------------------------------------------------------
// Alunos das minhas turmas.
// ---------------------------------------------------------------------------

export type AlunoDocente = {
  aluno: {
    id: string;
    ra: string;
    nome: string;
    email: string;
    situacaoVinculo: string;
  };
  turmas: string[];
};

export function getAlunos(ofertaId?: string) {
  const qs = ofertaId ? `?ofertaId=${encodeURIComponent(ofertaId)}` : '';
  return apiFetch<AlunoDocente[]>(`/docente/alunos${qs}`);
}

// ---------------------------------------------------------------------------
// Captura de Prova (foto/PDF da prova física corrigida).
// ---------------------------------------------------------------------------

export type CapturaProva = {
  id: string;
  alunoId: string;
  ofertaId: string;
  nomeArquivo: string;
  url: string;
  tamanho: number;
  observacoes: string | null;
  criadoEm: string;
  aluno: { nome: string; ra: string };
  oferta: { disciplina: { nome: string; codigo: string } };
};

export function getCapturas(filtro: { ofertaId?: string; alunoId?: string }) {
  const params = new URLSearchParams();
  if (filtro.ofertaId) params.set('ofertaId', filtro.ofertaId);
  if (filtro.alunoId) params.set('alunoId', filtro.alunoId);
  const qs = params.toString();
  return apiFetch<CapturaProva[]>(`/docente/captura-prova${qs ? `?${qs}` : ''}`);
}

/** `arquivo` é o resultado de expo-image-picker: { uri, name, type }. */
export function criarCaptura(dados: {
  alunoId: string;
  ofertaId: string;
  observacoes?: string;
  arquivo: { uri: string; name: string; type: string };
}) {
  const formData = new FormData();
  formData.append('alunoId', dados.alunoId);
  formData.append('ofertaId', dados.ofertaId);
  if (dados.observacoes) formData.append('observacoes', dados.observacoes);
  // React Native aceita esse formato de objeto no FormData (não é o tipo File do browser).
  formData.append('arquivo', dados.arquivo as unknown as Blob);
  return apiUpload<CapturaProva>('/docente/captura-prova', formData);
}

export function removerCaptura(id: string) {
  return apiFetch<{ message: string }>(`/docente/captura-prova/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Aviso para Turma.
// ---------------------------------------------------------------------------

export type TagAviso = 'GERAL' | 'IMPORTANTE';

export const TAGS_AVISO: { value: TagAviso; label: string }[] = [
  { value: 'GERAL', label: 'Geral' },
  { value: 'IMPORTANTE', label: 'Importante' },
];

export type AvisoTurma = {
  id: string;
  titulo: string;
  texto: string;
  tag: TagAviso;
  criadoEm: string;
  oferta: { disciplina: { nome: string; codigo: string } } | null;
};

export function getAvisosTurma() {
  return apiFetch<AvisoTurma[]>('/docente/aviso-turma');
}

export function criarAvisoTurma(dto: { ofertaId: string; titulo: string; texto: string; tag: TagAviso }) {
  return apiFetch<{ aviso: AvisoTurma; push: { destinatarios: number } }>('/docente/aviso-turma', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// ---------------------------------------------------------------------------
// Pauta (AV1-AV5, 2ª chamada, recuperação, faltas) — regra semestral.
// ---------------------------------------------------------------------------

export type LinhaPauta = {
  matriculaDisciplinaId: string;
  numero: number;
  aluno: { id: string; ra: string; nome: string };
  av1: number | null;
  av2: number | null;
  av3: number | null;
  av4: number | null;
  av5: number | null;
  segundaChamada: number | null;
  recuperacao: number | null;
  faltas: number;
  media: number | null;
};

export type Pauta = {
  oferta: {
    id: string;
    disciplina: string;
    codigo: string;
    periodo: { ano: number; semestre: string };
    professor: string | null;
    turno: string;
  };
  linhas: LinhaPauta[];
};

export function getPauta(ofertaId: string) {
  return apiFetch<Pauta>(`/notas-pauta?ofertaId=${encodeURIComponent(ofertaId)}`);
}

export type SalvarPautaDto = {
  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  av4?: number | null;
  av5?: number | null;
  segundaChamada?: number | null;
  recuperacao?: number | null;
  faltas?: number;
};

export function salvarPauta(matriculaDisciplinaId: string, dto: SalvarPautaDto) {
  return apiFetch<LinhaPauta>(`/notas-pauta/${matriculaDisciplinaId}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

// ---------------------------------------------------------------------------
// Notas (avaliações individuais por tipo/peso) + consolidação de resultado.
// ---------------------------------------------------------------------------

export type AvaliacaoTipo = 'PROVA' | 'TRABALHO' | 'SEMINARIO' | 'EXAME_FINAL' | 'OUTRO';

export const TIPO_AVALIACAO_LABEL: Record<AvaliacaoTipo, string> = {
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  SEMINARIO: 'Seminário',
  EXAME_FINAL: 'Exame Final',
  OUTRO: 'Outro',
};

export type Avaliacao = {
  id: string;
  matriculaDisciplinaId: string;
  tipo: AvaliacaoTipo;
  nota: number;
  peso: number;
  criadoEm: string;
};

export type MatriculaStatus = 'MATRICULADO' | 'PENDENTE_EXAME' | 'APROVADO' | 'REPROVADO' | 'DEPENDENCIA' | 'TRANCADO' | 'CANCELADO';
export type SituacaoResultado = 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'REPROVADO_NOTA_E_FALTA';

export const STATUS_MATRICULA_LABEL: Record<MatriculaStatus, string> = {
  MATRICULADO: 'Em andamento',
  PENDENTE_EXAME: 'Aguardando exame final',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  DEPENDENCIA: 'Dependência',
  TRANCADO: 'Trancado',
  CANCELADO: 'Cancelado',
};

export const SITUACAO_RESULTADO_LABEL: Record<SituacaoResultado, string> = {
  APROVADO: 'Aprovado',
  REPROVADO_NOTA: 'Reprovado por nota',
  REPROVADO_FALTA: 'Reprovado por falta',
  REPROVADO_NOTA_E_FALTA: 'Reprovado por nota e falta',
};

export type ResultadoDisciplina = {
  id: string;
  matriculaDisciplinaId: string;
  mediaFinal: number;
  faltas: number;
  frequenciaPercentual: number;
  situacao: SituacaoResultado;
};

export type MatriculaComResultado = {
  id: string;
  status: MatriculaStatus;
  aluno: { id: string; ra: string; nome: string };
  resultado: ResultadoDisciplina | null;
};

export function getMatriculasDaOferta(ofertaId: string) {
  return apiFetch<MatriculaComResultado[]>(`/matriculas?ofertaId=${encodeURIComponent(ofertaId)}`);
}

export function getAvaliacoes(matriculaDisciplinaId: string) {
  return apiFetch<Avaliacao[]>(`/avaliacoes?matriculaDisciplinaId=${encodeURIComponent(matriculaDisciplinaId)}`);
}

export function criarAvaliacao(dto: { matriculaDisciplinaId: string; tipo: AvaliacaoTipo; nota: number; peso: number }) {
  return apiFetch<Avaliacao>('/avaliacoes', { method: 'POST', body: JSON.stringify(dto) });
}

export function removerAvaliacao(id: string) {
  return apiFetch<void>(`/avaliacoes/${id}`, { method: 'DELETE' });
}

export function consolidarResultado(matriculaDisciplinaId: string, dto: { faltas: number; totalAulas: number }) {
  return apiFetch<ResultadoDisciplina>(`/matriculas/${matriculaDisciplinaId}/consolidar`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// ---------------------------------------------------------------------------
// Formatação comum.
// ---------------------------------------------------------------------------

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatarData(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return `${formatarData(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
