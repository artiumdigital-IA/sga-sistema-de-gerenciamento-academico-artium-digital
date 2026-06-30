import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ParcelaService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async registrarPagamento(id: string, body: { valorPago: number; formaPagamento: string; dataPagamento?: string }, userId: string) {
    const parcela = await (this.prisma as any).parcela.findUnique({ where: { id } });
    if (!parcela) throw new NotFoundException('Parcela não encontrada');

    const updated = await (this.prisma as any).parcela.update({
      where: { id },
      data: {
        status: 'PAGO',
        valorPago: body.valorPago,
        formaPagamento: body.formaPagamento,
        dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : new Date(),
      },
    });

    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'Parcela', entidadeId: id, dadosAntes: parcela, dadosDepois: updated });
    return updated;
  }

  async cancelar(id: string, userId: string) {
    const parcela = await (this.prisma as any).parcela.findUnique({ where: { id } });
    if (!parcela) throw new NotFoundException('Parcela não encontrada');

    const updated = await (this.prisma as any).parcela.update({ where: { id }, data: { status: 'CANCELADO' } });
    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'Parcela', entidadeId: id, dadosAntes: parcela, dadosDepois: updated });
    return updated;
  }

  async atualizarVencidas() {
    const hoje = new Date();
    const result = await (this.prisma as any).parcela.updateMany({
      where: { status: 'PENDENTE', dataVencimento: { lt: hoje } },
      data: { status: 'VENCIDO' },
    });
    return result;
  }
}
