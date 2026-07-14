import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateEmprestimoDto } from './dto/create-emprestimo.dto';
import { DevolverEmprestimoDto } from './dto/devolver-emprestimo.dto';

// Regras padrão definidas pro V1 (sem regra equivalente no Kirsch pra copiar —
// feature nova). Ajustável aqui se a secretaria pedir outro prazo/limite.
const PRAZO_DIAS: Record<'LIVRO' | 'EQUIPAMENTO', number> = { LIVRO: 7, EQUIPAMENTO: 15 };
const LIMITE_SIMULTANEOS = 3;

const INCLUDE_EMPRESTIMO = {
  usuario: { select: { id: true, nome: true, email: true, perfil: true } },
  exemplarLivro: { include: { livro: { select: { id: true, titulo: true, autor: true } } } },
  equipamento: { select: { id: true, patrimonio: true, modelo: true, tipo: true } },
} as const;

@Injectable()
export class EmprestimoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Empréstimo não guarda um status "ATRASADO" persistido (não há cron nesse
   * projeto pra transicionar isso sozinho) — em vez disso, "atrasado" é
   * calculado on-the-fly a cada leitura, mesmo padrão já usado em CR/
   * integralização/sessões de usuário logado. */
  private comEmAtraso<T extends { status: string; dataPrevistaDevolucao: Date }>(e: T) {
    return { ...e, emAtraso: e.status === 'EM_ANDAMENTO' && e.dataPrevistaDevolucao < new Date() };
  }

  async create(dto: CreateEmprestimoDto, operadorId?: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: dto.usuarioId } });
    if (!usuario) throw new BadRequestException('Usuário não encontrado.');

    const emAndamento = await this.prisma.emprestimo.count({
      where: { usuarioId: dto.usuarioId, status: 'EM_ANDAMENTO' },
    });
    if (emAndamento >= LIMITE_SIMULTANEOS) {
      throw new BadRequestException(`Limite de ${LIMITE_SIMULTANEOS} empréstimos simultâneos atingido para este usuário.`);
    }

    if (dto.tipoItem === 'LIVRO') {
      const exemplar = await this.prisma.exemplarLivro.findUnique({ where: { id: dto.itemId } });
      if (!exemplar) throw new NotFoundException('Exemplar não encontrado.');
      if (exemplar.status !== 'DISPONIVEL') throw new BadRequestException('Exemplar não está disponível para empréstimo.');
    } else {
      const equipamento = await this.prisma.equipamento.findUnique({ where: { id: dto.itemId } });
      if (!equipamento) throw new NotFoundException('Equipamento não encontrado.');
      if (equipamento.status !== 'DISPONIVEL') throw new BadRequestException('Equipamento não está disponível para empréstimo.');
    }

    const prazoDias = PRAZO_DIAS[dto.tipoItem];
    const dataPrevistaDevolucao = dto.dataPrevistaDevolucao
      ? new Date(dto.dataPrevistaDevolucao)
      : new Date(Date.now() + prazoDias * 24 * 60 * 60 * 1000);

    const emprestimo = await this.prisma.$transaction(async tx => {
      const criado = await tx.emprestimo.create({
        data: {
          tipoItem: dto.tipoItem,
          exemplarLivroId: dto.tipoItem === 'LIVRO' ? dto.itemId : undefined,
          equipamentoId: dto.tipoItem === 'EQUIPAMENTO' ? dto.itemId : undefined,
          usuarioId: dto.usuarioId,
          dataPrevistaDevolucao,
          observacoes: dto.observacoes,
          registradoPorId: operadorId,
        },
        include: INCLUDE_EMPRESTIMO,
      });

      if (dto.tipoItem === 'LIVRO') {
        await tx.exemplarLivro.update({ where: { id: dto.itemId }, data: { status: 'EMPRESTADO' } });
      } else {
        await tx.equipamento.update({ where: { id: dto.itemId }, data: { status: 'EMPRESTADO' } });
      }
      return criado;
    });

    if (operadorId) {
      await this.audit.log({ usuarioId: operadorId, acao: 'CREATE', entidade: 'Emprestimo', entidadeId: emprestimo.id, dadosDepois: emprestimo });
    }
    return this.comEmAtraso(emprestimo);
  }

  async findAll(filtros: { status?: string; tipoItem?: string; usuarioId?: string; atrasados?: boolean }) {
    const emprestimos = await this.prisma.emprestimo.findMany({
      where: {
        status: filtros.status as any,
        tipoItem: filtros.tipoItem as any,
        usuarioId: filtros.usuarioId,
      },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { dataEmprestimo: 'desc' },
    });
    const comFlag = emprestimos.map((e: any) => this.comEmAtraso(e));
    return filtros.atrasados ? comFlag.filter((e: any) => e.emAtraso) : comFlag;
  }

  async meus(usuarioId: string) {
    const emprestimos = await this.prisma.emprestimo.findMany({
      where: { usuarioId },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { dataEmprestimo: 'desc' },
    });
    return emprestimos.map((e: any) => this.comEmAtraso(e));
  }

  async findOne(id: string) {
    const emprestimo = await this.prisma.emprestimo.findUnique({ where: { id }, include: INCLUDE_EMPRESTIMO });
    if (!emprestimo) throw new NotFoundException('Empréstimo não encontrado.');
    return this.comEmAtraso(emprestimo);
  }

  async devolver(id: string, dto: DevolverEmprestimoDto, operadorId?: string) {
    const emprestimo = await this.prisma.emprestimo.findUnique({ where: { id } });
    if (!emprestimo) throw new NotFoundException('Empréstimo não encontrado.');
    if (emprestimo.status !== 'EM_ANDAMENTO') throw new BadRequestException('Este empréstimo já foi encerrado.');

    const novoStatusItem = dto.perdido ? 'EXTRAVIADO' : 'DISPONIVEL';
    const novoStatusEmprestimo = dto.perdido ? 'PERDIDO' : 'DEVOLVIDO';

    const atualizado = await this.prisma.$transaction(async tx => {
      const upd = await tx.emprestimo.update({
        where: { id },
        data: {
          status: novoStatusEmprestimo,
          dataDevolucao: new Date(),
          observacoes: dto.observacoes ?? emprestimo.observacoes,
        },
        include: INCLUDE_EMPRESTIMO,
      });

      if (emprestimo.tipoItem === 'LIVRO' && emprestimo.exemplarLivroId) {
        await tx.exemplarLivro.update({ where: { id: emprestimo.exemplarLivroId }, data: { status: novoStatusItem } });
      } else if (emprestimo.equipamentoId) {
        await tx.equipamento.update({ where: { id: emprestimo.equipamentoId }, data: { status: novoStatusItem } });
      }
      return upd;
    });

    if (operadorId) {
      await this.audit.log({ usuarioId: operadorId, acao: 'UPDATE', entidade: 'Emprestimo', entidadeId: id, dadosAntes: emprestimo, dadosDepois: atualizado });
    }
    return this.comEmAtraso(atualizado);
  }

  async relatorioResumo() {
    const [totalLivros, totalExemplares, exemplaresDisponiveis, totalEquipamentos, equipamentosDisponiveis, ativos] = await Promise.all([
      this.prisma.livro.count(),
      this.prisma.exemplarLivro.count(),
      this.prisma.exemplarLivro.count({ where: { status: 'DISPONIVEL' } }),
      this.prisma.equipamento.count(),
      this.prisma.equipamento.count({ where: { status: 'DISPONIVEL' } }),
      this.prisma.emprestimo.findMany({ where: { status: 'EM_ANDAMENTO' }, select: { dataPrevistaDevolucao: true } }),
    ]);
    const emprestimosAtrasados = ativos.filter((e: any) => e.dataPrevistaDevolucao < new Date()).length;

    // Ranking de livros mais emprestados: groupBy do Prisma não alcança campo
    // de relação aninhada (livroId fica dentro de ExemplarLivro, não em
    // Emprestimo) — agregação feita em memória, mesmo padrão já usado no
    // relatório de Ocorrências por Turma (sem escala suficiente pra justificar
    // uma query SQL bruta).
    const emprestimosLivro = await this.prisma.emprestimo.findMany({
      where: { tipoItem: 'LIVRO' },
      select: { exemplarLivro: { select: { livroId: true, livro: { select: { titulo: true } } } } },
    });
    const contagem = new Map<string, { titulo: string; total: number }>();
    for (const e of emprestimosLivro) {
      if (!e.exemplarLivro) continue;
      const chave = e.exemplarLivro.livroId;
      const atual = contagem.get(chave) ?? { titulo: e.exemplarLivro.livro.titulo, total: 0 };
      atual.total += 1;
      contagem.set(chave, atual);
    }
    const topLivrosMaisEmprestados = [...contagem.entries()]
      .map(([livroId, v]) => ({ livroId, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalLivros,
      totalExemplares,
      exemplaresDisponiveis,
      totalEquipamentos,
      equipamentosDisponiveis,
      emprestimosAtivos: ativos.length,
      emprestimosAtrasados,
      topLivrosMaisEmprestados,
    };
  }
}
