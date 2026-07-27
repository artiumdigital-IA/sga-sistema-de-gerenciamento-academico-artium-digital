import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTipoRequerimentoDto } from './dto/create-tipo-requerimento.dto';
import { UpdateTipoRequerimentoDto } from './dto/update-tipo-requerimento.dto';

@Injectable()
export class TipoRequerimentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTipoRequerimentoDto, usuarioId?: string) {
    const tipo = await this.prisma.tipoRequerimentoCatalogo.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'TipoRequerimentoCatalogo', entidadeId: tipo.id, dadosDepois: tipo });
    }
    return tipo;
  }

  /** `somenteAtivos` é usado pela tabela de preços exibida pro aluno — a
   * tela de gestão (master) vê tudo, inclusive os desativados. */
  findAll(somenteAtivos = false) {
    return this.prisma.tipoRequerimentoCatalogo.findMany({
      where: somenteAtivos ? { ativo: true } : undefined,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tipo = await this.prisma.tipoRequerimentoCatalogo.findUnique({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de requerimento não encontrado.');
    return tipo;
  }

  async update(id: string, dto: UpdateTipoRequerimentoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const tipo = await this.prisma.tipoRequerimentoCatalogo.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'TipoRequerimentoCatalogo', entidadeId: id, dadosAntes: antes, dadosDepois: tipo });
    }
    return tipo;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.tipoRequerimentoCatalogo.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'TipoRequerimentoCatalogo', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Tipo de requerimento removido.' };
  }
}
