import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AvaliacaoService } from './avaliacao.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';
import { ImportarAvaliacoesDto } from './dto/importar-avaliacoes.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Avaliações')
@ApiBearerAuth()
@Controller('avaliacoes')
@Tela('notas')
export class AvaliacaoController {
  constructor(private readonly service: AvaliacaoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Post()
  @ApiOperation({ summary: 'Lançar avaliação (nota)' })
  create(@Body() dto: CreateAvaliacaoDto, @Request() req: { user?: { id?: string } }) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar avaliações' })
  @ApiQuery({ name: 'matriculaDisciplinaId', required: false })
  findAll(@Query('matriculaDisciplinaId') mid?: string) {
    return this.service.findAll(mid);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Post('importar')
  @ApiOperation({ summary: 'Importar planilha de notas (RA, tipo, nota, peso) para uma oferta' })
  importar(@Body() dto: ImportarAvaliacoesDto, @Request() req: { user?: { id?: string } }) {
    return this.service.importarPlanilha(dto, req.user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAvaliacaoDto, @Request() req: { user?: { id?: string } }) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user?: { id?: string } }) {
    return this.service.remove(id, req.user?.id);
  }
}
