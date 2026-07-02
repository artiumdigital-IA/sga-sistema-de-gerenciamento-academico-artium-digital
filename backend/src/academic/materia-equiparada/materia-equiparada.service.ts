import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMateriaEquiparadaDto } from './dto/create-materia-equiparada.dto';

@Injectable()
export class MateriaEquiparadaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findByAluno(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, select: { id: true, nome: true, ra: true } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

    const equiparacoes = await this.prisma.materiaEquiparada.findMany({
      where: { alunoId },
      include: { disciplina: { select: { nome: true, codigo: true, cargaHoraria: true } } },
      orderBy: { dataAprovacao: 'desc' },
    });
    return { aluno, equiparacoes };
  }

  async create(dto: CreateMateriaEquiparadaDto, usuarioId?: string) {
    const [aluno, disciplina] = await Promise.all([
      this.prisma.aluno.findUnique({ where: { id: dto.alunoId } }),
      this.prisma.disciplina.findUnique({ where: { id: dto.disciplinaId } }),
    ]);
    if (!aluno) throw new BadRequestException('Aluno não encontrado.');
    if (!disciplina) throw new BadRequestException('Disciplina não encontrada.');

    const equiparacao = await this.prisma.materiaEquiparada.create({
      data: {
        alunoId: dto.alunoId,
        disciplinaId: dto.disciplinaId,
        instituicaoOrigem: dto.instituicaoOrigem,
        disciplinaOrigem: dto.disciplinaOrigem,
        cargaHorariaOrigem: dto.cargaHorariaOrigem,
        dataAprovacao: new Date(dto.dataAprovacao),
        observacoes: dto.observacoes,
      },
      include: { disciplina: { select: { nome: true, codigo: true, cargaHoraria: true } } },
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'MateriaEquiparada', entidadeId: equiparacao.id, dadosDepois: equiparacao });
    }
    return equiparacao;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.prisma.materiaEquiparada.findUnique({ where: { id } });
    if (!antes) throw new NotFoundException('Equiparação não encontrada.');

    await this.prisma.materiaEquiparada.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'MateriaEquiparada', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Equiparação removida.' };
  }
}
