import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusLinhaImportacao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { parsearPlanilhaParcelasLegado } from './parsers/parcelas-legado.parser';
import { AlunoMatcher } from './matching/aluno-matcher';

interface ArquivoUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

const TAMANHO_LOTE_INSERCAO = 500;

interface GrupoContratoProposto {
  alunoId: string;
  ano: number;
  semestre: string;
  parcelas: number;
  valorTotal: number;
}

/**
 * Análise (dry-run) de planilhas legadas de parcela financeira — não grava
 * nada em `Aluno`/`ContratoMatricula`/`Parcela`/`PeriodoLetivo`. O objetivo é
 * produzir um relatório de o que *seria* importado, pra revisão humana antes
 * de qualquer escrita real (ver plano da Fase 9 no CLAUDE.md).
 */
@Injectable()
export class ImportacaoLegadoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async criarLote(usuarioId: string, arquivo: ArquivoUpload) {
    const importacao = await this.prisma.importacaoLegado.create({
      data: {
        tipo: 'PARCELAS_LEGADO',
        arquivoNome: arquivo.originalname,
        usuarioId,
        status: 'PROCESSANDO',
        totalLinhasArquivo: 0,
        totalLinhasDetalhe: 0,
        linhasIgnoradasResumo: 0,
      },
    });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'ImportacaoLegado',
      entidadeId: importacao.id,
      dadosDepois: { arquivoNome: arquivo.originalname },
    });

    // Processamento roda em segundo plano — não é aguardado aqui de
    // propósito, pra não arriscar o Gateway Timeout intermitente já
    // documentado no projeto numa operação de dezenas de milhares de linhas.
    // Qualquer erro é capturado e gravado no próprio lote, nunca derruba o
    // processo do backend.
    this.processarLote(importacao.id, arquivo.path).catch(async (err) => {
      await this.prisma.importacaoLegado
        .update({
          where: { id: importacao.id },
          data: { status: 'ERRO', erro: err?.message ?? String(err), concluidoEm: new Date() },
        })
        .catch(() => {});
    });

    return importacao;
  }

  private async processarLote(importacaoId: string, caminhoArquivo: string) {
    const resultado = await parsearPlanilhaParcelasLegado(caminhoArquivo);

    const alunos = await this.prisma.aluno.findMany({ select: { id: true, nome: true, cpf: true } });
    const matcher = new AlunoMatcher(alunos);

    const periodosExistentes = await this.prisma.periodoLetivo.findMany({ select: { ano: true, semestre: true } });
    const chavesPeriodosExistentes = new Set(periodosExistentes.map((p) => `${p.ano}-${p.semestre}`));

    const contagemPorStatus: Record<StatusLinhaImportacao, number> = {
      PRONTA_CPF: 0,
      SUGESTAO_NOME: 0,
      SEM_CORRESPONDENCIA: 0,
      DADO_INVALIDO: 0,
    };
    const gruposContrato = new Map<string, GrupoContratoProposto>();
    let valorTotalProntaCpf = 0;
    const alunosProntaCpf = new Set<string>();

    let lote: Prisma.ImportacaoLegadoLinhaCreateManyInput[] = [];

    for (const linha of resultado.linhas) {
      const match = matcher.match({
        cpfNormalizado: linha.cpfNormalizado,
        nome: linha.nome,
        codigoAlunoLegado: linha.codigoAlunoLegado,
      });
      contagemPorStatus[match.status]++;

      let anoInferido: number | null = null;
      let semestreInferido: string | null = null;

      if (match.status === 'PRONTA_CPF' && linha.dataVencimento && match.alunoEncontradoId) {
        anoInferido = linha.dataVencimento.getUTCFullYear();
        semestreInferido = linha.dataVencimento.getUTCMonth() < 6 ? 'S1' : 'S2';

        const chaveGrupo = `${match.alunoEncontradoId}-${anoInferido}-${semestreInferido}`;
        const grupo = gruposContrato.get(chaveGrupo) ?? {
          alunoId: match.alunoEncontradoId,
          ano: anoInferido,
          semestre: semestreInferido,
          parcelas: 0,
          valorTotal: 0,
        };
        grupo.parcelas++;
        grupo.valorTotal += linha.valorFace ?? 0;
        gruposContrato.set(chaveGrupo, grupo);

        valorTotalProntaCpf += linha.valorFace ?? 0;
        alunosProntaCpf.add(match.alunoEncontradoId);
      }

      lote.push({
        importacaoId,
        numeroLinha: linha.numeroLinha,
        dadosOriginais: linha.colunasOriginais as Prisma.InputJsonValue,
        status: match.status,
        alunoEncontradoId: match.alunoEncontradoId ?? null,
        alunoSugeridoId: match.alunoSugeridoId ?? null,
        scoreSugestao: match.scoreSugestao ?? null,
        anoInferido,
        semestreInferido,
        motivoPendencia: match.motivoPendencia ?? null,
      });

      if (lote.length >= TAMANHO_LOTE_INSERCAO) {
        await this.prisma.importacaoLegadoLinha.createMany({ data: lote });
        lote = [];
      }
    }
    if (lote.length > 0) {
      await this.prisma.importacaoLegadoLinha.createMany({ data: lote });
    }

    // Agrega os grupos propostos por período (ano+semestre), indicando quais
    // já existem hoje e quais precisariam ser criados num commit futuro.
    const periodosMap = new Map<
      string,
      { ano: number; semestre: string; existeJa: boolean; alunosDistintos: Set<string>; parcelas: number; valorTotal: number }
    >();
    for (const grupo of gruposContrato.values()) {
      const chave = `${grupo.ano}-${grupo.semestre}`;
      const entrada = periodosMap.get(chave) ?? {
        ano: grupo.ano,
        semestre: grupo.semestre,
        existeJa: chavesPeriodosExistentes.has(chave),
        alunosDistintos: new Set<string>(),
        parcelas: 0,
        valorTotal: 0,
      };
      entrada.alunosDistintos.add(grupo.alunoId);
      entrada.parcelas += grupo.parcelas;
      entrada.valorTotal += grupo.valorTotal;
      periodosMap.set(chave, entrada);
    }

    const resumo = {
      porStatus: contagemPorStatus,
      contratosPropostos: gruposContrato.size,
      alunosDistintosProntaCpf: alunosProntaCpf.size,
      valorTotalProntaCpf,
      periodosNecessarios: [...periodosMap.values()]
        .map((p) => ({
          ano: p.ano,
          semestre: p.semestre,
          existeJa: p.existeJa,
          alunosDistintos: p.alunosDistintos.size,
          parcelas: p.parcelas,
          valorTotal: p.valorTotal,
        }))
        .sort((a, b) => a.ano - b.ano || a.semestre.localeCompare(b.semestre)),
    };

    await this.prisma.importacaoLegado.update({
      where: { id: importacaoId },
      data: {
        status: 'CONCLUIDA',
        totalLinhasArquivo: resultado.totalLinhasArquivo,
        totalLinhasDetalhe: resultado.linhas.length,
        linhasIgnoradasResumo: resultado.linhasIgnoradasResumo,
        resumo,
        concluidoEm: new Date(),
      },
    });
  }

  async listar() {
    return this.prisma.importacaoLegado.findMany({
      orderBy: { iniciadoEm: 'desc' },
      select: {
        id: true,
        tipo: true,
        arquivoNome: true,
        status: true,
        totalLinhasArquivo: true,
        totalLinhasDetalhe: true,
        linhasIgnoradasResumo: true,
        iniciadoEm: true,
        concluidoEm: true,
        erro: true,
        usuario: { select: { nome: true, email: true } },
      },
    });
  }

  async buscarUm(id: string) {
    const importacao = await this.prisma.importacaoLegado.findUnique({
      where: { id },
      include: { usuario: { select: { nome: true, email: true } } },
    });
    if (!importacao) throw new NotFoundException('Lote de importação não encontrado.');
    return importacao;
  }

  async listarLinhas(id: string, status?: StatusLinhaImportacao, page = 1, pageSize = 50) {
    const paginaSegura = Math.max(1, page || 1);
    const tamanhoSeguro = Math.min(200, Math.max(1, pageSize || 50));

    const where: Prisma.ImportacaoLegadoLinhaWhereInput = { importacaoId: id, ...(status ? { status } : {}) };

    const [total, linhas] = await Promise.all([
      this.prisma.importacaoLegadoLinha.count({ where }),
      this.prisma.importacaoLegadoLinha.findMany({
        where,
        orderBy: { numeroLinha: 'asc' },
        skip: (paginaSegura - 1) * tamanhoSeguro,
        take: tamanhoSeguro,
      }),
    ]);

    return { total, page: paginaSegura, pageSize: tamanhoSeguro, linhas };
  }

  async exportarCsv(id: string, status?: StatusLinhaImportacao): Promise<string> {
    const linhas = await this.prisma.importacaoLegadoLinha.findMany({
      where: { importacaoId: id, ...(status ? { status } : {}) },
      orderBy: { numeroLinha: 'asc' },
    });

    const cabecalho = [
      'Linha', 'Status', 'Motivo', 'Score Sugestão (%)', 'Aluno (id encontrado/sugerido)',
      'Ano Inferido', 'Semestre Inferido', 'Banco', 'Código Aluno Legado', 'Nome', 'CPF',
      'Data Vencimento', 'Valor de Face', 'Situação',
    ];

    const linhasCsv = linhas.map((l) => {
      const dados = l.dadosOriginais as Record<string, unknown>;
      const campos = [
        l.numeroLinha,
        l.status,
        l.motivoPendencia ?? '',
        l.scoreSugestao != null ? Math.round(l.scoreSugestao * 100) : '',
        l.alunoEncontradoId ?? l.alunoSugeridoId ?? '',
        l.anoInferido ?? '',
        l.semestreInferido ?? '',
        dados.banco ?? '',
        dados.aluno ?? '',
        dados.nome ?? '',
        dados.cpf ?? '',
        dados.dataVencimento ?? '',
        dados.valorDeFace ?? '',
        dados.situacao ?? '',
      ];
      return campos.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    return [cabecalho.join(','), ...linhasCsv].join('\n');
  }
}
