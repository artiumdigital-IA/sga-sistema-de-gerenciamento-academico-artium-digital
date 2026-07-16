import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TipoChamadoManutencaoService } from './tipo-chamado-manutencao.service';
import { CreateTipoChamadoManutencaoDto } from './dto/create-tipo-chamado-manutencao.dto';
import { UpdateTipoChamadoManutencaoDto } from './dto/update-tipo-chamado-manutencao.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Sem @Roles() no nível do controller: qualquer autenticado precisa listar
// os tipos pra escolher um ao abrir um chamado (mesmo padrão de
// livro.controller.ts). Só as rotas de escrita ficam restritas a quem
// administra o catálogo.
@ApiTags('Suporte — Tipos de Chamado de Manutenção')
@ApiBearerAuth()
@Controller('tipos-chamado-manutencao')
@Tela('tipos-chamado-manutencao')
export class TipoChamadoManutencaoController {
  constructor(private readonly service: TipoChamadoManutencaoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Criar tipo de chamado de manutenção' })
  create(@Body() dto: CreateTipoChamadoManutencaoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de chamado de manutenção' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTipoChamadoManutencaoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
