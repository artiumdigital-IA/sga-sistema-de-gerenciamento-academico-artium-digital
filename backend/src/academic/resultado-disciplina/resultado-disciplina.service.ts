import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { ConsolidarResultadoDto } from './dto/consolidar-resultado.dto';
import { SituacaoResultado, MatriculaStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const NOTA_MINIMA = 5.0;       // confirmar com secretaria (seção 7 da spec)
const FREQ_MINIMA = 75.0;      // 75% — legislação federal

@Injectable()
export class ResultadoDisciplinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Consolida o resultado de uma matrícula:
   * 1. Busca todas as avaliações da matrícula
   * 2. Calcula média ponderada
   * 3. Calcula frequência a partir das faltas fornecidas
   * 4. Determina situação (aprovado/reprovado)
   * 5. Persiste ResultadoDisciplina e atualiza status da MatriculaDisciplina
   */
  async consolidar(matriculaDisciplinaId: string, dto: ConsolidarResultadoDto, usuarioId?: string) {
    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { id: matriculaDisciplinaId },
      include: { avaliacoes: true },
    });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');
    if (matricula.avaliacoes.length === 0) {
      throw new BadRequestException('Nenhuma avaliação lançada para esta matrícula. Lance ao menos uma nota antes de consolidar.');
    }

    // Média ponderada
    let somaPonderada = 0;
    let somaPesos = 0;
    for (const av of matricula.avaliacoes) {
      somaPonderada += Number(av.nota) * Number(av.peso);
      somaPesos += Number(av.peso);
    }
    const mediaFinal = somaPesos > 0 ? somaPonderada / somaPesos : 0;

    // Frequência
    const frequenciaPercentual = dto.totalAulas > 0
      ? ((dto.totalAulas - dto.faltas) / dto.totalAulas) * 100
      : 0;

    // Situação
    const reprovadoNota = mediaFinal < NOTA_MINIMA;
    const reprovadoFalta = frequenciaPercentual < FREQ_MINIMA;
    let situacao: SituacaoResultado;
    if (reprovadoNota && reprovadoFalta) situacao = SituacaoResultado.REPROVADO_NOTA_E_FALTA;
    else if (reprovadoNota) situacao = SituacaoResultado.REPROVADO_NOTA;
    else if (reprovadoFalta) situacao = SituacaoResultado.REPROVADO_FALTA;
    else situacao = SituacaoResultado.APROVADO;

    // Status da matrícula
    let novoStatus: MatriculaStatus;
    if (situacao === SituacaoResultado.APROVADO) novoStatus = MatriculaStatus.APROVADO;
    else novoStatus = MatriculaStatus.REPROVADO;

    // Upsert resultado + atualizar matrícula (transação)
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
      dadosDepois: { ...resultado, mediaFinal, frequenciaPercentual, situacao },
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
            avaliacoes: true,
          },
        },
      },
    });
  }
}
