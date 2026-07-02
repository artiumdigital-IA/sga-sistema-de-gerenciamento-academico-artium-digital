import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';

@Injectable()
export class ContaBancariaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateContaBancariaDto, usuarioId?: string) {
    const conta = await this.prisma.contaBancaria.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ContaBancaria', entidadeId: conta.id, dadosDepois: conta });
    }
    return conta;
  }

  findAll(somenteAtivas?: boolean) {
    return this.prisma.contaBancaria.findMany({
      where: somenteAtivas ? { ativa: true } : undefined,
      orderBy: { banco: 'asc' },
    });
  }

  async findOne(id: string) {
    const conta = await this.prisma.contaBancaria.findUnique({ where: { id } });
    if (!conta) throw new NotFoundException('Conta bancária não encontrada.');
    return conta;
  }

  async update(id: string, dto: UpdateContaBancariaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const conta = await this.prisma.contaBancaria.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'ContaBancaria', entidadeId: id, dadosAntes: antes, dadosDepois: conta });
    }
    return conta;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.contaBancaria.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'ContaBancaria', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Conta bancária removida.' };
  }
}
