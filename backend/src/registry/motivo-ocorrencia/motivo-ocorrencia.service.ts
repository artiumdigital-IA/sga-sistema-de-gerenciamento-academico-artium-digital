import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMotivoOcorrenciaDto } from './dto/create-motivo-ocorrencia.dto';
import { UpdateMotivoOcorrenciaDto } from './dto/update-motivo-ocorrencia.dto';

@Injectable()
export class MotivoOcorrenciaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMotivoOcorrenciaDto, usuarioId?: string) {
    const motivo = await this.prisma.motivoOcorrencia.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'MotivoOcorrencia', entidadeId: motivo.id, dadosDepois: motivo });
    }
    return motivo;
  }

  findAll() {
    return this.prisma.motivoOcorrencia.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const motivo = await this.prisma.motivoOcorrencia.findUnique({ where: { id } });
    if (!motivo) throw new NotFoundException('Motivo de ocorrência não encontrado.');
    return motivo;
  }

  async update(id: string, dto: UpdateMotivoOcorrenciaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const motivo = await this.prisma.motivoOcorrencia.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'MotivoOcorrencia', entidadeId: id, dadosAntes: antes, dadosDepois: motivo });
    }
    return motivo;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.motivoOcorrencia.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'MotivoOcorrencia', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Motivo removido.' };
  }
}
