import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AlunoService } from './aluno.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { MudarSituacaoDto } from './dto/mudar-situacao.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('alunos')
@ApiBearerAuth()
@Controller('alunos')
export class AlunoController {
  constructor(private readonly service: AlunoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Cadastrar novo aluno' })
  create(@Body() dto: CreateAlunoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiQuery({ name: 'cursoId', required: false })
  @ApiOperation({ summary: 'Listar alunos (opcional: filtrar por cursoId)' })
  findAll(@Query('cursoId') cursoId?: string) {
    return this.service.findAll(cursoId);
  }

  @Get('ranking')
  @ApiQuery({ name: 'cursoId', required: false })
  @ApiOperation({ summary: 'Ranking de alunos por CR (opcional: filtrar por cursoId)' })
  ranking(@Query('cursoId') cursoId?: string) {
    return this.service.ranking(cursoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar aluno por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar aluno' })
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @ApiOperation({ summary: 'Remover aluno' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
  @Get(':id/historico')
  @ApiOperation({ summary: 'Histórico acadêmico + CR do aluno' })
  historico(@Param('id') id: string) {
    return this.service.historico(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post(':id/mudar-situacao')
  @ApiOperation({ summary: 'Registrar mudança de situação de vínculo (com motivo/data/histórico)' })
  mudarSituacao(@Param('id') id: string, @Body() dto: MudarSituacaoDto, @Request() req: any) {
    return this.service.mudarSituacao(id, dto, req.user?.id);
  }

  @Get(':id/historico-situacao')
  @ApiOperation({ summary: 'Histórico de mudanças de situação de vínculo do aluno' })
  historicoSituacao(@Param('id') id: string) {
    return this.service.historicoSituacao(id);
  }

}
