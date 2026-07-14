import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';

@Injectable()
export class EquipamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEquipamentoDto, usuarioId?: string) {
    const existente = await this.prisma.equipamento.findUnique({ where: { patrimonio: dto.patrimonio } });
    if (existente) throw new ConflictException('Já existe um equipamento com esse patrimônio.');

    const equipamento = await this.prisma.equipamento.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Equipamento', entidadeId: equipamento.id, dadosDepois: equipamento });
    }
    return equipamento;
  }

  findAll(busca?: string) {
    return this.prisma.equipamento.findMany({
      where: busca
        ? {
            OR: [
              { patrimonio: { contains: busca, mode: 'insensitive' } },
              { modelo: { contains: busca, mode: 'insensitive' } },
              { numeroSerie: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { patrimonio: 'asc' },
    });
  }

  async findOne(id: string) {
    const equipamento = await this.prisma.equipamento.findUnique({ where: { id } });
    if (!equipamento) throw new NotFoundException('Equipamento não encontrado.');
    return equipamento;
  }

  async update(id: string, dto: UpdateEquipamentoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const equipamento = await this.prisma.equipamento.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Equipamento', entidadeId: id, dadosAntes: antes, dadosDepois: equipamento });
    }
    return equipamento;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    if (antes.status === 'EMPRESTADO') throw new BadRequestException('Não é possível remover: equipamento emprestado no momento.');
    await this.prisma.equipamento.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Equipamento', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Equipamento removido.' };
  }
}
