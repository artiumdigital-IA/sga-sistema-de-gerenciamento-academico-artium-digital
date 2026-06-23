import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';

@Injectable()
export class DisciplinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateDisciplinaDto, usuarioId?: string) {
    const matriz = await this.prisma.matrizCurricular.findUnique({
      where: { id: dto.matrizCurricularId },
    });
    if (!matriz) {
      throw new NotFoundException(
        `MatrizCurricular "${dto.matrizCurricularId}" não encontrada.`,
      );
    }

    const existe = await this.prisma.disciplina.findUnique({
      where: {
        matrizCurricularId_codigo: {
          matrizCurricularId: dto.matrizCurricularId,
          codigo: dto.codigo,
        },
      },
    });
    if (existe) {
      throw new ConflictException(
        `Já existe uma disciplina com o código "${dto.codigo}" nesta matriz.`,
      );
    }

    const disciplina = await this.prisma.disciplina.create({ data: dto });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'Disciplina',
      entidadeId: disciplina.id,
      dadosDepois: disciplina,
    });

    return disciplina;
  }

  findAll(matrizCurricularId?: string) {
    return this.prisma.disciplina.findMany({
      where: matrizCurricularId ? { matrizCurricularId } : undefined,
      orderBy: [{ periodoSugerido: 'asc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id },
      include: {
        matrizCurricular: {
          select: {
            id: true,
            versao: true,
            curso: { select: { id: true, nome: true } },
          },
        },
        prerequisitos: {
          include: { prerequisito: { select: { id: true, codigo: true, nome: true } } },
        },
      },
    });
    if (!disciplina) {
      throw new NotFoundException(`Disciplina "${id}" não encontrada.`);
    }
    return disciplina;
  }

  async update(id: string, dto: UpdateDisciplinaDto, usuarioId?: string) {
    const antes = await this.findOne(id);

    if (dto.codigo && dto.codigo !== antes.codigo) {
      const conflito = await this.prisma.disciplina.findUnique({
        where: {
          matrizCurricularId_codigo: {
            matrizCurricularId: antes.matrizCurricularId,
            codigo: dto.codigo,
          },
        },
      });
      if (conflito) {
        throw new ConflictException(
          `Já existe outra disciplina com o código "${dto.codigo}" nesta matriz.`,
        );
      }
    }

    const disciplina = await this.prisma.disciplina.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Disciplina',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: disciplina,
    });

    return disciplina;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.disciplina.delete({ where: { id } });
    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'Disciplina',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
