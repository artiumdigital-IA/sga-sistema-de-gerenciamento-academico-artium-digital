import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTipoChamadoManutencaoDto } from './dto/create-tipo-chamado-manutencao.dto';
import { UpdateTipoChamadoManutencaoDto } from './dto/update-tipo-chamado-manutencao.dto';

@Injectable()
export class TipoChamadoManutencaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTipoChamadoManutencaoDto, usuarioId?: string) {
    const tipo = await this.prisma.tipoChamadoManutencao.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'TipoChamadoManutencao', entidadeId: tipo.id, dadosDepois: tipo });
    }
    return tipo;
  }

  findAll() {
    return this.prisma.tipoChamadoManutencao.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const tipo = await this.prisma.tipoChamadoManutencao.findUnique({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de chamado não encontrado.');
    return tipo;
  }

  async update(id: string, dto: UpdateTipoChamadoManutencaoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const tipo = await this.prisma.tipoChamadoManutencao.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'TipoChamadoManutencao', entidadeId: id, dadosAntes: antes, dadosDepois: tipo });
    }
    return tipo;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.tipoChamadoManutencao.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'TipoChamadoManutencao', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Tipo de chamado removido.' };
  }
}
