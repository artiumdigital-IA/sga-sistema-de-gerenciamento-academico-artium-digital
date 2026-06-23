import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMatrizDto } from './dto/create-matriz.dto';
import { UpdateMatrizDto } from './dto/update-matriz.dto';

@Injectable()
export class MatrizCurricularService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMatrizDto, usuarioId?: string) {
    // Verifica se o curso existe
    const curso = await this.prisma.curso.findUnique({
      where: { id: dto.cursoId },
    });
    if (!curso) {
      throw new NotFoundException(`Curso "${dto.cursoId}" não encontrado.`);
    }

    // Verifica unicidade (cursoId + versao)
    const existe = await this.prisma.matrizCurricular.findUnique({
      where: { cursoId_versao: { cursoId: dto.cursoId, versao: dto.versao } },
    });
    if (existe) {
      throw new ConflictException(
        `Já existe uma matriz "${dto.versao}" para este curso.`,
      );
    }

    const matriz = await this.prisma.matrizCurricular.create({ data: dto });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'MatrizCurricular',
      entidadeId: matriz.id,
      dadosDepois: matriz,
    });

    return matriz;
  }

  findAll(cursoId?: string) {
    return this.prisma.matrizCurricular.findMany({
      where: cursoId ? { cursoId } : undefined,
      include: { curso: { select: { id: true, nome: true } } },
      orderBy: [{ anoVigencia: 'desc' }, { versao: 'desc' }],
    });
  }

  async findOne(id: string) {
    const matriz = await this.prisma.matrizCurricular.findUnique({
      where: { id },
      include: {
        curso: { select: { id: true, nome: true } },
        disciplinas: { orderBy: { periodoSugerido: 'asc' } },
      },
    });
    if (!matriz) {
      throw new NotFoundException(`MatrizCurricular "${id}" não encontrada.`);
    }
    return matriz;
  }

  async update(id: string, dto: UpdateMatrizDto, usuarioId?: string) {
    const antes = await this.findOne(id);

    if (dto.versao && dto.versao !== antes.versao) {
      const conflito = await this.prisma.matrizCurricular.findUnique({
        where: {
          cursoId_versao: {
            cursoId: antes.cursoId,
            versao: dto.versao,
          },
        },
      });
      if (conflito) {
        throw new ConflictException(
          `Já existe outra matriz "${dto.versao}" para este curso.`,
        );
      }
    }

    const matriz = await this.prisma.matrizCurricular.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'MatrizCurricular',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: matriz,
    });

    return matriz;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.matrizCurricular.delete({ where: { id } });
    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'MatrizCurricular',
      entidadeId: id,
      dadosAntes: antes,
    });
  }
}
