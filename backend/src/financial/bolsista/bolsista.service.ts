import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateBolsistaDto } from './dto/create-bolsista.dto';
import { UpdateBolsistaDto } from './dto/update-bolsista.dto';

const ALUNO_SELECT = { id: true, ra: true, nome: true, curso: { select: { nome: true } } } as const;

@Injectable()
export class BolsistaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateBolsistaDto, usuarioId?: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: dto.alunoId } });
    if (!aluno) throw new BadRequestException('Aluno não encontrado.');

    const bolsista = await this.prisma.bolsista.create({
      data: {
        alunoId: dto.alunoId,
        tipoBolsa: dto.tipoBolsa,
        percentual: dto.percentual,
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
        ativo: dto.ativo,
        observacoes: dto.observacoes,
      },
      include: { aluno: { select: ALUNO_SELECT } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Bolsista', entidadeId: bolsista.id, dadosDepois: bolsista });
    }
    return bolsista;
  }

  /** "Listagem de Alunos Bolsistas" */
  findAll(somenteAtivos?: boolean) {
    return this.prisma.bolsista.findMany({
      where: somenteAtivos ? { ativo: true } : undefined,
      include: { aluno: { select: ALUNO_SELECT } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findByAluno(alunoId: string) {
    return this.prisma.bolsista.findMany({
      where: { alunoId },
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findOne(id: string) {
    const bolsista = await this.prisma.bolsista.findUnique({ where: { id }, include: { aluno: { select: ALUNO_SELECT } } });
    if (!bolsista) throw new NotFoundException('Registro de bolsista não encontrado.');
    return bolsista;
  }

  async update(id: string, dto: UpdateBolsistaDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const bolsista = await this.prisma.bolsista.update({
      where: { id },
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      },
      include: { aluno: { select: ALUNO_SELECT } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Bolsista', entidadeId: id, dadosAntes: antes, dadosDepois: bolsista });
    }
    return bolsista;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.bolsista.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Bolsista', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Registro de bolsista removido.' };
  }
}
