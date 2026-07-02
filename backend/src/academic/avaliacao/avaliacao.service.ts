import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';
import { ImportarAvaliacoesDto } from './dto/importar-avaliacoes.dto';

@Injectable()
export class AvaliacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateAvaliacaoDto, usuarioId?: string) {
    const avaliacao = await this.prisma.avaliacao.create({
      data: { ...dto, nota: dto.nota, peso: dto.peso },
      include: { matriculaDisciplina: { include: { aluno: { select: { ra: true, nome: true } }, oferta: { include: { disciplina: true } } } } },
    });
    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Avaliacao', entidadeId: avaliacao.id, dadosDepois: avaliacao });
    return avaliacao;
  }

  findAll(matriculaDisciplinaId?: string) {
    return this.prisma.avaliacao.findMany({
      where: matriculaDisciplinaId ? { matriculaDisciplinaId } : undefined,
      include: {
        matriculaDisciplina: {
          include: {
            aluno: { select: { ra: true, nome: true } },
            oferta: { include: { disciplina: { select: { codigo: true, nome: true } }, periodoLetivo: true } },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.avaliacao.findUnique({
      where: { id },
      include: { matriculaDisciplina: { include: { aluno: true, oferta: { include: { disciplina: true } } } } },
    });
    if (!a) throw new NotFoundException(`Avaliação "${id}" não encontrada.`);
    return a;
  }

  async update(id: string, dto: UpdateAvaliacaoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const avaliacao = await this.prisma.avaliacao.update({ where: { id }, data: dto });
    await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Avaliacao', entidadeId: id, dadosAntes: antes, dadosDepois: avaliacao });
    return avaliacao;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.avaliacao.delete({ where: { id } });
    await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Avaliacao', entidadeId: id, dadosAntes: antes });
  }

  /**
   * Importação de Planilha de Notas — recebe linhas (RA, tipo, nota, peso) de uma oferta
   * e cria uma Avaliacao por linha, casando o aluno pelo RA. Não falha tudo se uma linha
   * der erro — reporta sucesso/erro por linha (equivalente ao "Importação Planilha Excel" do Kirsch).
   */
  async importarPlanilha(dto: ImportarAvaliacoesDto, usuarioId?: string) {
    const resultado: { ra: string; status: 'ok' | 'erro'; mensagem?: string }[] = [];

    for (const linha of dto.linhas) {
      try {
        const aluno = await this.prisma.aluno.findFirst({ where: { ra: linha.ra } });
        if (!aluno) {
          resultado.push({ ra: linha.ra, status: 'erro', mensagem: 'RA não encontrado.' });
          continue;
        }
        const matricula = await this.prisma.matriculaDisciplina.findUnique({
          where: { alunoId_ofertaId: { alunoId: aluno.id, ofertaId: dto.ofertaId } },
        });
        if (!matricula) {
          resultado.push({ ra: linha.ra, status: 'erro', mensagem: 'Aluno não matriculado nesta oferta.' });
          continue;
        }
        const avaliacao = await this.prisma.avaliacao.create({
          data: { matriculaDisciplinaId: matricula.id, tipo: linha.tipo as any, nota: linha.nota, peso: linha.peso },
        });
        if (usuarioId) {
          await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Avaliacao', entidadeId: avaliacao.id, dadosDepois: avaliacao });
        }
        resultado.push({ ra: linha.ra, status: 'ok' });
      } catch (e: any) {
        resultado.push({ ra: linha.ra, status: 'erro', mensagem: e?.message ?? 'Erro desconhecido.' });
      }
    }

    return {
      total: dto.linhas.length,
      sucesso: resultado.filter(r => r.status === 'ok').length,
      erro: resultado.filter(r => r.status === 'erro').length,
      detalhes: resultado,
    };
  }
}
