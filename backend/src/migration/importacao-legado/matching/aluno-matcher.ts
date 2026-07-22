export interface AlunoResumo {
  id: string;
  nome: string;
  cpf: string;
}

export interface ResultadoMatch {
  status: 'PRONTA_CPF' | 'SUGESTAO_NOME' | 'SEM_CORRESPONDENCIA' | 'DADO_INVALIDO';
  alunoEncontradoId?: string;
  alunoSugeridoId?: string;
  scoreSugestao?: number;
  motivoPendencia?: string;
}

const LIMIAR_SIMILARIDADE_NOME = 0.7;

function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (escapado — nunca literal, ver lição de encoding do projeto)
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Similaridade de Jaccard sobre o conjunto de palavras — simples, explicável, sem lib nova. */
function similaridadeNomes(a: string, b: string): number {
  if (a === b) return 1;
  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersecao = 0;
  for (const t of tokensA) if (tokensB.has(t)) intersecao++;
  const uniao = new Set([...tokensA, ...tokensB]).size;
  return uniao === 0 ? 0 : intersecao / uniao;
}

/**
 * Casa cada linha da planilha legada contra o cadastro de `Aluno` já
 * existente. Pré-carrega o cadastro de alunos uma única vez por lote (não
 * por linha) — a tabela é pequena hoje, mesmo com a planilha tendo dezenas
 * de milhares de linhas.
 */
export class AlunoMatcher {
  private readonly porCpf: Map<string, AlunoResumo>;
  private readonly todos: { resumo: AlunoResumo; nomeNormalizado: string }[];

  constructor(alunos: AlunoResumo[]) {
    this.porCpf = new Map(alunos.map((a) => [a.cpf, a]));
    this.todos = alunos.map((a) => ({ resumo: a, nomeNormalizado: normalizarNome(a.nome) }));
  }

  match(linha: { cpfNormalizado: string | null; nome: string | null; codigoAlunoLegado: string | null }): ResultadoMatch {
    if (!linha.codigoAlunoLegado && !linha.nome) {
      return { status: 'DADO_INVALIDO', motivoPendencia: 'Linha sem código de aluno legado nem nome — não dá pra identificar a quem pertence.' };
    }

    if (linha.cpfNormalizado) {
      const aluno = this.porCpf.get(linha.cpfNormalizado);
      if (aluno) return { status: 'PRONTA_CPF', alunoEncontradoId: aluno.id };
    }

    if (!linha.nome) {
      return { status: 'SEM_CORRESPONDENCIA', motivoPendencia: 'CPF ausente/inválido e sem nome pra tentar uma sugestão por similaridade.' };
    }

    const nomeAlvo = normalizarNome(linha.nome);
    let melhor: { resumo: AlunoResumo; score: number } | null = null;
    for (const candidato of this.todos) {
      const score = similaridadeNomes(nomeAlvo, candidato.nomeNormalizado);
      if (!melhor || score > melhor.score) melhor = { resumo: candidato.resumo, score };
    }

    if (melhor && melhor.score >= LIMIAR_SIMILARIDADE_NOME) {
      return {
        status: 'SUGESTAO_NOME',
        alunoSugeridoId: melhor.resumo.id,
        scoreSugestao: melhor.score,
        motivoPendencia: `CPF ausente/inválido — nome parecido (${Math.round(melhor.score * 100)}%) com "${melhor.resumo.nome}", cadastrado no sistema. Precisa confirmação manual antes de qualquer importação.`,
      };
    }

    return { status: 'SEM_CORRESPONDENCIA', motivoPendencia: 'CPF ausente/inválido e nenhum aluno cadastrado com nome parecido o suficiente.' };
  }
}
