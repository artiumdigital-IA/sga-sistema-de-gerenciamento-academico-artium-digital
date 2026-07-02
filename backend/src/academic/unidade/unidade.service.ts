import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@Injectable()
export class UnidadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUnidadeDto, usuarioId?: string) {
    const unidade = await this.prisma.unidade.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Unidade', entidadeId: unidade.id, dadosDepois: unidade });
    }
    return unidade;
  }

  findAll() {
    return this.prisma.unidade.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const unidade = await this.prisma.unidade.findUnique({ where: { id } });
    if (!unidade) throw new NotFoundException('Unidade não encontrada.');
    return unidade;
  }

  async update(id: string, dto: UpdateUnidadeDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const unidade = await this.prisma.unidade.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Unidade', entidadeId: id, dadosAntes: antes, dadosDepois: unidade });
    }
    return unidade;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.unidade.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Unidade', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Unidade removida.' };
  }
}
