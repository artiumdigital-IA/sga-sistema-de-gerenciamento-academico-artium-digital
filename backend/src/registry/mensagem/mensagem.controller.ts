import { Controller, Get, Post, Patch, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MensagemService } from './mensagem.service';
import { CreateMensagemDto } from './dto/create-mensagem.dto';

@ApiTags('Mensagens')
@ApiBearerAuth()
@Controller('mensagens')
export class MensagemController {
  constructor(private readonly service: MensagemService) {}

  @Post()
  @ApiOperation({ summary: 'Compor mensagem direcionada a um usuário' })
  create(@Body() dto: CreateMensagemDto, @Request() req: { user?: { id?: string } }) {
    return this.service.create(dto, req.user!.id!);
  }

  @Get('enviadas')
  @ApiOperation({ summary: 'Manutenção de Mensagens Enviadas — minhas mensagens enviadas' })
  enviadas(@Request() req: { user?: { id?: string } }) {
    return this.service.findEnviadas(req.user!.id!);
  }

  @Get('recebidas')
  @ApiOperation({ summary: 'Minhas mensagens recebidas' })
  recebidas(@Request() req: { user?: { id?: string } }) {
    return this.service.findRecebidas(req.user!.id!);
  }

  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marcar mensagem recebida como lida' })
  marcarLida(@Param('id') id: string, @Request() req: { user?: { id?: string } }) {
    return this.service.marcarLida(id, req.user!.id!);
  }
}
