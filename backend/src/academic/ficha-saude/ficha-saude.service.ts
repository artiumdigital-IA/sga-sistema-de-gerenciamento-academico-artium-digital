import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { UpsertFichaSaudeDto } from './dto/upsert-ficha-saude.dto';

@Injectable()
export class FichaSaudeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Retorna a ficha de saúde do aluno, ou null se ainda não foi preenchida
   * (não é erro — nem todo aluno vai ter uma ficha registrada).
   */
  async findByAluno(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, select: { id: true, nome: true, ra: true } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

    const ficha = await this.prisma.fichaSaude.findUnique({ where: { alunoId } });
    return { aluno, ficha };
  }

  async upsert(alunoId: string, dto: UpsertFichaSaudeDto, usuarioId?: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

    const antes = await this.prisma.fichaSaude.findUnique({ where: { alunoId } });

    const ficha = await this.prisma.fichaSaude.upsert({
      where: { alunoId },
      create: { alunoId, ...dto },
      update: { ...dto },
    });

    if (usuarioId) {
      await this.audit.log({
        usuarioId,
        acao: antes ? 'UPDATE' : 'CREATE',
        entidade: 'FichaSaude',
        entidadeId: ficha.id,
        dadosAntes: antes ?? undefined,
        dadosDepois: ficha,
      });
    }

    return ficha;
  }
}
