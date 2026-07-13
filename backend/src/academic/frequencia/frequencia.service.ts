import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { ResultadoDisciplinaService } from '../resultado-disciplina/resultado-disciplina.service';
import { LancarFrequenciaDto } from './dto/lancar-frequencia.dto';

@Injectable()
export class FrequenciaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly resultadoDisciplina: ResultadoDisciplinaService,
  ) {}

  /**
   * Lançamento de Entrada / Lançamento de Faltas (Kirsch: Secretaria > Manutenção de
   * Frequência) — grava, por aluno, quantas das aulas daquele dia ele faltou.
   * Upsert por (matriculaDisciplinaId, data): relançar o mesmo dia sobrescreve
   * (é assim que "Manutenção de Frequência" — editar um lançamento já feito — funciona).
   */
  async lancar(dto: LancarFrequenciaDto, usuarioId?: string) {
    const data = new Date(dto.data);
    const resultado: { alunoId: string; status: 'ok' | 'erro'; mensagem?: string }[] = [];

    for (const registro of dto.registros) {
      try {
        if (registro.faltas > dto.quantidadeAulas) {
          resultado.push({ alunoId: registro.alunoId, status: 'erro', mensagem: 'Faltas não pode ser maior que a quantidade de aulas do dia.' });
          continue;
        }
        const matricula = await this.prisma.matriculaDisciplina.findUnique({
          where: { alunoId_ofertaId: { alunoId: registro.alunoId, ofertaId: dto.ofertaId } },
        });
        if (!matricula) {
          resultado.push({ alunoId: registro.alunoId, status: 'erro', mensagem: 'Aluno não matriculado nesta oferta.' });
          continue;
        }

        const existente = await this.prisma.registroFrequencia.findUnique({
          where: { matriculaDisciplinaId_data: { matriculaDisciplinaId: matricula.id, data } },
        });

        const registroFrequencia = await this.prisma.registroFrequencia.upsert({
          where: { matriculaDisciplinaId_data: { matriculaDisciplinaId: matricula.id, data } },
          create: {
            matriculaDisciplinaId: matricula.id,
            data,
            quantidadeAulas: dto.quantidadeAulas,
            faltas: registro.faltas,
            observacao: registro.observacao,
          },
          update: {
            quantidadeAulas: dto.quantidadeAulas,
            faltas: registro.faltas,
            observacao: registro.observacao,
          },
        });

        if (usuarioId) {
          await this.audit.log({
            usuarioId,
            acao: existente ? 'UPDATE' : 'CREATE',
            entidade: 'RegistroFrequencia',
            entidadeId: registroFrequencia.id,
            dadosAntes: existente ?? undefined,
            dadosDepois: registroFrequencia,
          });
        }
        // Frequência diária lançada pode mudar a situação da matrícula (ex.: derrubar abaixo
        // de 75%) mesmo sem nenhuma nota nova — recalcula pra manter a listagem em dia.
        await this.resultadoDisciplina.recalcularSeElegivel(matricula.id, usuarioId);
        resultado.push({ alunoId: registro.alunoId, status: 'ok' });
      } catch (e: any) {
        resultado.push({ alunoId: registro.alunoId, status: 'erro', mensagem: e?.message ?? 'Erro desconhecido.' });
      }
    }

    return {
      total: dto.registros.length,
      sucesso: resultado.filter(r => r.status === 'ok').length,
      erro: resultado.filter(r => r.status === 'erro').length,
      detalhes: resultado,
    };
  }

  /**
   * Consulta os lançamentos de uma oferta numa data específica — usado pra
   * pré-preencher a tela quando o usuário reabre um dia já lançado ("Manutenção").
   */
  async listarPorOfertaEData(ofertaId: string, data: string) {
    const dataDate = new Date(data);
    const registros = await this.prisma.registroFrequencia.findMany({
      where: { data: dataDate, matriculaDisciplina: { ofertaId } },
      include: { matriculaDisciplina: { include: { aluno: { select: { id: true, ra: true, nome: true } } } } },
    });
    return registros.map(r => ({
      alunoId: r.matriculaDisciplina.aluno.id,
      ra: r.matriculaDisciplina.aluno.ra,
      nome: r.matriculaDisciplina.aluno.nome,
      quantidadeAulas: r.quantidadeAulas,
      faltas: r.faltas,
      observacao: r.observacao,
    }));
  }

  /**
   * Resumo consolidado por aluno de uma oferta — soma todos os dias lançados.
   * Usado pela "Listagem de Alunos em Atraso" (flag emAtraso quando freq < 75%)
   * e pra pré-preencher o Consolidar de resultado final.
   */
  async resumoPorOferta(ofertaId: string) {
    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { ofertaId },
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        registrosFrequencia: true,
      },
    });

    return matriculas.map(m => {
      const totalAulas = m.registrosFrequencia.reduce((s, r) => s + r.quantidadeAulas, 0);
      const totalFaltas = m.registrosFrequencia.reduce((s, r) => s + r.faltas, 0);
      const frequenciaPercentual = totalAulas > 0 ? Math.round(((totalAulas - totalFaltas) / totalAulas) * 10000) / 100 : 100;
      return {
        matriculaDisciplinaId: m.id,
        aluno: m.aluno,
        diasLancados: m.registrosFrequencia.length,
        totalAulas,
        totalFaltas,
        frequenciaPercentual,
        emAtraso: totalAulas > 0 && frequenciaPercentual < 75,
      };
    });
  }

  async resumoPorMatricula(matriculaDisciplinaId: string) {
    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { id: matriculaDisciplinaId },
      include: { registrosFrequencia: true },
    });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');

    const totalAulas = matricula.registrosFrequencia.reduce((s, r) => s + r.quantidadeAulas, 0);
    const totalFaltas = matricula.registrosFrequencia.reduce((s, r) => s + r.faltas, 0);
    const frequenciaPercentual = totalAulas > 0 ? Math.round(((totalAulas - totalFaltas) / totalAulas) * 10000) / 100 : null;

    return { matriculaDisciplinaId, diasLancados: matricula.registrosFrequencia.length, totalAulas, totalFaltas, frequenciaPercentual };
  }
}
