import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMensagemDto } from './dto/create-mensagem.dto';

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
      data: { remetenteId, destinatarioId: dto.destinatarioId, assunto: dto.assunto, corpo: dto.corpo },
      include: {
        remetente: { select: { id: true, email: true, nome: true } },
        destinatario: { select: { id: true, email: true, nome: true } },
      },
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
