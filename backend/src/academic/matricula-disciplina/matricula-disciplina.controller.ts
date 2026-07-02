import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MatriculaDisciplinaService } from './matricula-disciplina.service';
import { CreateMatriculaDisciplinaDto } from './dto/create-matricula-disciplina.dto';
import { UpdateMatriculaDisciplinaDto } from './dto/update-matricula-disciplina.dto';
import { TransferirTurmaDto } from './dto/transferir-turma.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Matrículas por Disciplina')
@ApiBearerAuth()
@Controller('matriculas')
export class MatriculaDisciplinaController {
  constructor(private readonly service: MatriculaDisciplinaService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Matricular aluno em uma oferta' })
  create(@Body() dto: CreateMatriculaDisciplinaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar matrículas (filtrar por alunoId ou ofertaId)' })
  @ApiQuery({ name: 'alunoId', required: false })
  @ApiQuery({ name: 'ofertaId', required: false })
  findAll(
    @Query('alunoId') alunoId?: string,
    @Query('ofertaId') ofertaId?: string,
  ) {
    return this.service.findAll(alunoId, ofertaId);
  }

  @Get('mapao/:ofertaId')
  @ApiOperation({ summary: 'Mapão — notas e frequência de todos os alunos de uma oferta' })
  mapao(@Param('ofertaId') ofertaId: string) {
    return this.service.mapao(ofertaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar matrícula por ID (inclui avaliações e resultado)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar status da matrícula' })
  update(@Param('id') id: string, @Body() dto: UpdateMatriculaDisciplinaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post(':id/transferir')
  @ApiOperation({ summary: 'Transferir aluno de turma (mesma disciplina)' })
  transferir(@Param('id') id: string, @Body() dto: TransferirTurmaDto, @Request() req: any) {
    return this.service.transferirTurma(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancelar matrícula' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
