import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateGastoFixoDto, UpdateGastoFixoDto } from './dto/gasto-fixo.dto';

const INCLUDE = { categoria: { select: { id: true, nome: true } } };

@Injectable()
export class GastoFixoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateGastoFixoDto, usuarioId?: string) {
    const gasto = await this.prisma.gastoFixo.create({ data: dto, include: INCLUDE });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'GastoFixo', entidadeId: gasto.id, dadosDepois: gasto });
    }
    return gasto;
  }

  findAll() {
    return this.prisma.gastoFixo.findMany({ include: INCLUDE, orderBy: { descricao: 'asc' } });
  }

  async findOne(id: string) {
    const gasto = await this.prisma.gastoFixo.findUnique({ where: { id }, include: INCLUDE });
    if (!gasto) throw new NotFoundException('Gasto fixo não encontrado.');
    return gasto;
  }

  async update(id: string, dto: UpdateGastoFixoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const gasto = await this.prisma.gastoFixo.update({ where: { id }, data: dto, include: INCLUDE });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'GastoFixo', entidadeId: id, dadosAntes: antes, dadosDepois: gasto });
    }
    return gasto;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.gastoFixo.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'GastoFixo', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Gasto fixo removido.' };
  }
}
