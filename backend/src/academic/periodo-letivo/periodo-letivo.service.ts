import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreatePeriodoLetivoDto } from './dto/create-periodo-letivo.dto';
import { UpdatePeriodoLetivoDto } from './dto/update-periodo-letivo.dto';

@Injectable()
export class PeriodoLetivoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreatePeriodoLetivoDto, usuarioId?: string) {
    const existe = await this.prisma.periodoLetivo.findUnique({
      where: { ano_semestre: { ano: dto.ano, semestre: dto.semestre } },
    });
    if (existe) {
      throw new ConflictException(`Período ${dto.ano}/${dto.semestre} já existe.`);
    }

    const periodo = await this.prisma.periodoLetivo.create({
      data: {
        ...dto,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
      },
    });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'PeriodoLetivo',
      entidadeId: periodo.id,
      dadosDepois: periodo,
    });

    return periodo;
  }

  findAll() {
    return this.prisma.periodoLetivo.findMany({
      orderBy: [{ ano: 'desc' }, { semestre: 'desc' }],
    });
  }

  async findOne(id: string) {
    const periodo = await this.prisma.periodoLetivo.findUnique({
      where: { id },
      include: { ofertas: { include: { disciplina: true, professor: true } } },
    });
    if (!periodo) throw new NotFoundException(`Período "${id}" não encontrado.`);
    return periodo;
  }

  async update(id: string, dto: UpdatePeriodoLetivoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const periodo = await this.prisma.periodoLetivo.update({
      where: { id },
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      },
    });
    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'PeriodoLetivo',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: periodo,
    });
    return periodo;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.periodoLetivo.delete({ where: { id } });
    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'PeriodoLetivo',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
