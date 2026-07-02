import {
  BadRequestException,
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
        dependentes: {
          include: { disciplina: { select: { id: true, codigo: true, nome: true } } },
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

  /** Verifica se `alvoId` é alcançável a partir de `origemId` na cadeia de pré-requisitos
   * (ou seja, se origemId depende, direta ou indiretamente, de alvoId). Usado pra barrar ciclos. */
  private async dependeDe(origemId: string, alvoId: string): Promise<boolean> {
    const visitados = new Set<string>();
    let fila = [origemId];
    while (fila.length) {
      const vinculos = await this.prisma.disciplinaPrerequisito.findMany({
        where: { disciplinaId: { in: fila } },
        select: { prerequisitoId: true },
      });
      const proximos: string[] = [];
      for (const v of vinculos) {
        if (v.prerequisitoId === alvoId) return true;
        if (!visitados.has(v.prerequisitoId)) {
          visitados.add(v.prerequisitoId);
          proximos.push(v.prerequisitoId);
        }
      }
      fila = proximos;
    }
    return false;
  }

  async addPrerequisito(
    disciplinaId: string,
    prerequisitoId: string,
    usuarioId?: string,
  ) {
    if (disciplinaId === prerequisitoId) {
      throw new BadRequestException(
        'Uma disciplina não pode ser pré-requisito de si mesma.',
      );
    }

    const [disciplina, prerequisito] = await Promise.all([
      this.prisma.disciplina.findUnique({ where: { id: disciplinaId } }),
      this.prisma.disciplina.findUnique({ where: { id: prerequisitoId } }),
    ]);
    if (!disciplina) {
      throw new NotFoundException(`Disciplina "${disciplinaId}" não encontrada.`);
    }
    if (!prerequisito) {
      throw new NotFoundException(`Disciplina "${prerequisitoId}" não encontrada.`);
    }

    const existente = await this.prisma.disciplinaPrerequisito.findUnique({
      where: {
        disciplinaId_prerequisitoId: { disciplinaId, prerequisitoId },
      },
    });
    if (existente) {
      throw new ConflictException('Esse pré-requisito já está cadastrado.');
    }

    // Se o pré-requisito escolhido já depende (direta ou indiretamente) da própria
    // disciplina, cadastrar o vínculo criaria um ciclo — bloqueia.
    if (await this.dependeDe(prerequisitoId, disciplinaId)) {
      throw new BadRequestException(
        'Esse vínculo criaria uma dependência circular entre disciplinas.',
      );
    }

    const vinculo = await this.prisma.disciplinaPrerequisito.create({
      data: { disciplinaId, prerequisitoId },
      include: { prerequisito: { select: { id: true, codigo: true, nome: true } } },
    });

    await this.audit.log({
      usuarioId,
      acao: 'CREATE',
      entidade: 'DisciplinaPrerequisito',
      entidadeId: vinculo.id,
      dadosDepois: vinculo,
    });

    return vinculo;
  }

  async removePrerequisito(
    disciplinaId: string,
    prerequisitoId: string,
    usuarioId?: string,
  ) {
    const vinculo = await this.prisma.disciplinaPrerequisito.findUnique({
      where: {
        disciplinaId_prerequisitoId: { disciplinaId, prerequisitoId },
      },
    });
    if (!vinculo) {
      throw new NotFoundException('Vínculo de pré-requisito não encontrado.');
    }

    await this.prisma.disciplinaPrerequisito.delete({ where: { id: vinculo.id } });

    await this.audit.log({
      usuarioId,
      acao: 'DELETE',
      entidade: 'DisciplinaPrerequisito',
      entidadeId: vinculo.id,
      dadosAntes: vinculo,
    });
  }
}
