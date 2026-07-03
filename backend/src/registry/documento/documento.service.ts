import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentoService {
  constructor(private prisma: PrismaService) {}

  async getDeclaracaoMatricula(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        curso: true,
        matrizCurricular: true,
        matriculas: {
          where: { status: 'MATRICULADO' },
          include: {
            oferta: {
              include: {
                disciplina: true,
                periodoLetivo: true,
              },
            },
          },
        },
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    // Período letivo atual (mais recente com matrícula ativa)
    const periodos = aluno.matriculas
      .map((m: any) => m.oferta.periodoLetivo)
      .filter(Boolean);
    const periodoAtual = periodos.sort((a: any, b: any) =>
      b.ano - a.ano || b.semestre.localeCompare(a.semestre)
    )[0] ?? null;

    return {
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        ra: aluno.ra,
        cpf: aluno.cpf,
        email: aluno.email,
        situacaoVinculo: aluno.situacaoVinculo,
        dataIngresso: aluno.dataIngresso,
      },
      curso: {
        nome: aluno.curso.nome,
        grau: aluno.curso.grau,
        modalidade: aluno.curso.modalidade,
        cargaHorariaTotal: aluno.curso.cargaHorariaTotal,
      },
      periodoAtual,
      disciplinasMatriculadas: aluno.matriculas.map((m: any) => ({
        disciplina: m.oferta.disciplina.nome,
        cargaHoraria: m.oferta.disciplina.cargaHoraria,
        turno: m.oferta.turno,
      })),
      geradoEm: new Date().toISOString(),
    };
  }

  /**
   * Boletim (relatório de notas/frequência) do aluno em um período letivo.
   * Se `periodoLetivoId` não for informado, usa o período mais recente em que
   * o aluno tem alguma matrícula.
   */
  async getBoletim(alunoId: string, periodoLetivoId?: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: { curso: true },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const todasMatriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      include: {
        oferta: {
          include: {
            disciplina: true,
            periodoLetivo: true,
            professor: { select: { nome: true } },
          },
        },
        resultado: true,
      },
      orderBy: { dataMatricula: 'desc' },
    });

    // Períodos distintos em que o aluno já teve matrícula, mais recente primeiro —
    // alimenta o seletor de período na tela.
    const periodosMap = new Map<
      string,
      { id: string; ano: number; semestre: string }
    >();
    for (const m of todasMatriculas) {
      const p = m.oferta.periodoLetivo;
      if (!periodosMap.has(p.id)) {
        periodosMap.set(p.id, { id: p.id, ano: p.ano, semestre: p.semestre });
      }
    }
    const periodosDisponiveis = [...periodosMap.values()].sort(
      (a, b) => b.ano - a.ano || b.semestre.localeCompare(a.semestre),
    );

    const periodoAlvoId = periodoLetivoId ?? periodosDisponiveis[0]?.id ?? null;
    const periodo = periodosDisponiveis.find(p => p.id === periodoAlvoId) ?? null;

    const matriculasDoPeriodo = todasMatriculas.filter(
      m => m.oferta.periodoLetivoId === periodoAlvoId,
    );

    return {
      aluno: { id: aluno.id, nome: aluno.nome, ra: aluno.ra, cpf: aluno.cpf },
      curso: { nome: aluno.curso.nome, grau: aluno.curso.grau },
      periodo,
      periodosDisponiveis,
      disciplinas: matriculasDoPeriodo.map((m: any) => ({
        disciplina: m.oferta.disciplina.nome,
        codigo: m.oferta.disciplina.codigo,
        cargaHoraria: m.oferta.disciplina.cargaHoraria,
        creditos: m.oferta.disciplina.creditos,
        professor: m.oferta.professor?.nome ?? '-',
        isDependencia: m.isDependencia,
        statusMatricula: m.status,
        mediaFinal: m.resultado?.mediaFinal ?? null,
        faltas: m.resultado?.faltas ?? null,
        frequenciaPercentual: m.resultado?.frequenciaPercentual ?? null,
        situacaoResultado: m.resultado?.situacao ?? null,
      })),
      geradoEm: new Date().toISOString(),
    };
  }

  /** "Emissão de Carteirinha" — dados básicos + foto (se houver, via Usuario.fotoUrl) */
  async getCarteirinha(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        curso: { select: { nome: true, grau: true } },
        usuario: { select: { fotoUrl: true } },
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    return {
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        ra: aluno.ra,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        situacaoVinculo: aluno.situacaoVinculo,
        fotoUrl: aluno.usuario?.fotoUrl ?? null,
      },
      curso: { nome: aluno.curso.nome, grau: aluno.curso.grau },
      validaAte: new Date(new Date().getFullYear() + 1, 2, 31).toISOString(),
      geradoEm: new Date().toISOString(),
    };
  }

  /**
   * Histórico Escolar Oficial — documento imprimível no layout dos modelos de referência
   * trazidos pela secretaria (histórico real da Kirsch + modelo fictício de Direito, Jul/2026):
   * cabeçalho institucional, dados do aluno, tabela por período (disciplina/professor/titulação/
   * créditos/CH/média/resultado) com totais por período, e Média Global (CR) + Integralização
   * no rodapé. CR e Integralização são recalculados aqui (mesma regra de
   * `AlunoService.calcularCR`/`calcularIntegralizacao`) — dado sempre gerado na hora, nunca
   * armazenado, pra nunca destoar de uma nota corrigida depois.
   */
  async getHistoricoOficial(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        curso: true,
        matrizCurricular: true,
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      include: {
        oferta: {
          include: {
            disciplina: true,
            periodoLetivo: true,
            professor: { select: { nome: true, titulacao: true } },
          },
        },
        resultado: true,
      },
      orderBy: { dataMatricula: 'asc' },
    });

    // Agrupa por período letivo (ano/semestre), ordenado cronologicamente
    const periodosMap = new Map<string, {
      periodoLetivoId: string; ano: number; semestre: string;
      disciplinas: any[]; totalCreditos: number; totalCh: number;
    }>();
    for (const m of matriculas) {
      const p = m.oferta.periodoLetivo;
      const key = `${p.ano}-${p.semestre}`;
      if (!periodosMap.has(key)) {
        periodosMap.set(key, {
          periodoLetivoId: p.id, ano: p.ano, semestre: p.semestre,
          disciplinas: [], totalCreditos: 0, totalCh: 0,
        });
      }
      const grupo = periodosMap.get(key)!;
      grupo.disciplinas.push({
        nome: m.oferta.disciplina.nome,
        codigo: m.oferta.disciplina.codigo,
        professor: m.oferta.professor?.nome ?? '—',
        titulacao: m.oferta.professor?.titulacao ?? null,
        creditos: m.oferta.disciplina.creditos,
        cargaHoraria: m.oferta.disciplina.cargaHoraria,
        mediaFinal: m.resultado?.mediaFinal ?? null,
        situacao: m.resultado?.situacao ?? null,
        isDependencia: m.isDependencia,
        statusMatricula: m.status,
      });
      grupo.totalCreditos += m.oferta.disciplina.creditos;
      grupo.totalCh += m.oferta.disciplina.cargaHoraria;
    }
    const periodos = Array.from(periodosMap.values()).sort((a, b) => a.ano - b.ano || a.semestre.localeCompare(b.semestre));

    const cr = this.calcularCR(matriculas);
    const integralizacao = this.calcularIntegralizacao(matriculas, aluno.curso.cargaHorariaTotal);

    return {
      aluno: {
        id: aluno.id,
        ra: aluno.ra,
        nome: aluno.nome,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        sexo: aluno.sexo,
        nacionalidade: aluno.nacionalidade,
        formaIngresso: aluno.formaIngresso,
        dataIngresso: aluno.dataIngresso,
        situacaoVinculo: aluno.situacaoVinculo,
      },
      curso: {
        nome: aluno.curso.nome,
        grau: aluno.curso.grau,
        modalidade: aluno.curso.modalidade,
        codigoEmec: aluno.curso.codigoEmec,
        cargaHorariaTotal: aluno.curso.cargaHorariaTotal,
      },
      matriz: aluno.matrizCurricular
        ? { versao: aluno.matrizCurricular.versao, anoVigencia: aluno.matrizCurricular.anoVigencia }
        : null,
      periodos,
      cr,
      integralizacao,
      geradoEm: new Date().toISOString(),
    };
  }

  /** Mesma regra de `AlunoService.calcularCR` — duplicada aqui pra manter o DocumentoService
   * autocontido (padrão já usado pelos outros métodos desta classe: consulta direto via Prisma,
   * sem depender de outro módulo). */
  private calcularCR(matriculas: Array<{
    isDependencia: boolean;
    resultado: { mediaFinal: unknown; situacao: string } | null;
    oferta: { disciplina: { creditos: number } };
  }>): number {
    let somaPonderada = 0;
    let somaCreditos = 0;
    for (const m of matriculas) {
      if (m.isDependencia) continue;
      if (!m.resultado || m.resultado.situacao !== 'APROVADO') continue;
      const media = Number(m.resultado.mediaFinal);
      const creditos = m.oferta.disciplina.creditos;
      somaPonderada += media * creditos;
      somaCreditos += creditos;
    }
    return somaCreditos > 0 ? Math.round((somaPonderada / somaCreditos) * 100) / 100 : 0;
  }

  /** Mesma regra de `AlunoService.calcularIntegralizacao` — ver nota acima. */
  private calcularIntegralizacao(
    matriculas: Array<{
      resultado: { situacao: string } | null;
      oferta: { disciplina: { id: string; cargaHoraria: number } };
    }>,
    chTotalCurso: number,
  ): { chIntegralizada: number; chTotalCurso: number; percentual: number; disciplinasIntegralizadas: number } {
    const disciplinasAprovadas = new Map<string, number>();
    for (const m of matriculas) {
      if (m.resultado?.situacao !== 'APROVADO') continue;
      disciplinasAprovadas.set(m.oferta.disciplina.id, m.oferta.disciplina.cargaHoraria);
    }
    const chIntegralizada = Array.from(disciplinasAprovadas.values()).reduce((soma, ch) => soma + ch, 0);
    const percentual = chTotalCurso > 0 ? Math.round((chIntegralizada / chTotalCurso) * 1000) / 10 : 0;
    return {
      chIntegralizada,
      chTotalCurso,
      percentual: Math.min(percentual, 100),
      disciplinasIntegralizadas: disciplinasAprovadas.size,
    };
  }
}
