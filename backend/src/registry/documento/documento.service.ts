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
}
