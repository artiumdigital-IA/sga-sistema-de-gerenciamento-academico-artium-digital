import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateContratoDto } from './contrato.dto';

function nextVencimento(base: Date, monthsAhead: number, diaVencimento: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + monthsAhead);
  d.setDate(Math.min(diaVencimento, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class ContratoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateContratoDto, userId: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: dto.alunoId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const periodo = await this.prisma.periodoLetivo.findUnique({ where: { id: dto.periodoLetivoId } });
    if (!periodo) throw new NotFoundException('Período letivo não encontrado');

    const valorParcela = Number((dto.valorTotal / dto.numeroParcelas).toFixed(2));
    const hoje = new Date();

    const contrato = await (this.prisma as any).contratoMatricula.create({
      data: {
        alunoId: dto.alunoId,
        periodoLetivoId: dto.periodoLetivoId,
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
      include: { parcelas: { orderBy: { numero: 'asc' }, include: { boleto: { select: { id: true, status: true } } } }, aluno: true, periodoLetivo: true },
    });

    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'ContratoMatricula', entidadeId: contrato.id, dadosDepois: contrato });
    return contrato;
  }

  async findAll(alunoId?: string, periodoLetivoId?: string) {
    return (this.prisma as any).contratoMatricula.findMany({
      where: {
        ...(alunoId ? { alunoId } : {}),
        ...(periodoLetivoId ? { periodoLetivoId } : {}),
      },
      include: {
        aluno: { select: { id: true, nome: true, ra: true } },
        periodoLetivo: { select: { id: true, ano: true, semestre: true } },
        parcelas: { orderBy: { numero: 'asc' }, include: { boleto: { select: { id: true, status: true } } } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const c = await (this.prisma as any).contratoMatricula.findUnique({
      where: { id },
      include: { aluno: true, periodoLetivo: true, parcelas: { orderBy: { numero: 'asc' }, include: { boleto: { select: { id: true, status: true } } } } },
    });
    if (!c) throw new NotFoundException('Contrato não encontrado');
    return c;
  }

  async updateStatus(id: string, status: string, userId: string) {
    const c = await this.findOne(id);
    const updated = await (this.prisma as any).contratoMatricula.update({ where: { id }, data: { status } });
    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'ContratoMatricula', entidadeId: id, dadosAntes: c, dadosDepois: updated });
    return updated;
  }
}
