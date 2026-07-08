import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';

@Injectable()
export class ProfessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProfessorDto, usuarioId?: string) {
    const existe = await this.prisma.professor.findFirst({ where: { cpf: dto.cpf } });
    if (existe) throw new ConflictException('CPF ja cadastrado.');

    const professor = await this.prisma.professor.create({
      data: {
        nome: dto.nome,
        cpf: dto.cpf,
        titulacao: dto.titulacao,
        regimeTrabalho: dto.regimeTrabalho,
        corRaca: dto.corRaca,
        lattes: dto.lattes,
        email: dto.email,
        ...(dto.usuarioId ? { usuario: { connect: { id: dto.usuarioId } } } : {}),
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'professor', entidadeId: professor.id, dadosDepois: professor });
    }
    return professor;
  }

  async findAll() {
    return this.prisma.professor.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const p = await this.prisma.professor.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Professor nao encontrado.');
    return p;
  }

  async update(id: string, dto: UpdateProfessorDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const professor = await this.prisma.professor.update({
      where: { id },
      data: {
        nome: dto.nome,
        email: dto.email,
        lattes: dto.lattes,
        titulacao: dto.titulacao,
        regimeTrabalho: dto.regimeTrabalho,
        corRaca: dto.corRaca,
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'professor', entidadeId: id, dadosAntes: antes, dadosDepois: professor });
    }
    return professor;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.professor.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'professor', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Professor removido.' };
  }
}
