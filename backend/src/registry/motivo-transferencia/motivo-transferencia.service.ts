import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMotivoTransferenciaDto } from './dto/create-motivo-transferencia.dto';
import { UpdateMotivoTransferenciaDto } from './dto/update-motivo-transferencia.dto';

@Injectable()
export class MotivoTransferenciaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMotivoTransferenciaDto, usuarioId?: string) {
    const motivo = await this.prisma.motivoTransferenciaCancelamento.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'MotivoTransferenciaCancelamento', entidadeId: motivo.id, dadosDepois: motivo });
    }
    return motivo;
  }

  findAll() {
    return this.prisma.motivoTransferenciaCancelamento.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const motivo = await this.prisma.motivoTransferenciaCancelamento.findUnique({ where: { id } });
    if (!motivo) throw new NotFoundException('Motivo não encontrado.');
    return motivo;
  }

  async update(id: string, dto: UpdateMotivoTransferenciaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const motivo = await this.prisma.motivoTransferenciaCancelamento.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'MotivoTransferenciaCancelamento', entidadeId: id, dadosAntes: antes, dadosDepois: motivo });
    }
    return motivo;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.motivoTransferenciaCancelamento.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'MotivoTransferenciaCancelamento', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Motivo removido.' };
  }
}
