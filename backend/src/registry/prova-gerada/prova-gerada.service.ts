import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CriarProvaGeradaDto } from './dto/criar-prova-gerada.dto';

interface UsuarioLogado {
  id: string;
  perfil: string;
}

const INCLUDE = {
  professor: { select: { id: true, nome: true } },
} as const;

/**
 * Gerador de Prova (Menu Docente) — professor monta cabeçalho + questões e
 * gera um documento imprimível; Secretaria só lê/imprime (ver
 * prova-gerada.controller.ts pros dois conjuntos de rotas). Mesmo princípio
 * de ownership do DocenteService: o professor nunca é recebido por
 * parâmetro, é sempre resolvido a partir do usuário autenticado.
 */
@Injectable()
export class ProvaGeradaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async meuProfessorId(usuarioId: string): Promise<string> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { professorId: true },
    });
    if (!usuario?.professorId) {
      throw new ForbiddenException('Esta conta não está vinculada a um registro de professor.');
    }
    return usuario.professorId;
  }

  async criar(usuarioId: string, dto: CriarProvaGeradaDto) {
    const professorId = await this.meuProfessorId(usuarioId);
    const prova = await (this.prisma as any).provaGerada.create({
      data: {
        professorId,
        tipoProva: dto.tipoProva,
        curso: dto.curso,
        disciplina: dto.disciplina,
        turma: dto.turma,
        data: new Date(dto.data),
        observacoes: dto.observacoes,
        questoes: dto.questoes,
      },
      include: INCLUDE,
    });
    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ProvaGerada', entidadeId: prova.id, dadosDepois: prova });
    return prova;
  }

  /** Autoatendimento — só as provas geradas pelo próprio professor. */
  async minhas(usuarioId: string) {
    const professorId = await this.meuProfessorId(usuarioId);
    return (this.prisma as any).provaGerada.findMany({
      where: { professorId },
      include: INCLUDE,
      orderBy: { criadoEm: 'desc' },
    });
  }

  /** Secretaria/Admin — todas as provas geradas, de qualquer professor. */
  listarTodas() {
    return (this.prisma as any).provaGerada.findMany({
      include: INCLUDE,
      orderBy: { criadoEm: 'desc' },
    });
  }

  /**
   * Usada tanto pelo professor (reimprimir a prova que ele mesmo gerou)
   * quanto pela Secretaria/Admin (imprimir qualquer prova) — a rota é a
   * mesma, o controller não filtra por @Roles(); a checagem de ownership
   * acontece aqui: PROFESSOR só pode ver a própria, os demais perfis
   * autorizados no controller passam livre.
   */
  async buscarUma(id: string, usuario: UsuarioLogado) {
    const prova = await (this.prisma as any).provaGerada.findUnique({ where: { id }, include: INCLUDE });
    if (!prova) throw new NotFoundException('Prova não encontrada.');
    if (usuario.perfil === 'PROFESSOR') {
      const professorId = await this.meuProfessorId(usuario.id);
      if (prova.professorId !== professorId) throw new ForbiddenException('Esta prova não pertence a você.');
    }
    return prova;
  }
}
