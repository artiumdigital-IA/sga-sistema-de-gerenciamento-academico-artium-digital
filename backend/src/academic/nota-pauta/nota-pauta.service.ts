import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EtapaAvaliativa } from '@prisma/client';
import { UpsertNotaPautaDto } from './dto/upsert-nota-pauta.dto';

/**
 * Pauta bimestral — "Lançamento de Notas & Frequência por Pauta" (Kirsch).
 * Fórmula confirmada pelo usuário (Jul/2026) como a regra certa de aprovação
 * pra graduação, substituindo a suposição anterior (só nota mínima 6.0 + média
 * ponderada por peso). Fórmula idêntica à encontrada na tela "Configurar
 * Fórmula Cálculo Bimestral" do Kirsch:
 *   F1 = (AV1+AV2+AV3+AV4 + IF(2ªChamada>0; 2ªChamada; AV5)*6) / 10
 *   Média = IF(F1 < 6 AND Recuperação > F1; Recuperação; F1)
 * Calculada em tempo real — não fica armazenada (mesmo padrão de CR/
 * Integralização já usado no resto do sistema).
 */
function toNumOrNull(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

function calcularMedia(row: {
  av1: number | null; av2: number | null; av3: number | null; av4: number | null;
  av5: number | null; segundaChamada: number | null; recuperacao: number | null;
}) {
  const tocada = [row.av1, row.av2, row.av3, row.av4, row.av5, row.segundaChamada, row.recuperacao]
    .some((v) => v !== null && v !== undefined);
  if (!tocada) return null;

  const n1 = row.av1 ?? 0;
  const n2 = row.av2 ?? 0;
  const n3 = row.av3 ?? 0;
  const n4 = row.av4 ?? 0;
  const n5 = row.av5 ?? 0;
  const n6 = row.segundaChamada ?? 0;
  const rec = row.recuperacao ?? 0;

  const f1 = (n1 + n2 + n3 + n4 + (n6 > 0 ? n6 : n5) * 6) / 10;
  const f2 = f1 < 6 && rec > f1 ? rec : f1;
  return Math.round(f2 * 100) / 100;
}

@Injectable()
export class NotaPautaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Grade da pauta: todos os alunos matriculados na oferta + a linha de notas
   * daquele bimestre/etapa (ou nulls, se ainda não lançada nenhuma nota).
   */
  async pauta(ofertaId: string, etapa: EtapaAvaliativa) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id: ofertaId },
      include: { disciplina: true, periodoLetivo: true, professor: true },
    });
    if (!oferta) throw new NotFoundException(`Oferta "${ofertaId}" não encontrada.`);

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { ofertaId },
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        notasPauta: { where: { etapa } },
      },
      orderBy: { aluno: { nome: 'asc' } },
    });

    return {
      oferta: {
        id: oferta.id,
        disciplina: oferta.disciplina.nome,
        codigo: oferta.disciplina.codigo,
        periodo: { ano: oferta.periodoLetivo.ano, semestre: oferta.periodoLetivo.semestre },
        professor: oferta.professor?.nome ?? null,
        turno: oferta.turno,
      },
      etapa,
      linhas: matriculas.map((m, i) => {
        const nota = m.notasPauta[0] ?? null;
        const row = {
          av1: nota ? toNumOrNull(nota.av1) : null,
          av2: nota ? toNumOrNull(nota.av2) : null,
          av3: nota ? toNumOrNull(nota.av3) : null,
          av4: nota ? toNumOrNull(nota.av4) : null,
          av5: nota ? toNumOrNull(nota.av5) : null,
          segundaChamada: nota ? toNumOrNull(nota.segundaChamada) : null,
          recuperacao: nota ? toNumOrNull(nota.recuperacao) : null,
        };
        return {
          matriculaDisciplinaId: m.id,
          numero: i + 1,
          aluno: m.aluno,
          ...row,
          faltas: nota?.faltas ?? 0,
          media: calcularMedia(row),
        };
      }),
    };
  }

  async salvar(matriculaDisciplinaId: string, etapa: EtapaAvaliativa, dto: UpsertNotaPautaDto, usuarioId?: string) {
    const matricula = await this.prisma.matriculaDisciplina.findUnique({ where: { id: matriculaDisciplinaId } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');

    const antes = await this.prisma.notaPauta.findUnique({
      where: { matriculaDisciplinaId_etapa: { matriculaDisciplinaId, etapa } },
    });

    const data = {
      av1: dto.av1 ?? null,
      av2: dto.av2 ?? null,
      av3: dto.av3 ?? null,
      av4: dto.av4 ?? null,
      av5: dto.av5 ?? null,
      segundaChamada: dto.segundaChamada ?? null,
      recuperacao: dto.recuperacao ?? null,
      faltas: dto.faltas ?? 0,
    };

    const linha = await this.prisma.notaPauta.upsert({
      where: { matriculaDisciplinaId_etapa: { matriculaDisciplinaId, etapa } },
      create: { matriculaDisciplinaId, etapa, ...data },
      update: data,
    });

    if (usuarioId) {
      await this.audit.log({
        usuarioId,
        acao: antes ? 'UPDATE' : 'CREATE',
        entidade: 'NotaPauta',
        entidadeId: linha.id,
        dadosAntes: antes ?? undefined,
        dadosDepois: linha,
      });
    }

    const row = {
      av1: toNumOrNull(linha.av1),
      av2: toNumOrNull(linha.av2),
      av3: toNumOrNull(linha.av3),
      av4: toNumOrNull(linha.av4),
      av5: toNumOrNull(linha.av5),
      segundaChamada: toNumOrNull(linha.segundaChamada),
      recuperacao: toNumOrNull(linha.recuperacao),
    };

    return { matriculaDisciplinaId, etapa, ...row, faltas: linha.faltas, media: calcularMedia(row) };
  }
}
