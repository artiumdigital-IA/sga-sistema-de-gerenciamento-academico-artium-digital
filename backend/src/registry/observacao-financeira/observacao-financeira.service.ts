import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateObservacaoFinanceiraDto } from './dto/create-observacao-financeira.dto';

@Injectable()
export class ObservacaoFinanceiraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(alunoId: string, dto: CreateObservacaoFinanceiraDto, usuarioId?: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) throw new BadRequestException('Aluno não encontrado.');

    const observacao = await this.prisma.observacaoFinanceira.create({
      data: { alunoId, observacao: dto.observacao, usuarioId },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ObservacaoFinanceira', entidadeId: observacao.id, dadosDepois: observacao });
    }
    return observacao;
  }

  findByAluno(alunoId: string) {
    return this.prisma.observacaoFinanceira.findMany({
      where: { alunoId },
      orderBy: { data: 'desc' },
    });
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.prisma.observacaoFinanceira.findUnique({ where: { id } });
    if (!antes) throw new NotFoundException('Observação não encontrada.');
    await this.prisma.observacaoFinanceira.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'ObservacaoFinanceira', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Observação removida.' };
  }
}
