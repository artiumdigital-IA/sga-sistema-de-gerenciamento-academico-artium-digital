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

  /** "Relatório de Ocorrências - CDR - por Aluno" */
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
