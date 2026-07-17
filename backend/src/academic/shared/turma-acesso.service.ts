import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UsuarioLogado {
  id: string;
  perfil: string;
}

/**
 * Fecha o gap de segurança encontrado na auditoria de Jul/2026: as rotas de
 * leitura de nota/frequência/pauta não checavam se a oferta pertencia ao
 * professor logado — qualquer autenticado (inclusive ALUNO) via um
 * `ofertaId`/`matriculaDisciplinaId` válido acessava nota/frequência de
 * qualquer turma. ADMIN/SECRETARIA/MASTER sempre passam (já enxergam tudo em
 * todo o resto do sistema); a checagem só se aplica de verdade quando o
 * perfil logado é PROFESSOR — mesmo princípio já usado em
 * `DocenteService.validarOfertaDoProfessor`, só que reaproveitável pelos
 * módulos acadêmicos que o professor acessa via `/dashboard/academico/*`
 * (não `/docente/*`).
 */
@Injectable()
export class TurmaAcessoService {
  constructor(private readonly prisma: PrismaService) {}

  async validarOferta(ofertaId: string | undefined, usuario: UsuarioLogado): Promise<void> {
    if (usuario.perfil !== 'PROFESSOR') return;
    if (!ofertaId) {
      throw new ForbiddenException('Informe a turma (ofertaId) — professor não pode consultar todas as turmas de uma vez.');
    }
    const oferta = await this.prisma.oferta.findUnique({ where: { id: ofertaId }, select: { professorId: true } });
    if (!oferta) throw new NotFoundException('Oferta não encontrada.');

    const meuUsuario = await this.prisma.usuario.findUnique({ where: { id: usuario.id }, select: { professorId: true } });
    if (!meuUsuario?.professorId || meuUsuario.professorId !== oferta.professorId) {
      throw new ForbiddenException('Esta turma não pertence a você.');
    }
  }

  async validarPorMatricula(matriculaDisciplinaId: string | undefined, usuario: UsuarioLogado): Promise<void> {
    if (usuario.perfil !== 'PROFESSOR') return;
    if (!matriculaDisciplinaId) {
      throw new ForbiddenException('Informe a matrícula (matriculaDisciplinaId).');
    }
    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { id: matriculaDisciplinaId },
      select: { ofertaId: true },
    });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');
    await this.validarOferta(matricula.ofertaId, usuario);
  }

  async validarPorAvaliacao(avaliacaoId: string, usuario: UsuarioLogado): Promise<void> {
    if (usuario.perfil !== 'PROFESSOR') return;
    const avaliacao = await this.prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      select: { matriculaDisciplinaId: true },
    });
    if (!avaliacao) throw new NotFoundException('Avaliação não encontrada.');
    await this.validarPorMatricula(avaliacao.matriculaDisciplinaId, usuario);
  }
}
