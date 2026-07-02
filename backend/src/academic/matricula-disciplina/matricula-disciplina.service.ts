import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMatriculaDisciplinaDto } from './dto/create-matricula-disciplina.dto';
import { UpdateMatriculaDisciplinaDto } from './dto/update-matricula-disciplina.dto';
import { TransferirTurmaDto } from './dto/transferir-turma.dto';

@Injectable()
export class MatriculaDisciplinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMatriculaDisciplinaDto, usuarioId?: string) {
    // Verifica existência de aluno e oferta
    const [aluno, oferta] = await Promise.all([
      this.prisma.aluno.findUnique({ where: { id: dto.alunoId } }),
      this.prisma.oferta.findUnique({
        where: { id: dto.ofertaId },
        include: { _count: { select: { matriculas: true } } },
      }),
    ]);
    if (!aluno) throw new BadRequestException('Aluno não encontrado.');
    if (!oferta) throw new BadRequestException('Oferta não encontrada.');

    // Verifica vagas disponíveis
    if (oferta._count.matriculas >= oferta.vagas) {
      throw new BadRequestException(
        `Oferta sem vagas disponíveis (${oferta.vagas} vagas, ${oferta._count.matriculas} matriculados).`,
      );
    }

    // Verifica matrícula duplicada (constraint única no DB — captura aqui para mensagem amigável)
    const jaMatriculado = await this.prisma.matriculaDisciplina.findUnique({
      where: { alunoId_ofertaId: { alunoId: dto.alunoId, ofertaId: dto.ofertaId } },
    });
    if (jaMatriculado) {
      throw new ConflictException('Aluno já está matriculado nesta oferta.');
    }

    // TODO: verificar pré-requisitos (confirmar regra com secretaria — seção 7 da spec)

