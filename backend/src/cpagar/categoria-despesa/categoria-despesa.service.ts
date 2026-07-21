import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateCategoriaDespesaDto, UpdateCategoriaDespesaDto } from './dto/categoria-despesa.dto';

@Injectable()
export class CategoriaDespesaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateCategoriaDespesaDto, usuarioId?: string) {
    const categoria = await this.prisma.categoriaDespesa.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'CategoriaDespesa', entidadeId: categoria.id, dadosDepois: categoria });
    }
    return categoria;
  }

  findAll() {
    return this.prisma.categoriaDespesa.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoriaDespesa.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoria de despesa não encontrada.');
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaDespesaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const categoria = await this.prisma.categoriaDespesa.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'CategoriaDespesa', entidadeId: id, dadosAntes: antes, dadosDepois: categoria });
    }
    return categoria;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.categoriaDespesa.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'CategoriaDespesa', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Categoria de despesa removida.' };
  }
}
