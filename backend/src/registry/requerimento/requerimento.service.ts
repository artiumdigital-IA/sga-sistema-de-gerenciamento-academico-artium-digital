import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateRequerimentoDto } from './dto/create-requerimento.dto';
import { UpdateRequerimentoDto } from './dto/update-requerimento.dto';

@Injectable()
export class RequerimentoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateRequerimentoDto, userId?: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: dto.alunoId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    const item = await (this.prisma as any).requerimento.create({
      data: dto,
      include: { aluno: { select: { id: true, nome: true, ra: true } }, tipoCatalogo: true },
    });
    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'Requerimento', entidadeId: item.id, dadosDepois: item });
    return item;
  }

  /** Autoatendimento — o próprio aluno abre um requerimento escolhendo um
   * item da tabela de preços (ver TipoRequerimentoCatalogo). `tipo` (enum
   * antigo) grava OUTRO só pra manter a coluna não-nula; quem quiser saber o
   * tipo de verdade lê `tipoCatalogo`. Chamado por DiscenteService — nunca
   * recebe alunoId de fora, sempre já vem resolvido do usuário logado. */
  async abrirPorAluno(alunoId: string, tipoCatalogoId: string, descricao: string | undefined, usuarioId?: string) {
    const tipoCatalogo = await this.prisma.tipoRequerimentoCatalogo.findUnique({ where: { id: tipoCatalogoId } });
    if (!tipoCatalogo || !tipoCatalogo.ativo) throw new NotFoundException('Tipo de requerimento não encontrado.');

    const item = await (this.prisma as any).requerimento.create({
      data: { alunoId, tipo: 'OUTRO', tipoCatalogoId, descricao },
      include: { aluno: { select: { id: true, nome: true, ra: true } }, tipoCatalogo: true },
    });
    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Requerimento', entidadeId: item.id, dadosDepois: item });
    return item;
  }

  findAll(alunoId?: string, status?: string, tipo?: string) {
    return (this.prisma as any).requerimento.findMany({
      where: {
        ...(alunoId ? { alunoId } : {}),
        ...(status ? { status } : {}),
        ...(tipo ? { tipo } : {}),
      },
      include: { aluno: { select: { id: true, nome: true, ra: true, curso: { select: { nome: true } } } }, tipoCatalogo: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).requerimento.findUnique({
      where: { id },
      include: { aluno: { select: { id: true, nome: true, ra: true, email: true, curso: { select: { nome: true } } } }, tipoCatalogo: true },
    });
    if (!item) throw new NotFoundException('Requerimento não encontrado');
    return item;
  }

  async update(id: string, dto: UpdateRequerimentoDto, userId?: string) {
    const before = await this.findOne(id);
    const updated = await (this.prisma as any).requerimento.update({
      where: { id },
      data: dto,
      include: { aluno: { select: { id: true, nome: true, ra: true } }, tipoCatalogo: true },
    });
    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'Requerimento', entidadeId: id, dadosAntes: before, dadosDepois: updated });
    return updated;
  }
}