    const matricula = await this.prisma.matriculaDisciplina.create({
      data: {
        alunoId: dto.alunoId,
        ofertaId: dto.ofertaId,
        isDependencia: dto.isDependencia ?? false,
      },
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        oferta: { include: { disciplina: true, periodoLetivo: true } },
      },
    });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'MatriculaDisciplina',
      entidadeId: matricula.id,
      dadosDepois: matricula,
    });

    return matricula;
  }

  findAll(alunoId?: string, ofertaId?: string) {
    return this.prisma.matriculaDisciplina.findMany({
      where: {
        ...(alunoId ? { alunoId } : {}),
        ...(ofertaId ? { ofertaId } : {}),
      },
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        oferta: { include: { disciplina: true, periodoLetivo: true } },
        resultado: true,
      },
      orderBy: { dataMatricula: 'desc' },
    });
  }

  /**
   * Mapão — relatório de notas/frequência de todos os alunos matriculados em uma oferta.
   * Equivalente ao "Relatório Notas/Disciplinas (Mapão)" do Kirsch.
   */
  async mapao(ofertaId: string) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id: ofertaId },
      include: { disciplina: true, periodoLetivo: true, professor: true },
    });
    if (!oferta) throw new NotFoundException(`Oferta "${ofertaId}" não encontrada.`);

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { ofertaId },
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        avaliacoes: true,
        resultado: true,
      },
      orderBy: { aluno: { nome: 'asc' } },
    });

    return {
      oferta: {
        id: oferta.id,
        disciplina: oferta.disciplina.nome,
        codigo: oferta.disciplina.codigo,
        cargaHoraria: oferta.disciplina.cargaHoraria,
        periodo: { ano: oferta.periodoLetivo.ano, semestre: oferta.periodoLetivo.semestre },
        professor: oferta.professor?.nome ?? null,
        turno: oferta.turno,
        vagas: oferta.vagas,
      },
      alunos: matriculas.map((m: any) => ({
        matriculaId: m.id,
        aluno: m.aluno,
        isDependencia: m.isDependencia,
        status: m.status,
        avaliacoes: m.avaliacoes.map((a: any) => ({ tipo: a.tipo, nota: a.nota, peso: a.peso })),
        mediaFinal: m.resultado?.mediaFinal ?? null,
        faltas: m.resultado?.faltas ?? null,
        frequenciaPercentual: m.resultado?.frequenciaPercentual ?? null,
        situacao: m.resultado?.situacao ?? null,
      })),
      geradoEm: new Date().toISOString(),
    };
  }

  async findOne(id: string) {
    const m = await this.prisma.matriculaDisciplina.findUnique({
      where: { id },
      include: {
        aluno: true,
        oferta: { include: { disciplina: true, periodoLetivo: true, professor: true } },
        avaliacoes: true,
        resultado: true,
      },
    });
    if (!m) throw new NotFoundException(`Matrícula "${id}" não encontrada.`);
    return m;
  }

  async update(id: string, dto: UpdateMatriculaDisciplinaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const matricula = await this.prisma.matriculaDisciplina.update({
      where: { id },
      data: dto,
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        oferta: { include: { disciplina: true, periodoLetivo: true } },
      },
    });
    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'MatriculaDisciplina',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: matricula,
    });
    return matricula;
  }

  /**
   * Transferência de Turma — move o aluno de uma oferta pra outra da MESMA disciplina,
   * preservando a matrícula (histórico de avaliações/resultado permanece ligado ao mesmo registro).
   * Equivalente ao "Transferência de Turma" do Kirsch.
   */
  async transferirTurma(id: string, dto: TransferirTurmaDto, usuarioId?: string) {
    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { id },
      include: { oferta: { include: { disciplina: true } }, aluno: { select: { id: true, nome: true, ra: true } } },
    });
    if (!matricula) throw new NotFoundException(`Matrícula "${id}" não encontrada.`);

    if (matricula.ofertaId === dto.novaOfertaId) {
      throw new BadRequestException('O aluno já está matriculado nesta turma.');
    }

    const novaOferta = await this.prisma.oferta.findUnique({
      where: { id: dto.novaOfertaId },
      include: { disciplina: true, periodoLetivo: true, _count: { select: { matriculas: true } } },
    });
    if (!novaOferta) throw new BadRequestException('Turma de destino não encontrada.');

    if (novaOferta.disciplinaId !== matricula.oferta.disciplinaId) {
      throw new BadRequestException(
        'A turma de destino precisa ser da mesma disciplina. Para trocar de disciplina, cancele a matrícula e crie uma nova.',
      );
    }

    if (novaOferta._count.matriculas >= novaOferta.vagas) {
      throw new BadRequestException(
        `Turma de destino sem vagas disponíveis (${novaOferta.vagas} vagas, ${novaOferta._count.matriculas} matriculados).`,
      );
    }

    const conflito = await this.prisma.matriculaDisciplina.findUnique({
      where: { alunoId_ofertaId: { alunoId: matricula.alunoId, ofertaId: dto.novaOfertaId } },
    });
    if (conflito) throw new ConflictException('Aluno já possui matrícula nessa turma de destino.');

    const atualizada = await this.prisma.matriculaDisciplina.update({
      where: { id },
      data: { ofertaId: dto.novaOfertaId },
      include: {
        aluno: { select: { id: true, ra: true, nome: true } },
        oferta: { include: { disciplina: true, periodoLetivo: true } },
      },
    });

    await this.audit.log({
      usuarioId,
      acao: 'TRANSFERENCIA_TURMA',
      entidade: 'MatriculaDisciplina',
      entidadeId: id,
      dadosAntes: { ofertaId: matricula.ofertaId, turma: matricula.oferta, motivo: dto.motivo ?? null },
      dadosDepois: { ofertaId: dto.novaOfertaId, turma: novaOferta },
    });

    return atualizada;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.matriculaDisciplina.delete({ where: { id } });
    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'MatriculaDisciplina',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
