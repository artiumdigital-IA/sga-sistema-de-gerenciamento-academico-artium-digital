import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateEventoCalendarioDto } from './dto/create-evento-calendario.dto';
import { UpdateEventoCalendarioDto } from './dto/update-evento-calendario.dto';

@Injectable()
export class EventoCalendarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEventoCalendarioDto, usuarioId?: string) {
    const periodo = await this.prisma.periodoLetivo.findUnique({ where: { id: dto.periodoLetivoId } });
    if (!periodo) throw new NotFoundException(`Período letivo "${dto.periodoLetivoId}" não encontrado.`);

    const evento = await this.prisma.eventoCalendario.create({
      data: {
        periodoLetivoId: dto.periodoLetivoId,
        grupo: dto.grupo,
        titulo: dto.titulo,
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
        observacoes: dto.observacoes,
        ordem: dto.ordem ?? 0,
      },
    });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'EventoCalendario',
      entidadeId: evento.id,
      dadosDepois: evento,
    });

    return evento;
  }

  findAll(periodoLetivoId?: string) {
    return this.prisma.eventoCalendario.findMany({
      where: periodoLetivoId ? { periodoLetivoId } : undefined,
      orderBy: [{ ordem: 'asc' }, { dataInicio: 'asc' }],
    });
  }

  async findOne(id: string) {
    const evento = await this.prisma.eventoCalendario.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException(`Evento de calendário "${id}" não encontrado.`);
    return evento;
  }

  async update(id: string, dto: UpdateEventoCalendarioDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const evento = await this.prisma.eventoCalendario.update({
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
      entidade: 'EventoCalendario',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: evento,
    });
    return evento;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.eventoCalendario.delete({ where: { id } });
    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'EventoCalendario',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
