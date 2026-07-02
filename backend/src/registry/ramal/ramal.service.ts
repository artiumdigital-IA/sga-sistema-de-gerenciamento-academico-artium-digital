import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateRamalDto } from './dto/create-ramal.dto';
import { UpdateRamalDto } from './dto/update-ramal.dto';

@Injectable()
export class RamalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateRamalDto, usuarioId?: string) {
    const ramal = await this.prisma.ramal.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Ramal', entidadeId: ramal.id, dadosDepois: ramal });
    }
    return ramal;
  }

  /** Lista completa, ordenada por nome — usada tanto pelo modal (filtra ativos no front) quanto pela tela de admin. */
  findAll() {
    return this.prisma.ramal.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const ramal = await this.prisma.ramal.findUnique({ where: { id } });
    if (!ramal) throw new NotFoundException('Ramal não encontrado.');
    return ramal;
  }

  async update(id: string, dto: UpdateRamalDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const ramal = await this.prisma.ramal.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Ramal', entidadeId: id, dadosAntes: antes, dadosDepois: ramal });
    }
    return ramal;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.ramal.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Ramal', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Ramal removido.' };
  }
}
