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
   * Consolida o resultado de uma matrícula:
   * 1. Separa avaliações regulares de EXAME_FINAL
   * 2. Calcula média ponderada do semestre (avaliacoes regulares)
   * 3. Calcula frequência com base nas faltas em horas-aula
   * 4. Se reprovado por falta → REPROVADO_FALTA (sem exame)
   * 5. Se média >= 6.0 → APROVADO diretamente
   * 6. Se média < 6.0 e freq >= 75%:
   *      - sem EXAME_FINAL lançado → PENDENTE_EXAME
   *      - com EXAME_FINAL lançado → nota_final = (média + exame) / 2
   *        → APROVADO se nota_final >= 6.0, senão REPROVADO_NOTA
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

    // ── 1. Separar avaliações ────────────────────────────────────────
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

    // ── 2. Média ponderada do semestre (sem exame) ───────────────────
    let somaPonderada = 0;
    let somaPesos = 0;
    for (const av of regulares) {
      somaPonderada += Number(av.nota) * Number(av.peso);
      somaPesos += Number(av.peso);
    }
    const mediaSemestre = somaPesos > 0 ? somaPonderada / somaPesos : 0;

    // ── 3. Frequência ────────────────────────────────────────────────
    // faltas e totalAulas são em horas-aula
    const frequenciaPercentual =
      dto.totalAulas > 0
        ? ((dto.totalAulas - dto.faltas) / dto.totalAulas) * 100
        : 0;

    const reprovadoFalta = frequenciaPercentual < FREQ_MINIMA_PERCENTUAL;

    // ── 4. Determinação do resultado ────────────────────────────────
    let mediaFinal: number;
    let situacao: SituacaoResultado;
    let novoStatus: MatriculaStatus;

    if (reprovadoFalta) {
      // Reprovado por falta: não faz exame, resultado imediato
      mediaFinal = mediaSemestre;
      situacao = SituacaoResultado.REPROVADO_FALTA;
      novoStatus = MatriculaStatus.REPROVADO;
    } else if (mediaSemestre >= NOTA_MINIMA_APROVACAO) {
      // Aprovado diretamente
      mediaFinal = mediaSemestre;
      situacao = SituacaoResultado.APROVADO;
      novoStatus = MatriculaStatus.APROVADO;
    } else {
      // Nota < 6.0, frequência OK → elegível para exame final
      if (!exameFinal) {
        // Exame ainda não lançado → pendente
        mediaFinal = mediaSemestre;
        situacao = SituacaoResultado.REPROVADO_NOTA; // provisório até exame
        novoStatus = MatriculaStatus.PENDENTE_EXAME;
      } else {
        // Calcular nota pós-exame: (média_semestre + nota_exame) / 2
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
    }

    // ── 5. Persistir resultado + atualizar status (transação) ───────
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
