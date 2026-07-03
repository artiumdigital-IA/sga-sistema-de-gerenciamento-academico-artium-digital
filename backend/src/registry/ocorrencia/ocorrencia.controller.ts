import { Controller, Get, Post, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OcorrenciaService } from './ocorrencia.service';
import { CreateOcorrenciaDto } from './dto/create-ocorrencia.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Ocorrências')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('ocorrencias')
export class OcorrenciaController {
  constructor(private readonly service: OcorrenciaService) {}

  @Post()
  @ApiOperation({ summary: 'Lançar ocorrência de aluno' })
  create(@Body() dto: CreateOcorrenciaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get('resumo-turmas')
  @ApiOperation({ summary: 'Resumo de Ocorrências por Turmas (aproximado por Curso) + ranking de alunos' })
  resumoPorTurma() {
    return this.service.resumoPorTurma();
  }

  @Get()
  @ApiOperation({ summary: 'Listar ocorrências (opcional: filtrar por alunoId)' })
  @ApiQuery({ name: 'alunoId', required: false })
  findAll(@Query('alunoId') alunoId?: string) {
    return alunoId ? this.service.findByAluno(alunoId) : this.service.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
