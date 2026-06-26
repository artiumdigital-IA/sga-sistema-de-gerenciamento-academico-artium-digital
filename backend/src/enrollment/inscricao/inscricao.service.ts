import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao.dto';
import * as bcrypt from 'bcrypt';

const TIPO_PARA_INGRESSO: Record<string, string> = {
  VESTIBULAR: 'VESTIBULAR',
  ENEM: 'ENEM',
  SEGUNDA_GRADUACAO: 'PORTADOR_DIPLOMA',
  TRANSFERENCIA_EXTERNA: 'TRANSFERENCIA_EXTERNA',
  TRANSFERENCIA_INTERNA: 'TRANSFERENCIA_INTERNA',
};

@Injectable()
export class InscricaoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateInscricaoDto, userId?: string) {
    const processo = await (this.prisma as any).processoSeletivo.findUnique({ where: { id: dto.processoSeletivoId } });
    if (!processo) throw new NotFoundException('Processo seletivo não encontrado');
    const item = await (this.prisma as any).inscricao.create({
      data: { ...dto, notaEnem: dto.notaEnem ?? null },
      include: { candidato: true, processoSeletivo: true },
    });
    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'Inscricao', entidadeId: item.id, dadosDepois: item });
    return item;
  }

  findAll(processoSeletivoId?: string, candidatoId?: string) {
    return (this.prisma as any).inscricao.findMany({
      where: {
        ...(processoSeletivoId ? { processoSeletivoId } : {}),
        ...(candidatoId ? { candidatoId } : {}),
      },
      include: { candidato: true, processoSeletivo: { include: { curso: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).inscricao.findUnique({
      where: { id },
      include: { candidato: true, processoSeletivo: { include: { curso: true, periodoLetivo: true } } },
    });
    if (!item) throw new NotFoundException('Inscrição não encontrada');
    return item;
  }

  async update(id: string, dto: UpdateInscricaoDto, userId?: string) {
    const before = await this.findOne(id);
    const updated = await (this.prisma as any).inscricao.update({
      where: { id },
      data: dto,
      include: { candidato: true, processoSeletivo: true },
    });
    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'Inscricao', entidadeId: id, dadosAntes: before, dadosDepois: updated });
    return updated;
  }

  async converterEmAluno(id: string, matrizCurricularId: string, userId?: string) {
    const inscricao = await this.findOne(id);
    if (inscricao.status !== 'APROVADO') {
      throw new BadRequestException('Somente inscrições APROVADAS podem ser convertidas em aluno');
    }
    if (inscricao.alunoId) {
      throw new BadRequestException('Esta inscrição já foi convertida em aluno');
    }

    const { candidato, processoSeletivo } = inscricao;
    const count = await (this.prisma as any).aluno.count();
    const ra = String(count + 1).padStart(6, '0');

    const senhaTemp = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaTemp, 12);

    const aluno = await (this.prisma as any).aluno.create({
      data: {
        cursoId: processoSeletivo.cursoId,
        matrizCurricularId,
        ra,
        nome: candidato.nome,
        cpf: candidato.cpf,
        email: candidato.email,
        telefone: candidato.telefone ?? null,
        dataNascimento: candidato.dataNascimento,
        sexo: candidato.sexo,
        corRaca: candidato.corRaca ?? 'NAO_DECLARADO',
        nacionalidade: candidato.nacionalidade,
        formaIngresso: TIPO_PARA_INGRESSO[processoSeletivo.tipo] ?? 'OUTRO',
        dataIngresso: new Date(),
        situacaoVinculo: 'CURSANDO',
      },
    });

    await (this.prisma as any).usuario.create({
      data: {
        email: candidato.email,
        senhaHash,
        perfil: 'ALUNO',
        status: 'ATIVO',
        alunoId: aluno.id,
      },
    });

    await (this.prisma as any).inscricao.update({
      where: { id },
      data: { status: 'MATRICULADO', alunoId: aluno.id },
    });
    await this.audit.log({ usuarioId: userId, acao: 'CONVERT_ALUNO', entidade: 'Inscricao', entidadeId: id, dadosDepois: { alunoId: aluno.id, ra } });

    return { aluno, senhaTemporaria: senhaTemp, mensagem: 'Aluno criado com sucesso. Senha temporária gerada.' };
  }
}
