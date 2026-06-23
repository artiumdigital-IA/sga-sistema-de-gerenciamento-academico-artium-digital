import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateCursoDto, usuarioId?: string) {
    const existe = await this.prisma.curso.findUnique({
      where: { codigoEmec: dto.codigoEmec },
    });
    if (existe) {
      throw new ConflictException(
        `Já existe um curso com o código e-MEC "${dto.codigoEmec}".`,
      );
    }

    const curso = await this.prisma.curso.create({ data: dto });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'Curso',
      entidadeId: curso.id,
      dadosDepois: curso,
    });

    return curso;
  }

  findAll() {
    return this.prisma.curso.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: { matrizesCurriculares: true },
    });
    if (!curso) throw new NotFoundException(`Curso "${id}" não encontrado.`);
    return curso;
  }

  async update(id: string, dto: UpdateCursoDto, usuarioId?: string) {
    const antes = await this.findOne(id);

    if (dto.codigoEmec && dto.codigoEmec !== antes.codigoEmec) {
      const conflito = await this.prisma.curso.findUnique({
        where: { codigoEmec: dto.codigoEmec },
      });
      if (conflito) {
        throw new ConflictException(
          `Já existe outro curso com o código e-MEC "${dto.codigoEmec}".`,
        );
      }
    }

    const curso = await this.prisma.curso.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Curso',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: curso,
    });

    return curso;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);

    await this.prisma.curso.delete({ where: { id } });

    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'Curso',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
