import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';

@Injectable()
export class ColaboradorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateColaboradorDto, usuarioId?: string) {
    const existente = await this.prisma.colaborador.findUnique({ where: { cpf: dto.cpf } });
    if (existente) throw new ConflictException('CPF já cadastrado.');

    const colaborador = await this.prisma.colaborador.create({
      data: {
        ...dto,
        dataAdmissao: new Date(dto.dataAdmissao),
        dataDemissao: dto.dataDemissao ? new Date(dto.dataDemissao) : undefined,
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Colaborador', entidadeId: colaborador.id, dadosDepois: colaborador });
    }
    return colaborador;
  }

  findAll(tipoVinculo?: string, ativo?: boolean) {
    return this.prisma.colaborador.findMany({
      where: {
        ...(tipoVinculo ? { tipoVinculo: tipoVinculo as any } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const colaborador = await this.prisma.colaborador.findUnique({ where: { id } });
    if (!colaborador) throw new NotFoundException('Colaborador não encontrado.');
    return colaborador;
  }

  async update(id: string, dto: UpdateColaboradorDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const colaborador = await this.prisma.colaborador.update({
      where: { id },
      data: {
        ...dto,
        dataAdmissao: dto.dataAdmissao ? new Date(dto.dataAdmissao) : undefined,
        dataDemissao: dto.dataDemissao ? new Date(dto.dataDemissao) : undefined,
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Colaborador', entidadeId: id, dadosAntes: antes, dadosDepois: colaborador });
    }
    return colaborador;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.colaborador.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Colaborador', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Colaborador removido.' };
  }
}
