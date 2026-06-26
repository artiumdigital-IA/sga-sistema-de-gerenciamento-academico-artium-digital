import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';

@Injectable()
export class CandidatoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateCandidatoDto, userId?: string) {
    const exists = await (this.prisma as any).candidato.findUnique({ where: { cpf: dto.cpf } });
    if (exists) throw new ConflictException('CPF já cadastrado');
    const item = await (this.prisma as any).candidato.create({
      data: { ...dto, dataNascimento: new Date(dto.dataNascimento) },
    });
    await this.audit.log(userId, 'CREATE', 'Candidato', item.id, null, item);
    return item;
  }

  findAll(search?: string) {
    return (this.prisma as any).candidato.findMany({
      where: search ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).candidato.findUnique({
      where: { id },
      include: { inscricoes: { include: { processoSeletivo: { include: { curso: true } } } } },
    });
    if (!item) throw new NotFoundException('Candidato não encontrado');
    return item;
  }

  async update(id: string, dto: UpdateCandidatoDto, userId?: string) {
    const before = await this.findOne(id);
    const data: any = { ...dto };
    if (dto.dataNascimento) data.dataNascimento = new Date(dto.dataNascimento);
    const updated = await (this.prisma as any).candidato.update({ where: { id }, data });
    await this.audit.log(userId, 'UPDATE', 'Candidato', id, before, updated);
    return updated;
  }

  async remove(id: string, userId?: string) {
    const before = await this.findOne(id);
    await (this.prisma as any).candidato.delete({ where: { id } });
    await this.audit.log(userId, 'DELETE', 'Candidato', id, before, null);
    return { deleted: true };
  }
}
