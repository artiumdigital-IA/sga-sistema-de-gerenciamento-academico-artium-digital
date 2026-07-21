import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAcordoPagarDto, UpdateAcordoPagarDto } from './dto/acordo-pagar.dto';

// Mesma lógica de nextVencimento() já usada em
// backend/src/financial/contrato/contrato.service.ts, espelhada aqui do
// lado de quem a FIURJ paga (não reaproveitada por import direto pra manter
// os dois módulos financeiros independentes — financial/ é contas a
// receber, cpagar/ é contas a pagar).
function nextVencimento(base: Date, monthsAhead: number, diaVencimento: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + monthsAhead);
  d.setDate(Math.min(diaVencimento, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AcordoPagarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateAcordoPagarDto, usuarioId?: string) {
    const valorParcela = Number((dto.valorTotal / dto.numeroParcelas).toFixed(2));
    const hoje = new Date();

    const acordo = await this.prisma.acordoPagar.create({
      data: {
        fornecedorNome: dto.fornecedorNome,
        cnpjCpf: dto.cnpjCpf,
        valorTotal: dto.valorTotal,
        numeroParcelas: dto.numeroParcelas,
        diaVencimento: dto.diaVencimento,
        observacoes: dto.observacoes,
        parcelas: {
          create: Array.from({ length: dto.numeroParcelas }, (_, i) => ({
            numero: i + 1,
            valor: valorParcela,
            dataVencimento: nextVencimento(hoje, i + 1, dto.diaVencimento),
          })),
        },
      },
      include: { parcelas: { orderBy: { numero: 'asc' } } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'AcordoPagar', entidadeId: acordo.id, dadosDepois: acordo });
    }
    return acordo;
  }

  findAll() {
    return this.prisma.acordoPagar.findMany({
      include: { parcelas: { orderBy: { numero: 'asc' } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const acordo = await this.prisma.acordoPagar.findUnique({ where: { id }, include: { parcelas: { orderBy: { numero: 'asc' } } } });
    if (!acordo) throw new NotFoundException('Acordo não encontrado.');
    return acordo;
  }

  async update(id: string, dto: UpdateAcordoPagarDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const acordo = await this.prisma.acordoPagar.update({
      where: { id },
      data: { fornecedorNome: dto.fornecedorNome, cnpjCpf: dto.cnpjCpf, observacoes: dto.observacoes },
      include: { parcelas: { orderBy: { numero: 'asc' } } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'AcordoPagar', entidadeId: id, dadosAntes: antes, dadosDepois: acordo });
    }
    return acordo;
  }

  async updateStatus(id: string, status: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    const acordo = await this.prisma.acordoPagar.update({ where: { id }, data: { status: status as any } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'AcordoPagar', entidadeId: id, dadosAntes: antes, dadosDepois: acordo });
    }
    return acordo;
  }

  async pagarParcela(parcelaId: string, body: { valorPago: number; formaPagamento: string; dataPagamento?: string }, usuarioId?: string) {
    const parcela = await this.prisma.parcelaPagar.findUnique({ where: { id: parcelaId } });
    if (!parcela) throw new NotFoundException('Parcela não encontrada.');

    const atualizada = await this.prisma.parcelaPagar.update({
      where: { id: parcelaId },
      data: {
        status: 'PAGO',
        valorPago: body.valorPago,
        formaPagamento: body.formaPagamento,
        dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : new Date(),
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'ParcelaPagar', entidadeId: parcelaId, dadosAntes: parcela, dadosDepois: atualizada });
    }
    return atualizada;
  }
}
