import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTabelaInssDto } from './dto/create-tabela-inss.dto';
import { UpdateTabelaInssDto } from './dto/update-tabela-inss.dto';

@Injectable()
export class TabelaInssService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTabelaInssDto, usuarioId?: string) {
    const tabela = await this.prisma.tabelaInss.create({
      data: {
        vigenciaInicio: new Date(dto.vigenciaInicio),
        ativa: dto.ativa ?? true,
        faixas: { create: dto.faixas.map(f => ({ ordem: f.ordem, limiteInicial: f.limiteInicial, limiteFinal: f.limiteFinal, aliquota: f.aliquota })) },
      },
      include: { faixas: { orderBy: { ordem: 'asc' } } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'TabelaInss', entidadeId: tabela.id, dadosDepois: tabela });
    }
    return tabela;
  }

  findAll() {
    return this.prisma.tabelaInss.findMany({ include: { faixas: { orderBy: { ordem: 'asc' } } }, orderBy: { vigenciaInicio: 'desc' } });
  }

  async findOne(id: string) {
    const tabela = await this.prisma.tabelaInss.findUnique({ where: { id }, include: { faixas: { orderBy: { ordem: 'asc' } } } });
    if (!tabela) throw new NotFoundException('Tabela de INSS não encontrada.');
    return tabela;
  }

  async findVigente() {
    const tabela = await this.prisma.tabelaInss.findFirst({
      where: { ativa: true },
      orderBy: { vigenciaInicio: 'desc' },
      include: { faixas: { orderBy: { ordem: 'asc' } } },
    });
    if (!tabela) throw new BadRequestException('Nenhuma tabela de INSS ativa cadastrada — cadastre uma antes de lançar folha.');
    return tabela;
  }

  async update(id: string, dto: UpdateTabelaInssDto, usuarioId?: string) {
    const antes = await this.findOne(id);

    const tabela = await this.prisma.$transaction(async tx => {
      if (dto.faixas) {
        await tx.faixaInss.deleteMany({ where: { tabelaId: id } });
      }
      return tx.tabelaInss.update({
        where: { id },
        data: {
          vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : undefined,
          ativa: dto.ativa,
          ...(dto.faixas ? { faixas: { create: dto.faixas.map(f => ({ ordem: f.ordem, limiteInicial: f.limiteInicial, limiteFinal: f.limiteFinal, aliquota: f.aliquota })) } } : {}),
        },
        include: { faixas: { orderBy: { ordem: 'asc' } } },
      });
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'TabelaInss', entidadeId: id, dadosAntes: antes, dadosDepois: tabela });
    }
    return tabela;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.faixaInss.deleteMany({ where: { tabelaId: id } }),
      this.prisma.tabelaInss.delete({ where: { id } }),
    ]);
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'TabelaInss', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Tabela de INSS removida.' };
  }
}
