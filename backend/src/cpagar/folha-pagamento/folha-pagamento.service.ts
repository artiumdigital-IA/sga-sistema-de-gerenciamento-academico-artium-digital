import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { TabelaInssService } from '../tabela-inss/tabela-inss.service';
import { TabelaIrrfService } from '../tabela-irrf/tabela-irrf.service';
import { calcularInss, calcularIrrf, baseCalculoIrrf, calcularFgts } from '../calculo-folha.util';
import { CreateFolhaDto } from './dto/create-folha.dto';
import { CreateItemFolhaDto } from './dto/create-item-folha.dto';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';

const ITEM_INCLUDE = {
  professor: { include: { professor: { select: { id: true, nome: true, cpf: true, titulacao: true } } } },
  colaborador: { select: { id: true, nome: true, cpf: true, cargo: true, tipoVinculo: true } },
  lancamentos: { orderBy: { criadoEm: 'asc' as const } },
};

@Injectable()
export class FolhaPagamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tabelaInss: TabelaInssService,
    private readonly tabelaIrrf: TabelaIrrfService,
  ) {}

  async create(dto: CreateFolhaDto, usuarioId?: string) {
    const existente = await this.prisma.folhaPagamento.findUnique({
      where: { competenciaMes_competenciaAno: { competenciaMes: dto.competenciaMes, competenciaAno: dto.competenciaAno } },
    });
    if (existente) throw new ConflictException('Já existe uma folha cadastrada pra essa competência.');

    const folha = await this.prisma.folhaPagamento.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'FolhaPagamento', entidadeId: folha.id, dadosDepois: folha });
    }
    return folha;
  }

  findAll() {
    return this.prisma.folhaPagamento.findMany({ orderBy: [{ competenciaAno: 'desc' }, { competenciaMes: 'desc' }] });
  }

  async findOne(id: string) {
    const folha = await this.prisma.folhaPagamento.findUnique({ where: { id }, include: { itens: { include: ITEM_INCLUDE } } });
    if (!folha) throw new NotFoundException('Folha de pagamento não encontrada.');
    return folha;
  }

  async adicionarItem(folhaId: string, dto: CreateItemFolhaDto, usuarioId?: string) {
    const folha = await this.prisma.folhaPagamento.findUnique({ where: { id: folhaId } });
    if (!folha) throw new NotFoundException('Folha de pagamento não encontrada.');
    if (folha.status !== 'ABERTA') throw new BadRequestException('Só é possível lançar itens numa folha ABERTA.');
    if (!dto.professorId && !dto.colaboradorId) throw new BadRequestException('Informe professorId ou colaboradorId.');
    if (dto.professorId && dto.colaboradorId) throw new BadRequestException('Informe só professorId OU colaboradorId, não os dois.');

    let salarioBase: number;
    let numeroDependentes: number;
    let dadosFolhaProfessorId: string | undefined;
    let colaboradorId: string | undefined;

    if (dto.professorId) {
      const dados = await this.prisma.dadosFolhaProfessor.findUnique({ where: { professorId: dto.professorId } });
      if (!dados) throw new BadRequestException('Esse professor ainda não tem dados de folha cadastrados (salário/dependentes) — cadastre em Professores → Folha antes de lançar.');
      if (!dados.ativo) throw new BadRequestException('Esse professor está marcado como inativo na folha.');
      const jaLancado = await this.prisma.itemFolha.findFirst({ where: { folhaId, professorId: dados.id } });
      if (jaLancado) throw new ConflictException('Esse professor já foi lançado nessa folha.');
      salarioBase = Number(dados.salarioBase);
      numeroDependentes = dados.numeroDependentes;
      dadosFolhaProfessorId = dados.id;
    } else {
      const colaborador = await this.prisma.colaborador.findUnique({ where: { id: dto.colaboradorId } });
      if (!colaborador) throw new NotFoundException('Colaborador não encontrado.');
      if (colaborador.tipoVinculo !== 'COLABORADOR') throw new BadRequestException('Prestador de Serviço não usa a folha de pagamento — use Pagamentos de Prestador.');
      if (colaborador.salarioBase == null) throw new BadRequestException('Esse colaborador não tem salário base cadastrado.');
      if (!colaborador.ativo) throw new BadRequestException('Esse colaborador está inativo.');
      const jaLancado = await this.prisma.itemFolha.findFirst({ where: { folhaId, colaboradorId: colaborador.id } });
      if (jaLancado) throw new ConflictException('Esse colaborador já foi lançado nessa folha.');
      salarioBase = Number(colaborador.salarioBase);
      numeroDependentes = colaborador.numeroDependentes;
      colaboradorId = colaborador.id;
    }

    const { valor: inss } = calcularInss(salarioBase, (await this.tabelaInss.findVigente()).faixas.map(f => ({ ordem: f.ordem, limiteInicial: Number(f.limiteInicial), limiteFinal: f.limiteFinal != null ? Number(f.limiteFinal) : null, aliquota: Number(f.aliquota) })));
    const tabelaIrrf = await this.tabelaIrrf.findVigente();
    const baseIrrf = baseCalculoIrrf(salarioBase, inss, numeroDependentes, Number(tabelaIrrf.valorDeducaoPorDependente));
    const irrf = calcularIrrf(baseIrrf, tabelaIrrf.faixas.map(f => ({ ordem: f.ordem, limiteInicial: Number(f.limiteInicial), limiteFinal: f.limiteFinal != null ? Number(f.limiteFinal) : null, aliquota: Number(f.aliquota), parcelaDeduzir: Number(f.parcelaDeduzir) })));
    const fgts = calcularFgts(salarioBase);
    const salarioLiquido = Math.round((salarioBase - inss - irrf + Number.EPSILON) * 100) / 100;

    const item = await this.prisma.itemFolha.create({
      data: {
        folhaId,
        professorId: dadosFolhaProfessorId,
        colaboradorId,
        salarioBase,
        inss,
        irrf,
        fgts,
        salarioLiquido,
      },
      include: ITEM_INCLUDE,
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ItemFolha', entidadeId: item.id, dadosDepois: item });
    }
    return item;
  }

  // ⚠️ Lançamentos avulsos (proventos/descontos) NÃO recalculam INSS/IRRF —
  // só ajustam totalProventos/totalDescontosOutros e o líquido final. Se um
  // provento lançado aqui for tributável (a maioria é), o INSS/IRRF ficará
  // subestimado — decisão de escopo documentada no plano de implementação,
  // avaliar com o financeiro se vale a pena recalcular automaticamente numa
  // rodada futura.
  async adicionarLancamento(folhaId: string, itemId: string, dto: CreateLancamentoDto, usuarioId?: string) {
    const item = await this.buscarItem(folhaId, itemId);
    const folha = await this.prisma.folhaPagamento.findUnique({ where: { id: folhaId } });
    if (folha?.status !== 'ABERTA') throw new BadRequestException('Só é possível lançar itens numa folha ABERTA.');

    const lancamento = await this.prisma.itemFolhaLancamento.create({ data: { itemFolhaId: itemId, ...dto } });

    const totalProventos = dto.tipo === 'PROVENTO' ? Number(item.totalProventos) + dto.valor : Number(item.totalProventos);
    const totalDescontosOutros = dto.tipo === 'DESCONTO' ? Number(item.totalDescontosOutros) + dto.valor : Number(item.totalDescontosOutros);
    const salarioLiquido = Math.round((Number(item.salarioBase) + totalProventos - totalDescontosOutros - Number(item.inss) - Number(item.irrf) + Number.EPSILON) * 100) / 100;

    const atualizado = await this.prisma.itemFolha.update({
      where: { id: itemId },
      data: { totalProventos, totalDescontosOutros, salarioLiquido },
      include: ITEM_INCLUDE,
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ItemFolhaLancamento', entidadeId: lancamento.id, dadosDepois: { lancamento, itemAtualizado: atualizado } });
    }
    return atualizado;
  }

  private async buscarItem(folhaId: string, itemId: string) {
    const item = await this.prisma.itemFolha.findUnique({ where: { id: itemId } });
    if (!item || item.folhaId !== folhaId) throw new NotFoundException('Item da folha não encontrado.');
    return item;
  }

  async fechar(id: string, usuarioId?: string) {
    const folha = await this.findOne(id);
    if (folha.status !== 'ABERTA') throw new BadRequestException('Essa folha já não está ABERTA.');
    if (folha.itens.length === 0) throw new BadRequestException('Não é possível fechar uma folha sem nenhum item lançado.');

    const atualizada = await this.prisma.folhaPagamento.update({
      where: { id },
      data: { status: 'FECHADA', dataFechamento: new Date() },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'FolhaPagamento', entidadeId: id, dadosAntes: folha, dadosDepois: atualizada });
    }
    return atualizada;
  }

  async marcarItemPago(folhaId: string, itemId: string, usuarioId?: string) {
    const item = await this.buscarItem(folhaId, itemId);
    const atualizado = await this.prisma.itemFolha.update({ where: { id: itemId }, data: { status: 'PAGO' }, include: ITEM_INCLUDE });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'ItemFolha', entidadeId: itemId, dadosAntes: item, dadosDepois: atualizado });
    }
    return atualizado;
  }
}
