import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';
import { CreateExemplarDto } from './dto/create-exemplar.dto';

@Injectable()
export class LivroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateLivroDto, usuarioId?: string) {
    const livro = await this.prisma.livro.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Livro', entidadeId: livro.id, dadosDepois: livro });
    }
    return livro;
  }

  findAll(busca?: string) {
    return this.prisma.livro.findMany({
      where: busca
        ? {
            OR: [
              { titulo: { contains: busca, mode: 'insensitive' } },
              { autor: { contains: busca, mode: 'insensitive' } },
              { categoria: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { exemplares: { select: { id: true, codigoTombamento: true, status: true } } },
      orderBy: { titulo: 'asc' },
    });
  }

  async findOne(id: string) {
    const livro = await this.prisma.livro.findUnique({
      where: { id },
      include: { exemplares: { orderBy: { codigoTombamento: 'asc' } } },
    });
    if (!livro) throw new NotFoundException('Livro não encontrado.');
    return livro;
  }

  async update(id: string, dto: UpdateLivroDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const livro = await this.prisma.livro.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Livro', entidadeId: id, dadosAntes: antes, dadosDepois: livro });
    }
    return livro;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    const emprestado = antes.exemplares.some((e: any) => e.status === 'EMPRESTADO');
    if (emprestado) throw new BadRequestException('Não é possível remover: há exemplares emprestados no momento.');
    await this.prisma.livro.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Livro', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Livro removido.' };
  }

  async addExemplar(livroId: string, dto: CreateExemplarDto, usuarioId?: string) {
    await this.findOne(livroId);
    const existente = await this.prisma.exemplarLivro.findUnique({ where: { codigoTombamento: dto.codigoTombamento } });
    if (existente) throw new ConflictException('Já existe um exemplar com esse código de tombamento.');

    const exemplar = await this.prisma.exemplarLivro.create({ data: { ...dto, livroId } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ExemplarLivro', entidadeId: exemplar.id, dadosDepois: exemplar });
    }
    return exemplar;
  }

  async removeExemplar(livroId: string, exemplarId: string, usuarioId?: string) {
    const exemplar = await this.prisma.exemplarLivro.findUnique({ where: { id: exemplarId } });
    if (!exemplar || exemplar.livroId !== livroId) throw new NotFoundException('Exemplar não encontrado.');
    if (exemplar.status === 'EMPRESTADO') throw new BadRequestException('Não é possível remover: exemplar emprestado no momento.');

    await this.prisma.exemplarLivro.delete({ where: { id: exemplarId } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'ExemplarLivro', entidadeId: exemplarId, dadosAntes: exemplar });
    }
    return { message: 'Exemplar removido.' };
  }
}
