import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateOcorrenciaDto } from './dto/create-ocorrencia.dto';

@Injectable()
export class OcorrenciaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOcorrenciaDto, usuarioId?: string) {
    const [aluno, motivo] = await Promise.all([
      this.prisma.aluno.findUnique({ where: { id: dto.alunoId } }),
      this.prisma.motivoOcorrencia.findUnique({ where: { id: dto.motivoId } }),
    ]);
    if (!aluno) throw new BadRequestException('Aluno não encontrado.');
    if (!motivo) throw new BadRequestException('Motivo não encontrado.');

    const ocorrencia = await this.prisma.ocorrencia.create({
      data: {
        alunoId: dto.alunoId,
        motivoId: dto.motivoId,
        data: new Date(dto.data),
        descricao: dto.descricao,
        usuarioId,
      },
      include: { motivo: true, aluno: { select: { id: true, ra: true, nome: true } } },
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Ocorrencia', entidadeId: ocorrencia.id, dadosDepois: ocorrencia });
    }
    return ocorrencia;
  }

  findByAluno(alunoId: string) {
    return this.prisma.ocorrencia.findMany({
      where: { alunoId },
      include: { motivo: true },
      orderBy: { data: 'desc' },
    });
  }

  findAll() {
    return this.prisma.ocorrencia.findMany({
      include: { motivo: true, aluno: { select: { id: true, ra: true, nome: true } } },
      orderBy: { data: 'desc' },
    });
  }

  async resumoPorTurma() {
    const ocorrencias = await this.prisma.ocorrencia.findMany({
      include: {
        motivo: { select: { nome: true } },
        aluno: { select: { id: true, ra: true, nome: true, curso: { select: { nome: true } } } },
      },
    });

    const porCurso = new Map<string, number>();
    const porMotivo = new Map<string, number>();
    const porAluno = new Map<string, { alunoId: string; ra: string; nome: string; curso: string; total: number }>();

    for (const o of ocorrencias) {
      const curso = o.aluno.curso.nome;
      porCurso.set(curso, (porCurso.get(curso) ?? 0) + 1);

      const motivo = o.motivo.nome;
      porMotivo.set(motivo, (porMotivo.get(motivo) ?? 0) + 1);

      const chave = o.aluno.id;
      const atual = porAluno.get(chave);
      if (atual) atual.total++;
      else porAluno.set(chave, { alunoId: o.aluno.id, ra: o.aluno.ra, nome: o.aluno.nome, curso, total: 1 });
    }

    return {
      totalGeral: ocorrencias.length,
      porCurso: Array.from(porCurso.entries()).map(([curso, total]) => ({ curso, total })).sort((a, b) => b.total - a.total),
      porMotivo: Array.from(porMotivo.entries()).map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total),
      alunosComMaisOcorrencias: Array.from(porAluno.values()).sort((a, b) => b.total - a.total).slice(0, 15),
    };
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.prisma.ocorrencia.findUnique({ where: { id } });
    if (!antes) throw new NotFoundException('Ocorrência não encontrada.');
    await this.prisma.ocorrencia.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Ocorrencia', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Ocorrência removida.' };
  }
}
