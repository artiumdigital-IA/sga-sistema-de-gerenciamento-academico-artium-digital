import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CensoService } from './censo.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Relatórios — Censo')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('relatorios/censo')
export class CensoController {
  constructor(private readonly service: CensoService) {}

  @Get('resumo')
  @ApiOperation({ summary: 'Resumo geral para o Censo' })
  getResumo() { return this.service.getResumo(); }

  @Get('alunos')
  @ApiOperation({ summary: 'Dados de alunos (campos Censo/INEP)' })
  getAlunos() { return this.service.getAlunosCenso(); }

  @Get('docentes')
  @ApiOperation({ summary: 'Dados de docentes (campos Censo/INEP)' })
  getDocentes() { return this.service.getDocentesCenso(); }

  @Get('cursos')
  @ApiOperation({ summary: 'Dados de cursos (campos Censo/INEP)' })
  getCursos() { return this.service.getCursosCenso(); }
}
