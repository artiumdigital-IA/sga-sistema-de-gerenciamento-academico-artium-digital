import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateGastoVariavelDto, UpdateGastoVariavelDto } from './dto/gasto-variavel.dto';

const INCLUDE = { categoria: { select: { id: true, nome: true } } };

@Injectable()
export class GastoVariavelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateGastoVariavelDto, usuarioId?: string) {
    const gasto = await this.prisma.gastoVariavel.create({
      data: { ...dto, data: new Date(dto.data) },
      include: INCLUDE,
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'GastoVariavel', entidadeId: gasto.id, dadosDepois: gasto });
    }
    return gasto;
  }

  findAll() {
    return this.prisma.gastoVariavel.findMany({ include: INCLUDE, orderBy: { data: 'desc' } });
  }

  async findOne(id: string) {
    const gasto = await this.prisma.gastoVariavel.findUnique({ where: { id }, include: INCLUDE });
    if (!gasto) throw new NotFoundException('Gasto variável não encontrado.');
    return gasto;
  }

  async update(id: string, dto: UpdateGastoVariavelDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const gasto = await this.prisma.gastoVariavel.update({
      where: { id },
      data: { ...dto, data: dto.data ? new Date(dto.data) : undefined },
      include: INCLUDE,
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'GastoVariavel', entidadeId: id, dadosAntes: antes, dadosDepois: gasto });
    }
    return gasto;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.gastoVariavel.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'GastoVariavel', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Gasto variável removido.' };
  }
}
