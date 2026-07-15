import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AvisoService } from '../registry/aviso/aviso.service';
import { PushService } from '../push/push.service';
import { CriarAvisoTurmaDto } from './dto/criar-aviso-turma.dto';

interface ArquivoUpload {
  originalname: string;
  filename: string;
  size: number;
}

/**
 * Autoatendimento do professor ("Menu Docente" — ver
 * components/dashboard/RightPanel.tsx no frontend). Mesmo princípio do
 * DiscenteService: toda rota resolve o Professor do próprio usuário
 * autenticado (nunca recebe professorId por parâmetro), e qualquer oferta/
 * aluno passado por parâmetro é validado como pertencente às turmas desse
 * professor antes de qualquer leitura/escrita — um professor nunca consegue
 * ver ou escrever dado de uma turma que não é dele só trocando um ID na URL.
 */
@Injectable()
export class DocenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly avisoService: AvisoService,
    private readonly pushService: PushService,
  ) {}

  async meuProfessorId(usuarioId: string): Promise<string> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { professorId: true },
    });
    if (!usuario?.professorId) {
      throw new ForbiddenException('Esta conta não está vinculada a um registro de professor.');
    }
    return usuario.professorId;
  }

  /** Valida que a oferta pertence ao professor logado; lança 403 senão (nunca 404 — não revela se a oferta existe). */
  private async validarOfertaDoProfessor(professorId: string, ofertaId: string) {
    const oferta = await this.prisma.oferta.findUnique({ where: { id: ofertaId } });
    if (!oferta || oferta.professorId !== professorId) {
      throw new ForbiddenException('Esta turma não pertence a você.');
    }
    return oferta;
  }

  /** Minhas ofertas — alimenta os seletores de turma das outras telas do Menu Docente. */
  async minhasOfertas(usuarioId: string) {
    const professorId = await this.meuProfessorId(usuarioId);
    return this.prisma.oferta.findMany({
      where: { professorId },
      include: {
        disciplina: { select: { nome: true, codigo: true } },
        periodoLetivo: { select: { ano: true, semestre: true, status: true } },
        _count: { select: { matriculas: true } },
      },
      orderBy: [{ periodoLetivo: { ano: 'desc' } }, { periodoLetivo: { semestre: 'desc' } }],
    });
  }

  /** Alunos matriculados nas minhas turmas (dedupe por aluno), opcionalmente filtrado por uma oferta. */
  async meusAlunos(usuarioId: string, ofertaId?: string) {
    const professorId = await this.meuProfessorId(usuarioId);
    if (ofertaId) await this.validarOfertaDoProfessor(professorId, ofertaId);

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: {
        oferta: { professorId, ...(ofertaId ? { id: ofertaId } : {}) },
      },
      include: {
        aluno: { select: { id: true, ra: true, nome: true, email: true, situacaoVinculo: true } },
        oferta: { include: { disciplina: { select: { nome: true, codigo: true } } } },
      },
      orderBy: { aluno: { nome: 'asc' } },
    });

    const mapa = new Map<string, { aluno: any; turmas: string[] }>();
    for (const m of matriculas) {
      const atual = mapa.get(m.aluno.id) ?? { aluno: m.aluno, turmas: [] };
      atual.turmas.push(`${m.oferta.disciplina.codigo} - ${m.oferta.disciplina.nome}`);
      mapa.set(m.aluno.id, atual);
    }
    return Array.from(mapa.values());
  }

  async listarCapturas(usuarioId: string, filtro: { ofertaId?: string; alunoId?: string }) {
    const professorId = await this.meuProfessorId(usuarioId);
    return (this.prisma as any).capturaProva.findMany({
      where: {
        professorId,
        ...(filtro.ofertaId ? { ofertaId: filtro.ofertaId } : {}),
        ...(filtro.alunoId ? { alunoId: filtro.alunoId } : {}),
      },
      include: {
        aluno: { select: { nome: true, ra: true } },
        oferta: { include: { disciplina: { select: { nome: true, codigo: true } } } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criarCaptura(usuarioId: string, alunoId: string, ofertaId: string, observacoes: string | undefined, arquivo: ArquivoUpload) {
    const professorId = await this.meuProfessorId(usuarioId);
    await this.validarOfertaDoProfessor(professorId, ofertaId);

    const matricula = await this.prisma.matriculaDisciplina.findUnique({
      where: { alunoId_ofertaId: { alunoId, ofertaId } },
    });
    if (!matricula) throw new ForbiddenException('Este aluno não está matriculado nesta turma.');

    const captura = await (this.prisma as any).capturaProva.create({
      data: {
        alunoId,
        ofertaId,
        professorId,
        nomeArquivo: arquivo.originalname,
        url: `/uploads/capturas-prova/${arquivo.filename}`,
        tamanho: arquivo.size,
        observacoes,
      },
    });
    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'CapturaProva', entidadeId: captura.id, dadosDepois: captura });
    return captura;
  }

  async removerCaptura(usuarioId: string, id: string) {
    const professorId = await this.meuProfessorId(usuarioId);
    const captura = await (this.prisma as any).capturaProva.findUnique({ where: { id } });
    if (!captura || captura.professorId !== professorId) throw new NotFoundException('Captura não encontrada.');

    await (this.prisma as any).capturaProva.delete({ where: { id } });
    try {
      const nomeArquivo = captura.url.split('/').pop();
      if (nomeArquivo) await unlink(join(process.cwd(), 'uploads', 'capturas-prova', nomeArquivo));
    } catch { /* arquivo já ausente do disco — segue o fluxo */ }

    await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'CapturaProva', entidadeId: id, dadosAntes: captura });
    return { message: 'Captura removida.' };
  }

  /** Cria o aviso escopado à turma e dispara push pros alunos matriculados nela. */
  async criarAvisoTurma(usuarioId: string, dto: CriarAvisoTurmaDto) {
    const professorId = await this.meuProfessorId(usuarioId);
    const oferta = await this.validarOfertaDoProfessor(professorId, dto.ofertaId);

    const professor = await this.prisma.professor.findUnique({ where: { id: professorId }, select: { nome: true } });

    const aviso = await this.avisoService.create(
      { titulo: dto.titulo, texto: dto.texto, tag: dto.tag, autorNome: professor?.nome ?? 'Professor', autorId: usuarioId, ofertaId: dto.ofertaId },
      usuarioId,
    );

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { ofertaId: dto.ofertaId },
      include: { aluno: { include: { usuario: { select: { id: true } } } } },
    });
    const usuarioIds = matriculas.map(m => m.aluno.usuario?.id).filter((id): id is string => !!id);

    const push = await this.pushService.enviarParaUsuarios(
      usuarioIds,
      dto.titulo,
      dto.texto,
      { tipo: 'aviso-turma', avisoId: aviso.id, ofertaId: dto.ofertaId },
    );

    return { aviso, oferta: { id: oferta.id }, push };
  }

  /** Avisos de turma já enviados por mim (pras minhas próprias ofertas). */
  async listarAvisosTurma(usuarioId: string) {
    const professorId = await this.meuProfessorId(usuarioId);
    const minhasOfertas = await this.prisma.oferta.findMany({ where: { professorId }, select: { id: true } });
    const ofertaIds = minhasOfertas.map(o => o.id);
    if (ofertaIds.length === 0) return [];

    return (this.prisma as any).aviso.findMany({
      where: { ofertaId: { in: ofertaIds } },
      include: { oferta: { include: { disciplina: { select: { nome: true, codigo: true } } } } },
      orderBy: { criadoEm: 'desc' },
    });
  }
}
