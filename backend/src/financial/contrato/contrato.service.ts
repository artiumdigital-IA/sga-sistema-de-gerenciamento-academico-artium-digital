import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateContratoDto } from './contrato.dto';
import { calcularMora } from '../mora.util';

/** Anexa multa/juros/mora calculados (não armazenados) em cada parcela de um contrato. */
function comMora<T extends { parcelas: { valor: any; dataVencimento: Date; status: string; dataPagamento: Date | null }[] }>(contrato: T): T {
  const hoje = new Date();
  return {
    ...contrato,
    parcelas: contrato.parcelas.map(p => ({
      ...p,
      ...calcularMora(Number(p.valor), new Date(p.dataVencimento), p.status, hoje, p.dataPagamento ? new Date(p.dataPagamento) : null),
    })),
  };
}

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
    return comMora(contrato);
  }

  /**
   * Listagem paginada (dezenas de milhares de contratos/parcelas em produção
   * -- carregar tudo de uma vez travava a tela). Busca por nome/RA roda no
   * banco via Prisma (parametrizado, sem risco de injection), e a resposta
   * NAO inclui as parcelas -- só os totais (pago/vencido/vencido+mora), já
   * calculados aqui. O detalhe completo de parcelas fica em findOne(), pedido
   * só quando o usuário expande um contrato na tela.
   */
  async findAll(params: { alunoId?: string; periodoLetivoId?: string; search?: string; page?: number; limit?: number }) {
    const take = Math.min(Math.max(Math.trunc(params.limit ?? 20) || 20, 1), 100);
    const page = Math.max(Math.trunc(params.page ?? 1) || 1, 1);
    const skip = (page - 1) * take;

    const where: any = {
      ...(params.alunoId ? { alunoId: params.alunoId } : {}),
      ...(params.periodoLetivoId ? { periodoLetivoId: params.periodoLetivoId } : {}),
      ...(params.search
        ? {
            aluno: {
              OR: [
                { nome: { contains: params.search, mode: 'insensitive' } },
                { ra: { contains: params.search } },
              ],
            },
          }
        : {}),
    };

    const [total, contratos] = await Promise.all([
      (this.prisma as any).contratoMatricula.count({ where }),
      (this.prisma as any).contratoMatricula.findMany({
        where,
        skip,
        take,
        orderBy: { criadoEm: 'desc' },
        include: {
          aluno: { select: { id: true, nome: true, ra: true } },
          periodoLetivo: { select: { id: true, ano: true, semestre: true } },
          parcelas: { select: { valor: true, valorPago: true, status: true, dataVencimento: true, dataPagamento: true } },
        },
      }),
    ]);

    const hoje = new Date();
    const data = contratos.map((c: any) => {
      const pago = c.parcelas
        .filter((p: any) => p.status === 'PAGO')
        .reduce((s: number, p: any) => s + Number(p.valorPago ?? 0), 0);
      const vencidas = c.parcelas.filter((p: any) => p.status === 'VENCIDO');
      const vencido = vencidas.reduce((s: number, p: any) => s + Number(p.valor), 0);
      const vencidoComMora = vencidas.reduce((s: number, p: any) => {
        const mora = calcularMora(Number(p.valor), new Date(p.dataVencimento), p.status, hoje, p.dataPagamento ? new Date(p.dataPagamento) : null);
        return s + Number(p.valor) + mora.mora;
      }, 0);
      const { parcelas, ...resto } = c;
      return {
        ...resto,
        totais: {
          pago: Number(pago.toFixed(2)),
          vencido: Number(vencido.toFixed(2)),
          vencidoComMora: Number(vencidoComMora.toFixed(2)),
        },
      };
    });

    return { data, total, page, limit: take };
  }

  /**
   * Versão completa (com parcelas) para uso interno, escopada a UM aluno --
   * usada pelo app do aluno (DiscenteService.financeiro), onde o volume já é
   * pequeno por natureza (poucos contratos por pessoa) e a tela precisa das
   * parcelas direto, sem o passo de "expandir" da tela administrativa. Não
   * pagina de propósito -- não é o endpoint que sofria com o volume total.
   */
  async findAllCompletoPorAluno(alunoId: string) {
    const contratos = await (this.prisma as any).contratoMatricula.findMany({
      where: { alunoId },
      include: {
        aluno: { select: { id: true, nome: true, ra: true } },
        periodoLetivo: { select: { id: true, ano: true, semestre: true } },
        parcelas: { orderBy: { numero: 'asc' }, include: { boleto: { select: { id: true, status: true } } } },
      },
      orderBy: { criadoEm: 'desc' },
    });
    return contratos.map(comMora);
  }

  async findOne(id: string) {
    const c = await (this.prisma as any).contratoMatricula.findUnique({
      where: { id },
      include: { aluno: true, periodoLetivo: true, parcelas: { orderBy: { numero: 'asc' }, include: { boleto: { select: { id: true, status: true } } } } },
    });
    if (!c) throw new NotFoundException('Contrato não encontrado');
    return comMora(c);
  }

  async updateStatus(id: string, status: string, userId: string) {
    const c = await this.findOne(id);
    const updated = await (this.prisma as any).contratoMatricula.update({ where: { id }, data: { status } });
    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'ContratoMatricula', entidadeId: id, dadosAntes: c, dadosDepois: updated });
    return updated;
  }
}
