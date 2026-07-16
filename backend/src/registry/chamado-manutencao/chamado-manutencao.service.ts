import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateChamadoManutencaoDto } from './dto/create-chamado-manutencao.dto';
import { UpdateChamadoManutencaoStatusDto } from './dto/update-chamado-manutencao-status.dto';

const INCLUDE = {
  tipo: true,
  solicitante: { select: { id: true, nome: true, email: true, perfil: true } },
  responsavel: { select: { id: true, nome: true, email: true } },
} as const;

@Injectable()
export class ChamadoManutencaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Gera o próximo número sequencial do ano: CM20260001, CM20260002... */
  private async gerarNumero(): Promise<string> {
    const prefixo = `CM${new Date().getFullYear()}`;
    const ultimo = await this.prisma.chamadoManutencao.findFirst({
      where: { numero: { startsWith: prefixo } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    let proximoSeq = 1;
    if (ultimo) {
      const seqAtual = parseInt(ultimo.numero.slice(prefixo.length), 10);
      if (!isNaN(seqAtual)) proximoSeq = seqAtual + 1;
    }
    return `${prefixo}${String(proximoSeq).padStart(4, '0')}`;
  }

  /** `usuarioId` é sempre o solicitante — nunca recebido no DTO (evita IDOR:
   * ninguém abre chamado em nome de outra pessoa). */
  async create(dto: CreateChamadoManutencaoDto, usuarioId: string) {
    const tipo = await this.prisma.tipoChamadoManutencao.findUnique({ where: { id: dto.tipoId } });
    if (!tipo) throw new BadRequestException('Tipo de chamado não encontrado.');

    const numero = await this.gerarNumero();
    const chamado = await this.prisma.chamadoManutencao.create({
      data: {
        numero,
        tipoId: dto.tipoId,
        local: dto.local,
        prioridade: dto.prioridade as any,
        titulo: dto.titulo,
        descricao: dto.descricao,
        solicitanteId: usuarioId,
      },
      include: INCLUDE,
    });

    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ChamadoManutencao', entidadeId: chamado.id, dadosDepois: chamado });
    return chamado;
  }

  /** Autoatendimento — só os chamados abertos pelo próprio usuário. */
  meus(usuarioId: string) {
    return this.prisma.chamadoManutencao.findMany({
      where: { solicitanteId: usuarioId },
      include: INCLUDE,
      orderBy: { dataAbertura: 'desc' },
    });
  }

  findAll(filtros: { status?: string; tipoId?: string; prioridade?: string; responsavelId?: string }) {
    return this.prisma.chamadoManutencao.findMany({
      where: {
        ...(filtros.status ? { status: filtros.status as any } : {}),
        ...(filtros.tipoId ? { tipoId: filtros.tipoId } : {}),
        ...(filtros.prioridade ? { prioridade: filtros.prioridade as any } : {}),
        ...(filtros.responsavelId ? { responsavelId: filtros.responsavelId } : {}),
      },
      include: INCLUDE,
      orderBy: { dataAbertura: 'desc' },
    });
  }

  async findOne(id: string) {
    const chamado = await this.prisma.chamadoManutencao.findUnique({ where: { id }, include: INCLUDE });
    if (!chamado) throw new NotFoundException('Chamado não encontrado.');
    return chamado;
  }

  /** Ao mudar pra EM_ANDAMENTO sem responsável ainda, quem mudou "assume" o
   * chamado automaticamente. */
  async updateStatus(id: string, dto: UpdateChamadoManutencaoStatusDto, usuarioId: string) {
    const antes = await this.findOne(id);
    const finalizando = dto.status === 'CONCLUIDO' || dto.status === 'CANCELADO';
    const assumindo = dto.status === 'EM_ANDAMENTO' && !antes.responsavelId;

    const chamado = await this.prisma.chamadoManutencao.update({
      where: { id },
      data: {
        status: dto.status as any,
        descricao: dto.descricao ?? undefined,
        dataConclusao: finalizando ? new Date() : undefined,
        responsavelId: assumindo ? usuarioId : undefined,
      },
      include: INCLUDE,
    });

    await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'ChamadoManutencao', entidadeId: id, dadosAntes: antes, dadosDepois: chamado });
    return chamado;
  }
}
