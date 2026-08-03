import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calcularMora } from '../financial/mora.util';

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

    const linhas = parcelas.map(p => {
      const mora = calcularMora(Number(p.valor), new Date(p.dataVencimento), p.status, hoje);
      return {
        parcelaId: p.id,
        numero: p.numero,
        valor: p.valor,
        dataVencimento: p.dataVencimento,
        diasAtraso: mora.diasAtraso,
        multa: mora.multa,
        juros: mora.juros,
        mora: mora.mora,
        valorAtualizado: mora.valorAtualizado,
        aluno: p.contrato.aluno,
        periodo: p.contrato.periodoLetivo,
      };
    });

    return {
      total: linhas.length,
      valorTotalEmAtraso: linhas.reduce((s, l) => s + Number(l.valor), 0),
      valorTotalMora: Number(linhas.reduce((s, l) => s + l.mora, 0).toFixed(2)),
      valorTotalAtualizado: Number(linhas.reduce((s, l) => s + l.valorAtualizado, 0).toFixed(2)),
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
   *
   * Achado em Ago/2026 (conferência do usuário contra a base): o filtro antigo exigia
   * `dataPagamento: { not: null }` porque a competência é derivada dessa data -- mas parcelas
   * PAGO sem essa data (88 na produção na época, ~R$134,5 mil, dado incompleto de importação
   * legada) simplesmente somem do total, sem nenhum aviso. Agora elas entram num grupo
   * "Sem data de pagamento" -- o total bate sempre, e dá pra ver quais linhas precisam de
   * correção de dado na origem.
   */
  async resumoContabilPorCompetencia() {
    const parcelas = await this.prisma.parcela.findMany({
      where: { status: 'PAGO' },
      include: { contrato: { include: { aluno: { select: { curso: { select: { nome: true } } } } } } },
    });

    const SEM_DATA = 'Sem data de pagamento';
    const grupos = new Map<string, { curso: string; competencia: string; quantidade: number; valorRecebido: number }>();
    for (const p of parcelas) {
      // getUTC* (não getFullYear/getMonth locais) -- mesma regra de lib/format.ts, evita a
      // competência sair um dia/mês errado dependendo do fuso do processo.
      const competencia = p.dataPagamento
        ? `${new Date(p.dataPagamento).getUTCFullYear()}-${String(new Date(p.dataPagamento).getUTCMonth() + 1).padStart(2, '0')}`
        : SEM_DATA;
      const chave = `${p.contrato.aluno.curso.nome}__${competencia}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, { curso: p.contrato.aluno.curso.nome, competencia, quantidade: 0, valorRecebido: 0 });
      }
      const g = grupos.get(chave)!;
      g.quantidade += 1;
      g.valorRecebido += Number(p.valorPago ?? p.valor);
    }

    return Array.from(grupos.values()).sort((a, b) => {
      if (a.competencia === SEM_DATA) return 1;
      if (b.competencia === SEM_DATA) return -1;
      return b.competencia.localeCompare(a.competencia) || a.curso.localeCompare(b.curso);
    });
  }
}
