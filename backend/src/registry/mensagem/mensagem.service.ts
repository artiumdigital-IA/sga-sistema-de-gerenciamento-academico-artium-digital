import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMensagemDto } from './dto/create-mensagem.dto';
import { EnviarConversaDto } from './dto/enviar-conversa.dto';

const CONTATO_SELECT = { id: true, nome: true, email: true, perfil: true, fotoUrl: true } as const;

@Injectable()
export class MensagemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMensagemDto, remetenteId: string) {
    const destinatario = await this.prisma.usuario.findUnique({ where: { id: dto.destinatarioId } });
    if (!destinatario) throw new BadRequestException('Destinatário não encontrado.');

    const mensagem = await this.prisma.mensagem.create({
      data: { remetenteId, destinatarioId: dto.destinatarioId, assunto: dto.assunto ?? '', corpo: dto.corpo },
      include: {
        remetente: { select: { id: true, email: true, nome: true } },
        destinatario: { select: { id: true, email: true, nome: true } },
      },
    });

    await this.audit.log({ usuarioId: remetenteId, acao: 'CREATE', entidade: 'Mensagem', entidadeId: mensagem.id, dadosDepois: mensagem });
    return mensagem;
  }

  /**
   * Lista mínima de usuários pra iniciar uma conversa (busca de "novo contato").
   * Sem @Roles() no controller — qualquer autenticado precisa poder escolher
   * com quem falar (aluno com secretaria, professor com coordenação, etc.),
   * diferente de GET /usuarios que é administrativo (ADMIN/SECRETARIA).
   */
  listarContatos() {
    return this.prisma.usuario.findMany({
      where: { status: 'ATIVO' },
      select: CONTATO_SELECT,
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Lista de conversas do usuário logado: uma linha por "outra pessoa" com
   * quem já trocou mensagem, com a última mensagem e a contagem de não lidas.
   * Não existe tabela de Conversa — é derivado agrupando Mensagem pelo par
   * de usuários (mesma ideia de DM simples, sem thread própria).
   */
  async listarConversas(usuarioId: string) {
    const mensagens = await this.prisma.mensagem.findMany({
      where: { OR: [{ remetenteId: usuarioId }, { destinatarioId: usuarioId }] },
      include: {
        remetente: { select: CONTATO_SELECT },
        destinatario: { select: CONTATO_SELECT },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const porContato = new Map<string, { usuario: typeof mensagens[number]['remetente']; ultimaMensagem: typeof mensagens[number]; naoLidas: number }>();
    for (const m of mensagens) {
      const outro = m.remetenteId === usuarioId ? m.destinatario : m.remetente;
      if (!porContato.has(outro.id)) {
        porContato.set(outro.id, { usuario: outro, ultimaMensagem: m, naoLidas: 0 });
      }
      if (m.destinatarioId === usuarioId && !m.lida) {
        porContato.get(outro.id)!.naoLidas++;
      }
    }
    return Array.from(porContato.values());
  }

  /** Thread de mensagens entre o usuário logado e outro usuário (ordem cronológica). */
  async mensagensCom(usuarioId: string, outroId: string) {
    const outro = await this.prisma.usuario.findUnique({ where: { id: outroId }, select: CONTATO_SELECT });
    if (!outro) throw new NotFoundException('Usuário não encontrado.');

    const mensagens = await this.prisma.mensagem.findMany({
      where: {
        OR: [
          { remetenteId: usuarioId, destinatarioId: outroId },
          { remetenteId: outroId, destinatarioId: usuarioId },
        ],
      },
      orderBy: { criadoEm: 'asc' },
    });
    return { usuario: outro, mensagens };
  }

  /** Marca como lidas todas as mensagens que `outroId` enviou pra `usuarioId`. */
  marcarConversaLida(usuarioId: string, outroId: string) {
    return this.prisma.mensagem.updateMany({
      where: { remetenteId: outroId, destinatarioId: usuarioId, lida: false },
      data: { lida: true },
    });
  }

  async enviarConversa(remetenteId: string, destinatarioId: string, dto: EnviarConversaDto) {
    const destinatario = await this.prisma.usuario.findUnique({ where: { id: destinatarioId } });
    if (!destinatario) throw new BadRequestException('Destinatário não encontrado.');
    if (destinatarioId === remetenteId) throw new BadRequestException('Não é possível enviar mensagem para si mesmo.');

    const mensagem = await this.prisma.mensagem.create({
      data: { remetenteId, destinatarioId, assunto: '', corpo: dto.corpo },
    });
    await this.audit.log({ usuarioId: remetenteId, acao: 'CREATE', entidade: 'Mensagem', entidadeId: mensagem.id, dadosDepois: mensagem });
    return mensagem;
  }

  findEnviadas(remetenteId: string) {
    return this.prisma.mensagem.findMany({
      where: { remetenteId },
      include: { destinatario: { select: { id: true, email: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findRecebidas(destinatarioId: string) {
    return this.prisma.mensagem.findMany({
      where: { destinatarioId },
      include: { remetente: { select: { id: true, email: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async marcarLida(id: string, usuarioId: string) {
    const mensagem = await this.prisma.mensagem.findUnique({ where: { id } });
    if (!mensagem) throw new NotFoundException('Mensagem não encontrada.');
    if (mensagem.destinatarioId !== usuarioId) throw new BadRequestException('Apenas o destinatário pode marcar como lida.');
    return this.prisma.mensagem.update({ where: { id }, data: { lida: true } });
  }
}
