import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MatriculaDisciplinaService } from './matricula-disciplina.service';
import { CreateMatriculaDisciplinaDto } from './dto/create-matricula-disciplina.dto';
import { UpdateMatriculaDisciplinaDto } from './dto/update-matricula-disciplina.dto';

@ApiTags('Matrículas por Disciplina')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matriculas')
export class MatriculaDisciplinaController {
  constructor(private readonly service: MatriculaDisciplinaService) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Buscar matrícula por ID (inclui avaliações e resultado)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar status da matrícula' })
  update(@Param('id') id: string, @Body() dto: UpdateMatriculaDisciplinaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancelar matrícula' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
