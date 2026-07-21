import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { UpsertDadosFolhaProfessorDto } from './dto/upsert-dados-folha-professor.dto';

@Injectable()
export class DadosFolhaProfessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findByProfessor(professorId: string) {
    const professor = await this.prisma.professor.findUnique({ where: { id: professorId }, select: { id: true, nome: true, cpf: true } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');

    const dados = await this.prisma.dadosFolhaProfessor.findUnique({ where: { professorId } });
    return { professor, dados };
  }

  async upsert(professorId: string, dto: UpsertDadosFolhaProfessorDto, usuarioId?: string) {
    const professor = await this.prisma.professor.findUnique({ where: { id: professorId } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');

    const antes = await this.prisma.dadosFolhaProfessor.findUnique({ where: { professorId } });

    const data = {
      salarioBase: dto.salarioBase,
      numeroDependentes: dto.numeroDependentes,
      dataAdmissao: new Date(dto.dataAdmissao),
      dataDemissao: dto.dataDemissao ? new Date(dto.dataDemissao) : undefined,
      ativo: dto.ativo,
    };

    const dados = await this.prisma.dadosFolhaProfessor.upsert({
      where: { professorId },
      create: { professorId, ...data },
      update: data,
    });

    if (usuarioId) {
      await this.audit.log({
        usuarioId,
        acao: antes ? 'UPDATE' : 'CREATE',
        entidade: 'DadosFolhaProfessor',
        entidadeId: dados.id,
        dadosAntes: antes ?? undefined,
        dadosDepois: dados,
      });
    }
    return dados;
  }
}
