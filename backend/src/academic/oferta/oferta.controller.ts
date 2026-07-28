import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { OfertaService } from './oferta.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Ofertas')
@ApiBearerAuth()
@Controller('ofertas')
export class OfertaController {
  constructor(private readonly service: OfertaService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.COORDENADOR)
  @Tela('ofertas')
  @Post()
  @ApiOperation({ summary: 'Criar oferta de disciplina' })
  create(@Body() dto: CreateOfertaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  // Deliberadamente SEM @Tela() -- alimenta o widget "Grade Horária" do
  // Painel inicial pra qualquer perfil, além da tela dedicada de Ofertas.
  @Get()
  @ApiOperation({ summary: 'Listar ofertas (opcional: filtrar por periodoLetivoId)' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  findAll(@Query('periodoLetivoId') periodoLetivoId?: string) {
    return this.service.findAll(periodoLetivoId);
  }

  @Tela('listagem-alunos-turma')
  @Get('com-alunos')
  @ApiOperation({ summary: 'Listagem de Alunos por Turma — ofertas com alunos matriculados' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  listarComAlunos(@Query('periodoLetivoId') periodoLetivoId?: string) {
    return this.service.listarComAlunos(periodoLetivoId);
  }

  @Tela('listagem-alunos-turma')
  @Get('com-alunos/xlsx')
  @ApiOperation({ summary: 'Listagem de Alunos por Turma em XLSX' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  async listarComAlunosXlsx(@Query('periodoLetivoId') periodoLetivoId: string | undefined, @Res() res: Response) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="listagem-alunos-por-turma.xlsx"');
    await this.service.streamXlsxAlunosPorTurma(periodoLetivoId, res);
  }

  @Tela('ofertas')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar oferta por ID (inclui alunos matriculados)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.COORDENADOR)
  @Tela('ofertas')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar oferta' })
  update(@Param('id') id: string, @Body() dto: UpdateOfertaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.COORDENADOR)
  @Tela('ofertas')
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover oferta' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
