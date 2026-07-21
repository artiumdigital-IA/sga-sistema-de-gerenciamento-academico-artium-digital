import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTabelaIrrfDto } from './dto/create-tabela-irrf.dto';
import { UpdateTabelaIrrfDto } from './dto/update-tabela-irrf.dto';

@Injectable()
export class TabelaIrrfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTabelaIrrfDto, usuarioId?: string) {
    const tabela = await this.prisma.tabelaIrrf.create({
      data: {
        vigenciaInicio: new Date(dto.vigenciaInicio),
        ativa: dto.ativa ?? true,
        valorDeducaoPorDependente: dto.valorDeducaoPorDependente,
        faixas: { create: dto.faixas.map(f => ({ ordem: f.ordem, limiteInicial: f.limiteInicial, limiteFinal: f.limiteFinal, aliquota: f.aliquota, parcelaDeduzir: f.parcelaDeduzir })) },
      },
      include: { faixas: { orderBy: { ordem: 'asc' } } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'TabelaIrrf', entidadeId: tabela.id, dadosDepois: tabela });
    }
    return tabela;
  }

  findAll() {
    return this.prisma.tabelaIrrf.findMany({ include: { faixas: { orderBy: { ordem: 'asc' } } }, orderBy: { vigenciaInicio: 'desc' } });
  }

  async findOne(id: string) {
    const tabela = await this.prisma.tabelaIrrf.findUnique({ where: { id }, include: { faixas: { orderBy: { ordem: 'asc' } } } });
    if (!tabela) throw new NotFoundException('Tabela de IRRF não encontrada.');
    return tabela;
  }

  async findVigente() {
    const tabela = await this.prisma.tabelaIrrf.findFirst({
      where: { ativa: true },
      orderBy: { vigenciaInicio: 'desc' },
      include: { faixas: { orderBy: { ordem: 'asc' } } },
    });
    if (!tabela) throw new BadRequestException('Nenhuma tabela de IRRF ativa cadastrada — cadastre uma antes de lançar folha.');
    return tabela;
  }

  async update(id: string, dto: UpdateTabelaIrrfDto, usuarioId?: string) {
    const antes = await this.findOne(id);

    const tabela = await this.prisma.$transaction(async tx => {
      if (dto.faixas) {
        await tx.faixaIrrf.deleteMany({ where: { tabelaId: id } });
      }
      return tx.tabelaIrrf.update({
        where: { id },
        data: {
          vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : undefined,
          ativa: dto.ativa,
          valorDeducaoPorDependente: dto.valorDeducaoPorDependente,
          ...(dto.faixas ? { faixas: { create: dto.faixas.map(f => ({ ordem: f.ordem, limiteInicial: f.limiteInicial, limiteFinal: f.limiteFinal, aliquota: f.aliquota, parcelaDeduzir: f.parcelaDeduzir })) } } : {}),
        },
        include: { faixas: { orderBy: { ordem: 'asc' } } },
      });
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'TabelaIrrf', entidadeId: id, dadosAntes: antes, dadosDepois: tabela });
    }
    return tabela;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.faixaIrrf.deleteMany({ where: { tabelaId: id } }),
      this.prisma.tabelaIrrf.delete({ where: { id } }),
    ]);
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'TabelaIrrf', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Tabela de IRRF removida.' };
  }
}
