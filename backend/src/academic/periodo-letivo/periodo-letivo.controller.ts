import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PeriodoLetivoService } from './periodo-letivo.service';
import { CreatePeriodoLetivoDto } from './dto/create-periodo-letivo.dto';
import { UpdatePeriodoLetivoDto } from './dto/update-periodo-letivo.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Períodos Letivos')
@ApiBearerAuth()
@Controller('periodos-letivos')
export class PeriodoLetivoController {
  constructor(private readonly service: PeriodoLetivoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('periodos')
  @Post()
  @ApiOperation({ summary: 'Criar período letivo' })
  create(@Body() dto: CreatePeriodoLetivoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  // Deliberadamente SEM @Tela() -- alimenta o widget "Calendário Acadêmico"
  // do Painel inicial pra qualquer perfil, além da tela dedicada de
  // Períodos Letivos.
  @Get()
  @ApiOperation({ summary: 'Listar períodos letivos' })
  findAll() {
    return this.service.findAll();
  }

  @Tela('periodos')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar período letivo por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('periodos')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar período letivo' })
  update(@Param('id') id: string, @Body() dto: UpdatePeriodoLetivoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('periodos')
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover período letivo' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
