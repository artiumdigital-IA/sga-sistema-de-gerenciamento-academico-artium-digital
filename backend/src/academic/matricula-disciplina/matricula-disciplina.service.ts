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
