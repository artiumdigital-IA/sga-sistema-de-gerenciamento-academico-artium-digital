import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateProcessoSeletivoDto } from './dto/create-processo-seletivo.dto';
import { UpdateProcessoSeletivoDto } from './dto/update-processo-seletivo.dto';

@Injectable()
export class ProcessoSeletivoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateProcessoSeletivoDto, userId?: string) {
    const item = await (this.prisma as any).processoSeletivo.create({
      data: {
        ...dto,
        dataAbertura: new Date(dto.dataAbertura),
        dataEncerramento: new Date(dto.dataEncerramento),
      },
      include: { curso: true, periodoLetivo: true },
    });
    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'ProcessoSeletivo', entidadeId: item.id, dadosDepois: item });
    return item;
  }

  findAll(cursoId?: string) {
    return (this.prisma as any).processoSeletivo.findMany({
      where: cursoId ? { cursoId } : undefined,
      include: { curso: true, periodoLetivo: true, _count: { select: { inscricoes: true } } },
      orderBy: [{ dataAbertura: 'desc' }],
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).processoSeletivo.findUnique({
      where: { id },
      include: { curso: true, periodoLetivo: true, inscricoes: { include: { candidato: true } } },
    });
    if (!item) throw new NotFoundException('Processo seletivo não encontrado');
    return item;
  }

  async update(id: string, dto: UpdateProcessoSeletivoDto, userId?: string) {
    const before = await this.findOne(id);
    const data: any = { ...dto };
    if ((dto as any).dataAbertura) data.dataAbertura = new Date((dto as any).dataAbertura);
    if ((dto as any).dataEncerramento) data.dataEncerramento = new Date((dto as any).dataEncerramento);
    const updated = await (this.prisma as any).processoSeletivo.update({ where: { id }, data, include: { curso: true, periodoLetivo: true } });
    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'ProcessoSeletivo', entidadeId: id, dadosAntes: before, dadosDepois: updated });
    return updated;
  }

  async remove(id: string, userId?: string) {
    const before = await this.findOne(id);
    await (this.prisma as any).processoSeletivo.delete({ where: { id } });
    await this.audit.log({ usuarioId: userId, acao: 'DELETE', entidade: 'ProcessoSeletivo', entidadeId: id, dadosAntes: before });
    return { deleted: true };
  }
}
