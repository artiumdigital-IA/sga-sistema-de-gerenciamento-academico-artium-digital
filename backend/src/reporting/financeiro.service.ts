import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceiroRelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Relatório de Inadimplência (achado do spike Kirsch: menu "Relatórios" > Inadimplência).
   * Parcelas vencidas e ainda não pagas, com dados do aluno responsável pelo contrato.
   */
  async inadimplencia() {
    const hoje = new Date();
    const parcelas = await this.prisma.parcela.findMany({
      where: {
        status: { in: ['PENDENTE', 'VENCIDO'] },
        dataVencimento: { lt: hoje },
      },
      include: {
        contrato: {
          include: {
            aluno: { select: { id: true, ra: true, nome: true, email: true, telefone: true } },
            periodoLetivo: { select: { ano: true, semestre: true } },
          },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });

    const linhas = parcelas.map(p => ({
      parcelaId: p.id,
      numero: p.numero,
      valor: p.valor,
      dataVencimento: p.dataVencimento,
      diasAtraso: Math.floor((hoje.getTime() - new Date(p.dataVencimento).getTime()) / 86400000),
      aluno: p.contrato.aluno,
      periodo: p.contrato.periodoLetivo,
    }));

    return {
      total: linhas.length,
      valorTotalEmAtraso: linhas.reduce((s, l) => s + Number(l.valor), 0),
      linhas,
    };
  }

  /**
   * Resumo Financeiro por Turma (achado Kirsch: menu "Relatórios"). Nosso modelo de Contrato
   * não tem granularidade de oferta/turma — aproximamos por Curso + Período Letivo.
   */
  async resumoPorTurma() {
    const contratos = await this.prisma.contratoMatricula.findMany({
      include: {
        aluno: { select: { curso: { select: { id: true, nome: true } } } },
        periodoLetivo: { select: { ano: true, semestre: true } },
        parcelas: true,
      },
    });

    const grupos = new Map<string, { curso: string; periodo: string; contratos: number; valorTotal: number; valorPago: number; valorPendente: number }>();
    for (const c of contratos) {
      const chave = `${c.aluno.curso.nome}__${c.periodoLetivo.ano}/${c.periodoLetivo.semestre}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, { curso: c.aluno.curso.nome, periodo: `${c.periodoLetivo.ano}/${c.periodoLetivo.semestre}`, contratos: 0, valorTotal: 0, valorPago: 0, valorPendente: 0 });
      }
      const g = grupos.get(chave)!;
      g.contratos += 1;
      g.valorTotal += Number(c.valorTotal);
      const pago = c.parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + Number(p.valorPago ?? p.valor), 0);
      g.valorPago += pago;
      g.valorPendente += Number(c.valorTotal) - pago;
    }

    return Array.from(grupos.values()).sort((a, b) => a.curso.localeCompare(b.curso) || a.periodo.localeCompare(b.periodo));
  }

  /**
   * Resumo Financeiro por Curso/Competência (achado Kirsch: menu "Contabilidade" — Resumo
   * Financeiro Curso/Competência). Competência = mês/ano de pagamento das parcelas.
   */
  async resumoContabilPorCompetencia() {
    const parcelas = await this.prisma.parcela.findMany({
      where: { status: 'PAGO', dataPagamento: { not: null } },
      include: { contrato: { include: { aluno: { select: { curso: { select: { nome: true } } } } } } },
    });

    const grupos = new Map<string, { curso: string; competencia: string; quantidade: number; valorRecebido: number }>();
    for (const p of parcelas) {
      const dp = new Date(p.dataPagamento!);
      const competencia = `${dp.getFullYear()}-${String(dp.getMonth() + 1).padStart(2, '0')}`;
      const chave = `${p.contrato.aluno.curso.nome}__${competencia}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, { curso: p.contrato.aluno.curso.nome, competencia, quantidade: 0, valorRecebido: 0 });
      }
      const g = grupos.get(chave)!;
      g.quantidade += 1;
      g.valorRecebido += Number(p.valorPago ?? p.valor);
    }

    return Array.from(grupos.values()).sort((a, b) => b.competencia.localeCompare(a.competencia) || a.curso.localeCompare(b.curso));
  }
}
