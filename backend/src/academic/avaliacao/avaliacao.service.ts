import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';

@Injectable()
export class AvaliacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateAvaliacaoDto, usuarioId?: string) {
    const avaliacao = await this.prisma.avaliacao.create({
      data: { ...dto, nota: dto.nota, peso: dto.peso },
      include: { matriculaDisciplina: { include: { aluno: { select: { ra: true, nome: true } }, oferta: { include: { disciplina: true } } } } },
    });
    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Avaliacao', entidadeId: avaliacao.id, dadosDepois: avaliacao });
    return avaliacao;
  }

  findAll(matriculaDisciplinaId?: string) {
    return this.prisma.avaliacao.findMany({
      where: matriculaDisciplinaId ? { matriculaDisciplinaId } : undefined,
      include: {
        matriculaDisciplina: {
          include: {
            aluno: { select: { ra: true, nome: true } },
            oferta: { include: { disciplina: { select: { codigo: true, nome: true } }, periodoLetivo: true } },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.avaliacao.findUnique({
      where: { id },
      include: { matriculaDisciplina: { include: { aluno: true, oferta: { include: { disciplina: true } } } } },
    });
    if (!a) throw new NotFoundException(`Avaliação "${id}" não encontrada.`);
    return a;
  }

  async update(id: string, dto: UpdateAvaliacaoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const avaliacao = await this.prisma.avaliacao.update({ where: { id }, data: dto });
    await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Avaliacao', entidadeId: id, dadosAntes: antes, dadosDepois: avaliacao });
    return avaliacao;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.avaliacao.delete({ where: { id } });
    await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Avaliacao', entidadeId: id, dadosAntes: antes });
  }
}
