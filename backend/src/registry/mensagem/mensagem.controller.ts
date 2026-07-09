import { Controller, Get, Post, Patch, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';
import { MensagemService } from './mensagem.service';
import { CreateMensagemDto } from './dto/create-mensagem.dto';
import { EnviarConversaDto } from './dto/enviar-conversa.dto';

@ApiTags('Mensagens')
@ApiBearerAuth()
@Controller('mensagens')
export class MensagemController {
  constructor(private readonly service: MensagemService) {}

  // ── Painel de comunicação (conversa 1-a-1, "Mensagens" na Barra Rápida) ──
  // Rotas literais ('conversas', 'contatos') declaradas antes de 'conversas/:usuarioId'
  // pra evitar o Nest casar errado (mesmo cuidado de sempre nesse projeto).
  //
  // Deliberadamente SEM @Tela() -- esse é o chat 1-a-1 (MessagesPanel),
  // acessível pra qualquer perfil autenticado a partir de qualquer tela do
  // sistema, não a tela dedicada "Mensagens" (broadcast) da Secretaria.

  @Get('contatos')
  @ApiOperation({ summary: 'Lista mínima de usuários pra iniciar uma nova conversa' })
  contatos() {
    return this.service.listarContatos();
  }

  @Get('conversas')
  @ApiOperation({ summary: 'Minhas conversas (última mensagem + não lidas por contato)' })
  conversas(@Request() req: { user?: { id?: string } }) {
    return this.service.listarConversas(req.user!.id!);
  }

  @Get('conversas/:usuarioId')
  @ApiOperation({ summary: 'Thread de mensagens com um usuário — marca como lidas ao abrir' })
  async conversaCom(@Param('usuarioId') usuarioId: string, @Request() req: { user?: { id?: string } }) {
    const thread = await this.service.mensagensCom(req.user!.id!, usuarioId);
    await this.service.marcarConversaLida(req.user!.id!, usuarioId);
    return thread;
  }

  @Post('conversas/:usuarioId')
  @ApiOperation({ summary: 'Enviar mensagem numa conversa' })
  enviarConversa(@Param('usuarioId') usuarioId: string, @Body() dto: EnviarConversaDto, @Request() req: { user?: { id?: string } }) {
    return this.service.enviarConversa(req.user!.id!, usuarioId, dto);
  }

  // ── Compor/manutenção "broadcast" (tela dedicada em Secretaria > Mensagens) ──
  // @Tela('mensagens') abaixo -- essas sim correspondem à tela dedicada.

  @Tela('mensagens')
  @Post()
  @ApiOperation({ summary: 'Compor mensagem direcionada a um usuário' })
  create(@Body() dto: CreateMensagemDto, @Request() req: { user?: { id?: string } }) {
    return this.service.create(dto, req.user!.id!);
  }

  @Tela('mensagens')
  @Get('enviadas')
  @ApiOperation({ summary: 'Manutenção de Mensagens Enviadas — minhas mensagens enviadas' })
  enviadas(@Request() req: { user?: { id?: string } }) {
    return this.service.findEnviadas(req.user!.id!);
  }

  @Tela('mensagens')
  @Get('recebidas')
  @ApiOperation({ summary: 'Minhas mensagens recebidas' })
  recebidas(@Request() req: { user?: { id?: string } }) {
    return this.service.findRecebidas(req.user!.id!);
  }

  @Tela('mensagens')
  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marcar mensagem recebida como lida' })
  marcarLida(@Param('id') id: string, @Request() req: { user?: { id?: string } }) {
    return this.service.marcarLida(id, req.user!.id!);
  }
}
