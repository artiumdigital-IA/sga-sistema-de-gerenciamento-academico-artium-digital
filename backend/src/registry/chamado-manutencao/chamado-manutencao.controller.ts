import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChamadoManutencaoService } from './chamado-manutencao.service';
import { CreateChamadoManutencaoDto } from './dto/create-chamado-manutencao.dto';
import { UpdateChamadoManutencaoStatusDto } from './dto/update-chamado-manutencao-status.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

/**
 * Controller misto (mesmo padrão de mensagem.controller.ts): abrir chamado
 * e "meus chamados" são autoatendimento — sem @Roles() (qualquer perfil
 * autenticado) e deliberadamente SEM @Tela() (widget de autoatendimento
 * sempre disponível, não controlado pela matriz de permissões — mesmo
 * raciocínio já usado pra Mensagens/Ramais). Gerenciar (listar tudo, ver
 * detalhe, mudar status) é restrito a quem resolve os chamados.
 */
@ApiTags('Suporte — Chamados de Manutenção')
@ApiBearerAuth()
@Controller('chamados-manutencao')
export class ChamadoManutencaoController {
  constructor(private readonly service: ChamadoManutencaoService) {}

  @Post()
  @ApiOperation({ summary: 'Abrir chamado de manutenção (gera número sequencial automaticamente)' })
  create(@Body() dto: CreateChamadoManutencaoDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get('meus')
  @ApiOperation({ summary: 'Meus chamados abertos' })
  meus(@Request() req: any) {
    return this.service.meus(req.user.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Tela('chamados-manutencao')
  @Get()
  @ApiOperation({ summary: 'Consultar todos os chamados (filtros opcionais)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tipoId', required: false })
  @ApiQuery({ name: 'prioridade', required: false })
  @ApiQuery({ name: 'responsavelId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('tipoId') tipoId?: string,
    @Query('prioridade') prioridade?: string,
    @Query('responsavelId') responsavelId?: string,
  ) {
    return this.service.findAll({ status, tipoId, prioridade, responsavelId });
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Tela('chamados-manutencao')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Tela('chamados-manutencao')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do chamado (assume automaticamente ao mover pra Em Andamento sem responsável)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateChamadoManutencaoStatusDto, @Request() req: any) {
    return this.service.updateStatus(id, dto, req.user.id);
  }
}
