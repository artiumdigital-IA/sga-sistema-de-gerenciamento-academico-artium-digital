import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@Injectable()
export class AvisoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateAvisoDto, usuarioId?: string) {
    const aviso = await (this.prisma as any).aviso.create({
      data: {
        titulo: dto.titulo,
        texto: dto.texto,
        tag: dto.tag ?? 'GERAL',
        autorNome: dto.autorNome ?? 'Admin',
        ...(dto.autorId ? { autorId: dto.autorId } : {}),
        ...(dto.ofertaId ? { ofertaId: dto.ofertaId } : {}),
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'aviso', entidadeId: aviso.id, dadosDepois: aviso });
    }
    return aviso;
  }

  /**
   * Sem `usuario`/perfil !== ALUNO: comportamento inalterado, mostra o mural
   * inteiro (geral + de turma) — é assim que Admin/Secretaria/Professor
   * sempre viram os avisos, sem regressão.
   *
   * Perfil ALUNO: filtra pra avisos gerais (ofertaId null) OU avisos de
   * turma cuja oferta é uma das que o aluno está matriculado — um aluno
   * nunca vê aviso de turma de outra disciplina/turma que não é dele.
   */
  async findAll(usuario?: { id: string; perfil: string }) {
    const where: any = {};

    if (usuario?.perfil === 'ALUNO') {
      const u = await this.prisma.usuario.findUnique({ where: { id: usuario.id }, select: { alunoId: true } });
      if (u?.alunoId) {
        const matriculas = await this.prisma.matriculaDisciplina.findMany({
          where: { alunoId: u.alunoId },
          select: { ofertaId: true },
        });
        const ofertaIds = matriculas.map(m => m.ofertaId);
        where.OR = [{ ofertaId: null }, { ofertaId: { in: ofertaIds } }];
      } else {
        where.ofertaId = null;
      }
    }

    return (this.prisma as any).aviso.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 50,
      include: { oferta: { include: { disciplina: { select: { nome: true, codigo: true } } } } },
    });
  }

  async findOne(id: string) {
    const aviso = await (this.prisma as any).aviso.findUnique({ where: { id } });
    if (!aviso) throw new NotFoundException('Aviso não encontrado.');
    return aviso;
  }

  async update(id: string, dto: UpdateAvisoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const aviso = await (this.prisma as any).aviso.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        texto: dto.texto,
        tag: dto.tag,
        autorNome: dto.autorNome,
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'aviso', entidadeId: id, dadosAntes: antes, dadosDepois: aviso });
    }
    return aviso;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await (this.prisma as any).aviso.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'aviso', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Aviso removido.' };
  }
}
