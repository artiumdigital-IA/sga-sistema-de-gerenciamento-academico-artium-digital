import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';

const include = {
  disciplina: true,
  periodoLetivo: true,
  professor: true,
  _count: { select: { matriculas: true } },
};

const STATUS_LABEL: Record<string, string> = {
  MATRICULADO: 'Matriculado',
  PENDENTE_EXAME: 'Aguardando exame final',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  DEPENDENCIA: 'Dependência',
  TRANCADO: 'Trancado',
};

@Injectable()
export class OfertaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOfertaDto, usuarioId?: string) {
    // Valida existência das FKs
    const [disciplina, periodo, professor] = await Promise.all([
      this.prisma.disciplina.findUnique({ where: { id: dto.disciplinaId } }),
      this.prisma.periodoLetivo.findUnique({ where: { id: dto.periodoLetivoId } }),
      this.prisma.professor.findUnique({ where: { id: dto.professorId } }),
    ]);
    if (!disciplina) throw new BadRequestException('Disciplina não encontrada.');
    if (!periodo) throw new BadRequestException('Período letivo não encontrado.');
    if (!professor) throw new BadRequestException('Professor não encontrado.');

    const oferta = await this.prisma.oferta.create({ data: dto, include });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'Oferta',
      entidadeId: oferta.id,
      dadosDepois: oferta,
    });

    return oferta;
  }

  findAll(periodoLetivoId?: string) {
    return this.prisma.oferta.findMany({
      where: periodoLetivoId ? { periodoLetivoId } : undefined,
      include,
      orderBy: { criadoEm: 'desc' },
    });
  }

  /** Listagem de Alunos por Turma — cada oferta (turma) com os alunos
   * matriculados (exclui CANCELADO), pra tela de accordion da secretaria e
   * pra exportação em Excel. */
  listarComAlunos(periodoLetivoId?: string) {
    return this.prisma.oferta.findMany({
      where: periodoLetivoId ? { periodoLetivoId } : undefined,
      include: {
        disciplina: true,
        periodoLetivo: true,
        professor: true,
        matriculas: {
          where: { status: { not: 'CANCELADO' } },
          include: { aluno: { select: { id: true, ra: true, nome: true, situacaoVinculo: true } } },
          orderBy: { aluno: { nome: 'asc' } },
        },
      },
      orderBy: [{ disciplina: { nome: 'asc' } }, { turno: 'asc' }],
    });
  }

  /** XLSX da Listagem de Alunos por Turma — 1 linha por aluno matriculado,
   * agrupado por turma (mesma fonte de dados da tela de accordion). */
  async streamXlsxAlunosPorTurma(periodoLetivoId: string | undefined, res: Response): Promise<void> {
    const ofertas = await this.listarComAlunos(periodoLetivoId);

    const workbook = new (ExcelJS as any).stream.xlsx.WorkbookWriter({ stream: res });
    const sheet = workbook.addWorksheet('Alunos por Turma');
    sheet.columns = [
      { header: 'Turma (Disciplina)', key: 'disciplina', width: 34 },
      { header: 'Turno', key: 'turno', width: 10 },
      { header: 'Período Letivo', key: 'periodo', width: 16 },
      { header: 'Professor', key: 'professor', width: 28 },
      { header: 'RA', key: 'ra', width: 14 },
      { header: 'Aluno', key: 'aluno', width: 32 },
      { header: 'Situação', key: 'situacao', width: 16 },
    ];

    for (const oferta of ofertas) {
      const base = {
        disciplina: `${oferta.disciplina.codigo} - ${oferta.disciplina.nome}`,
        turno: oferta.turno,
        periodo: `${oferta.periodoLetivo.ano}/${oferta.periodoLetivo.semestre}`,
        professor: oferta.professor.nome,
      };
      if (oferta.matriculas.length === 0) {
        sheet.addRow({ ...base, ra: '', aluno: '(sem alunos matriculados)', situacao: '' }).commit();
        continue;
      }
      for (const m of oferta.matriculas) {
        sheet.addRow({ ...base, ra: m.aluno.ra, aluno: m.aluno.nome, situacao: STATUS_LABEL[m.status] ?? m.status }).commit();
      }
    }
    sheet.commit();
    await workbook.commit();
  }

  async findOne(id: string) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id },
      include: {
        ...include,
        matriculas: {
          include: { aluno: { select: { id: true, ra: true, nome: true } } },
        },
      },
    });
    if (!oferta) throw new NotFoundException(`Oferta "${id}" não encontrada.`);
    return oferta;
  }

  async update(id: string, dto: UpdateOfertaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const oferta = await this.prisma.oferta.update({ where: { id }, data: dto, include });
    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Oferta',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: oferta,
    });
    return oferta;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.oferta.delete({ where: { id } });
    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'Oferta',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
