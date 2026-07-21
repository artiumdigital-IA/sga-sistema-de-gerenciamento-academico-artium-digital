import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreatePagamentoPrestadorDto } from './dto/create-pagamento-prestador.dto';
import { UpdatePagamentoPrestadorDto } from './dto/update-pagamento-prestador.dto';

const INCLUDE = { colaborador: { select: { id: true, nome: true, cpf: true } } };

@Injectable()
export class PagamentoPrestadorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreatePagamentoPrestadorDto, usuarioId?: string) {
    const colaborador = await this.prisma.colaborador.findUnique({ where: { id: dto.colaboradorId } });
    if (!colaborador) throw new NotFoundException('Colaborador não encontrado.');
    if (colaborador.tipoVinculo !== 'PRESTADOR_SERVICO') {
      throw new BadRequestException('Esse cadastro não é Prestador de Serviço — colaborador interno usa a Folha de Pagamento.');
    }

    const valorLiquido = dto.valorBruto - (dto.valorIssRetido ?? 0);
    const pagamento = await this.prisma.pagamentoPrestador.create({
      data: {
        colaboradorId: dto.colaboradorId,
        data: new Date(dto.data),
        descricaoServico: dto.descricaoServico,
        numeroNotaFiscal: dto.numeroNotaFiscal,
        valorBruto: dto.valorBruto,
        valorIssRetido: dto.valorIssRetido,
        valorLiquido,
      },
      include: INCLUDE,
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'PagamentoPrestador', entidadeId: pagamento.id, dadosDepois: pagamento });
    }
    return pagamento;
  }

  findAll(colaboradorId?: string) {
    return this.prisma.pagamentoPrestador.findMany({
      where: colaboradorId ? { colaboradorId } : undefined,
      include: INCLUDE,
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string) {
    const pagamento = await this.prisma.pagamentoPrestador.findUnique({ where: { id }, include: INCLUDE });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado.');
    return pagamento;
  }

  async update(id: string, dto: UpdatePagamentoPrestadorDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const valorBruto = dto.valorBruto ?? Number(antes.valorBruto);
    const valorIssRetido = dto.valorIssRetido ?? (antes.valorIssRetido ? Number(antes.valorIssRetido) : undefined);
    const valorLiquido = valorBruto - (valorIssRetido ?? 0);

    const pagamento = await this.prisma.pagamentoPrestador.update({
      where: { id },
      data: {
        data: dto.data ? new Date(dto.data) : undefined,
        descricaoServico: dto.descricaoServico,
        numeroNotaFiscal: dto.numeroNotaFiscal,
        valorBruto: dto.valorBruto,
        valorIssRetido: dto.valorIssRetido,
        valorLiquido,
      },
      include: INCLUDE,
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'PagamentoPrestador', entidadeId: id, dadosAntes: antes, dadosDepois: pagamento });
    }
    return pagamento;
  }

  async marcarPago(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    const pagamento = await this.prisma.pagamentoPrestador.update({ where: { id }, data: { status: 'PAGO' }, include: INCLUDE });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'PagamentoPrestador', entidadeId: id, dadosAntes: antes, dadosDepois: pagamento });
    }
    return pagamento;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.pagamentoPrestador.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'PagamentoPrestador', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Pagamento removido.' };
  }
}
