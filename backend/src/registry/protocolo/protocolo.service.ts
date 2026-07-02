import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { UpdateProtocoloStatusDto } from './dto/update-protocolo-status.dto';

@Injectable()
export class ProtocoloService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Gera o próximo número sequencial do ano: P20260001, P20260002, ... */
  private async gerarNumero(): Promise<string> {
    const prefixo = `P${new Date().getFullYear()}`;
    const ultimo = await this.prisma.protocolo.findFirst({
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

  async create(dto: CreateProtocoloDto, usuarioId?: string) {
    const tipo = await this.prisma.tipoProtocolo.findUnique({ where: { id: dto.tipoId } });
    if (!tipo) throw new BadRequestException('Tipo de protocolo não encontrado.');
    if (dto.alunoId) {
      const aluno = await this.prisma.aluno.findUnique({ where: { id: dto.alunoId } });
      if (!aluno) throw new BadRequestException('Aluno não encontrado.');
    }

    const numero = await this.gerarNumero();
    const protocolo = await this.prisma.protocolo.create({
      data: {
        numero,
        tipoId: dto.tipoId,
        alunoId: dto.alunoId,
        assunto: dto.assunto,
        descricao: dto.descricao,
        usuarioAberturaId: usuarioId,
      },
      include: { tipo: true, aluno: { select: { id: true, ra: true, nome: true } } },
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Protocolo', entidadeId: protocolo.id, dadosDepois: protocolo });
    }
    return protocolo;
  }

  findAll(filtros: { status?: string; tipoId?: string; alunoId?: string }) {
    return this.prisma.protocolo.findMany({
      where: {
        ...(filtros.status ? { status: filtros.status as any } : {}),
        ...(filtros.tipoId ? { tipoId: filtros.tipoId } : {}),
        ...(filtros.alunoId ? { alunoId: filtros.alunoId } : {}),
      },
      include: { tipo: true, aluno: { select: { id: true, ra: true, nome: true } } },
      orderBy: { dataAbertura: 'desc' },
    });
  }

  async findOne(id: string) {
    const protocolo = await this.prisma.protocolo.findUnique({
      where: { id },
      include: { tipo: true, aluno: { select: { id: true, ra: true, nome: true } } },
    });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado.');
    return protocolo;
  }

  async updateStatus(id: string, dto: UpdateProtocoloStatusDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const finalizando = dto.status === 'CONCLUIDO' || dto.status === 'CANCELADO';
    const protocolo = await this.prisma.protocolo.update({
      where: { id },
      data: {
        status: dto.status as any,
        descricao: dto.descricao ?? undefined,
        dataConclusao: finalizando ? new Date() : undefined,
      },
      include: { tipo: true, aluno: { select: { id: true, ra: true, nome: true } } },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Protocolo', entidadeId: id, dadosAntes: antes, dadosDepois: protocolo });
    }
    return protocolo;
  }
}
