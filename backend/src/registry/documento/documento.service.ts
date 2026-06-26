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
}
