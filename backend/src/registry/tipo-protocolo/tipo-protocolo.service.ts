import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTipoProtocoloDto } from './dto/create-tipo-protocolo.dto';
import { UpdateTipoProtocoloDto } from './dto/update-tipo-protocolo.dto';

@Injectable()
export class TipoProtocoloService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTipoProtocoloDto, usuarioId?: string) {
    const tipo = await this.prisma.tipoProtocolo.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'TipoProtocolo', entidadeId: tipo.id, dadosDepois: tipo });
    }
    return tipo;
  }

  findAll() {
    return this.prisma.tipoProtocolo.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const tipo = await this.prisma.tipoProtocolo.findUnique({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de protocolo não encontrado.');
    return tipo;
  }

  async update(id: string, dto: UpdateTipoProtocoloDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const tipo = await this.prisma.tipoProtocolo.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'TipoProtocolo', entidadeId: id, dadosAntes: antes, dadosDepois: tipo });
    }
    return tipo;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.tipoProtocolo.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'TipoProtocolo', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Tipo de protocolo removido.' };
  }
}
