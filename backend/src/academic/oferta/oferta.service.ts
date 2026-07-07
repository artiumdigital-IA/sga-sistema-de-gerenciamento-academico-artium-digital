import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
