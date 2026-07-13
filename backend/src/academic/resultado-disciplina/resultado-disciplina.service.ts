import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { ConsolidarResultadoDto } from './dto/consolidar-resultado.dto';
import { SituacaoResultado, MatriculaStatus, AvaliacaoTipo } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ── Regras de negócio FIURJ (confirmadas com secretaria em Jun/2026) ──
const NOTA_MINIMA_APROVACAO   = 6.0;  // aprovação direta
const NOTA_MINIMA_POS_EXAME   = 6.0;  // aprovação após exame final: (média + exame) / 2 >= 6
const FREQ_MINIMA_PERCENTUAL  = 75.0; // legislação federal; FIURJ não é mais restritiva
// Exame final:
//   - elegível: frequência >= 75% E nota < 6.0
//   - aluno reprovado por falta NÃO faz exame
//   - nota final pós-exame = (média_semestre + nota_exame) / 2

@Injectable()
export class ResultadoDisciplinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Núcleo da regra de negócio, compartilhado entre `consolidar()` (manual, com
   * frequência informada pelo usuário) e `recalcularSeElegivel()` (automático, disparado
   * ao lançar/editar/excluir uma avaliação — Bug: "lançar nota isolada não atualiza a
   * listagem"):
   * 1. Calcula média ponderada do semestre (avaliações regulares, sem EXAME_FINAL)
   * 2. Se reprovado por falta (freq < 75%) → REPROVADO_FALTA (sem exame)
   * 3. Se média >= 6.0 → APROVADO diretamente
   * 4. Se média < 6.0 e freq >= 75%:
   *      - sem EXAME_FINAL lançado → PENDENTE_EXAME
   *      - com EXAME_FINAL lançado → nota_final = (média + exame) / 2
   *        → APROVADO se nota_final >= 6.0, senão REPROVADO_NOTA
   */
  private calcularResultado(
    regulares: { nota: unknown; peso: unknown }[],
    exameFinal: { nota: unknown } | undefined,
    frequenciaPercentual: number,
  ): {
    mediaFinal: number;
    mediaSemestre: number;
    situacao: SituacaoResultado;
    novoStatus: MatriculaStatus;
  } {
    let somaPonderada = 0;
    let somaPesos = 0;
    for (const av of regulares) {
      somaPonderada += Number(av.nota) * Number(av.peso);
      somaPesos += Number(av.peso);
    }
    const mediaSemestre = somaPesos > 0 ? somaPonderada / somaPesos : 0;

    const reprovadoFalta = frequenciaPercentual < FREQ_MINIMA_PERCENTUAL;

    let mediaFinal: number;
    let situacao: SituacaoResultado;
    let novoStatus: MatriculaStatus;

    if (reprovadoFalta) {
      mediaFinal = mediaSemestre;
      situacao = SituacaoResultado.REPROVADO_FALTA;
      novoStatus = MatriculaStatus.REPROVADO;
    } else if (mediaSemestre >= NOTA_MINIMA_APROVACAO) {
      mediaFinal = mediaSemestre;
      situacao = SituacaoResultado.APROVADO;
      novoStatus = MatriculaStatus.APROVADO;
    } else if (!exameFinal) {
      mediaFinal = mediaSemestre;
      situacao = SituacaoResultado.REPROVADO_NOTA; // provisório até exame
      novoStatus = MatriculaStatus.PENDENTE_EXAME;
    } else {
      const notaExame = Number(exameFinal.nota);
      mediaFinal = (mediaSemestre + notaExame) / 2;
      if (mediaFinal >= NOTA_MINIMA_POS_EXAME) {
        situacao = SituacaoResultado.APROVADO;
        novoStatus = MatriculaStatus.APROVADO;
      } else {
        situacao = SituacaoResultado.REPROVADO_NOTA;
        novoStatus = MatriculaStatus.REPROVADO;
      }
    }

    return { mediaFinal, mediaSemestre, situacao, novoStatus };
  }

  /**
   * Consolidação manual (botão "Consolidar" no Diário de Classe) — a secretaria/professor
   * informa total de aulas e faltas (ou usa "Calcular da frequência lançada") e o sistema
   * grava o resultado oficial da disciplina.
   */
  async consolidar(
    matriculaDisciplinaId: string,
    dto: ConsolidarResultadoDto,
    usuarioId?: string,
  ) {
    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { id: matriculaDisciplinaId },
      include: { avaliacoes: true },
    });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');
    if (matricula.avaliacoes.length === 0) {
      throw new BadRequestException(
        'Nenhuma avaliação lançada. Lance ao menos uma nota antes de consolidar.',
      );
    }

    const regulares = matricula.avaliacoes.filter(
      (a) => a.tipo !== AvaliacaoTipo.EXAME_FINAL,
    );
    const exameFinal = matricula.avaliacoes.find(
      (a) => a.tipo === AvaliacaoTipo.EXAME_FINAL,
    );

    if (regulares.length === 0) {
      throw new BadRequestException(
        'Nenhuma avaliação regular encontrada. O EXAME_FINAL não pode ser a única avaliação.',
      );
    }

    const frequenciaPercentual =
      dto.totalAulas > 0
        ? ((dto.totalAulas - dto.faltas) / dto.totalAulas) * 100
        : 0;

    const { mediaFinal, mediaSemestre, situacao, novoStatus } =
      this.calcularResultado(regulares, exameFinal, frequenciaPercentual);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const res = await tx.resultadoDisciplina.upsert({
        where: { matriculaDisciplinaId },
        create: {
          matriculaDisciplinaId,
          mediaFinal: new Decimal(mediaFinal.toFixed(2)),
          faltas: dto.faltas,
          frequenciaPercentual: new Decimal(frequenciaPercentual.toFixed(2)),
          situacao,
        },
        update: {
          mediaFinal: new Decimal(mediaFinal.toFixed(2)),
          faltas: dto.faltas,
          frequenciaPercentual: new Decimal(frequenciaPercentual.toFixed(2)),
          situacao,
        },
      });
      await tx.matriculaDisciplina.update({
        where: { id: matriculaDisciplinaId },
        data: { status: novoStatus },
      });
      return res;
    });

    await this.audit.log({
      usuarioId,
      acao: 'CONSOLIDAR',
      entidade: 'ResultadoDisciplina',
      entidadeId: resultado.id,
      dadosDepois: {
        ...resultado,
        mediaSemestre,
        mediaFinal,
        frequenciaPercentual,
        situacao,
        novoStatus,
        exameFinalConsiderado: !!exameFinal,
      },
    });

    return {
      ...resultado,
      mediaSemestre: Math.round(mediaSemestre * 100) / 100,
      elegibleParaExame: novoStatus === MatriculaStatus.PENDENTE_EXAME,
    };
  }

  /**
   * Recálculo automático — chamado pelo AvaliacaoService (lançar/editar/excluir nota) e pelo
   * FrequenciaService (lançar frequência diária) pra manter a coluna Média/Freq%/Resultado do
   * Diário de Classe sempre em dia, sem depender do usuário clicar em "Consolidar" de novo.
   *
   * Bug corrigido: lançar uma avaliação isoladamente deixava a listagem em "—/—/Pendente" até
   * alguém apertar Consolidar manualmente.
   *
   * Fonte da frequência usada no recálculo automático, em ordem de prioridade:
   * 1. Frequência diária já lançada (soma de `RegistroFrequencia`) — quando existe, é a fonte
   *    mais confjC�vel e atualizada.
   * 2. Frequência/faltas do último `ResultadoDisciplina` já consolidado manualmente — permite
   *    que ajustar uma nota depois de já ter consolidado uma vez atualize o resultado sem
   *    precisar reconsolidar.
   * 3. Se nenhuma das duas existir ainda (nunca foi lançada frequência nem consolidado), não dá
   *    pra determinar a situação — a listagem continua mostrando "Pendente" até uma delas
   *    acontecer (comportamento inalterado nesse caso).
   */
  async recalcularSeElegivel(matriculaDisciplinaId: string, usuarioId?: string) {
    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { id: matriculaDisciplinaId },
      include: { avaliacoes: true, resultado: true, registrosFrequencia: true },
    });
    if (!matricula) return null;

    const regulares = matricula.avaliacoes.filter(
      (a) => a.tipo !== AvaliacaoTipo.EXAME_FINAL,
    );

    // Sem avaliação regular: nenhum resultado é válido (mesma regra do consolidar manual).
    // Se havia um resultado de uma consolidação anterior, ele fica órfão/errado — remove.
    if (regulares.length === 0) {
      if (matricula.resultado) {
        await this.prisma.$transaction([
          this.prisma.resultadoDisciplina.delete({ where: { matriculaDisciplinaId } }),
          this.prisma.matriculaDisciplina.update({
            where: { id: matriculaDisciplinaId },
            data: { status: MatriculaStatus.MATRICULADO },
          }),
        ]);
      }
      return null;
    }

    const totalAulas = matricula.registrosFrequencia.reduce((s, r) => s + r.quantidadeAulas, 0);
    const totalFaltas = matricula.registrosFrequencia.reduce((s, r) => s + r.faltas, 0);

    let frequenciaPercentual: number;
    let faltas: number;
    if (totalAulas > 0) {
      frequenciaPercentual = ((totalAulas - totalFaltas) / totalAulas) * 100;
      faltas = totalFaltas;
    } else if (matricula.resultado) {
      frequenciaPercentual = Number(matricula.resultado.frequenciaPercentual);
      faltas = matricula.resultado.faltas;
    } else {
      // Nenhuma frequência disponível ainda — não dá pra calcular situação/resultado.
      return null;
    }

    const exameFinal = matricula.avaliacoes.find(
      (a) => a.tipo === AvaliacaoTipo.EXAME_FINAL,
    );

    const { mediaFinal, mediaSemestre, situacao, novoStatus } =
      this.calcularResultado(regulares, exameFinal, frequenciaPercentual);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const res = await tx.resultadoDisciplina.upsert({
        where: { matriculaDisciplinaId },
        create: {
          matriculaDisciplinaId,
          mediaFinal: new Decimal(mediaFinal.toFixed(2)),
          faltas,
          frequenciaPercentual: new Decimal(frequenciaPercentual.toFixed(2)),
          situacao,
        },
        update: {
          mediaFinal: new Decimal(mediaFinal.toFixed(2)),
          faltas,
          frequenciaPercentual: new Decimal(frequenciaPercentual.toFixed(2)),
          situacao,
        },
      });
      await tx.matriculaDisciplina.update({
        where: { id: matriculaDisciplinaId },
        data: { status: novoStatus },
      });
      return res;
    });

    await this.audit.log({
      usuarioId,
      acao: 'CONSOLIDAR_AUTO',
      entidade: 'ResultadoDisciplina',
      entidadeId: resultado.id,
      dadosDepois: { ...resultado, mediaSemestre, frequenciaPercentual, situacao, novoStatus },
    });

    return resultado;
  }

  findByMatricula(matriculaDisciplinaId: string) {
    return this.prisma.resultadoDisciplina.findUnique({
      where: { matriculaDisciplinaId },
      include: {
        matriculaDisciplina: {
          include: {
            aluno: { select: { ra: true, nome: true } },
            oferta: { include: { disciplina: true, periodoLetivo: true } },
            avaliacoes: { orderBy: { criadoEm: 'asc' } },
          },
        },
      },
    });
  }
}
