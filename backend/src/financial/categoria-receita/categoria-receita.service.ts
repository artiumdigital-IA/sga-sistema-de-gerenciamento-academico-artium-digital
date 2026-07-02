import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateCategoriaReceitaDto } from './dto/create-categoria-receita.dto';
import { UpdateCategoriaReceitaDto } from './dto/update-categoria-receita.dto';

@Injectable()
export class CategoriaReceitaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateCategoriaReceitaDto, usuarioId?: string) {
    const categoria = await this.prisma.categoriaReceita.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'CategoriaReceita', entidadeId: categoria.id, dadosDepois: categoria });
    }
    return categoria;
  }

  findAll() {
    return this.prisma.categoriaReceita.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoriaReceita.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoria de receita não encontrada.');
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaReceitaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const categoria = await this.prisma.categoriaReceita.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'CategoriaReceita', entidadeId: id, dadosAntes: antes, dadosDepois: categoria });
    }
    return categoria;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.categoriaReceita.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'CategoriaReceita', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Categoria de receita removida.' };
  }
}
