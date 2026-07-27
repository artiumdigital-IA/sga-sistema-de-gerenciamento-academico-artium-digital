import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TipoRequerimentoService } from './tipo-requerimento.service';
import { CreateTipoRequerimentoDto } from './dto/create-tipo-requerimento.dto';
import { UpdateTipoRequerimentoDto } from './dto/update-tipo-requerimento.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

/**
 * Tabela de preços dos requerimentos ("Ferramentas Master" — ver
 * RightPanel.tsx). Gestão restrita a ADMIN/MASTER; a leitura pro aluno
 * (tabela de preços exibida na tela de autoatendimento) é servida por uma
 * rota própria em discente.controller.ts, não por aqui.
 */
@ApiTags('Tipos de Requerimento (tabela de preços)')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.MASTER)
@Controller('tipos-requerimento')
@Tela('tipos-requerimento')
export class TipoRequerimentoController {
  constructor(private readonly service: TipoRequerimentoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar tipo de requerimento (tabela de preços)' })
  create(@Body() dto: CreateTipoRequerimentoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de requerimento (tabela de preços completa)' })
  findAll(@Query('somenteAtivos') somenteAtivos?: string) {
    return this.service.findAll(somenteAtivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTipoRequerimentoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
