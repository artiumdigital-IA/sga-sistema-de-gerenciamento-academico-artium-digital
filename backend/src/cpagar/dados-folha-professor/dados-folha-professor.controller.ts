import { Controller, Get, Put, Param, Body, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { DadosFolhaProfessorService } from './dados-folha-professor.service';
import { UpsertDadosFolhaProfessorDto } from './dto/upsert-dados-folha-professor.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Dados de Folha do Professor')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/professores')
@Tela('cpagar-colaboradores')
export class DadosFolhaProfessorController {
  constructor(private readonly service: DadosFolhaProfessorService) {}

  @Get(':professorId/dados-folha')
  @ApiOperation({ summary: 'Buscar dados de folha do professor (salário, dependentes, admissão)' })
  findByProfessor(@Param('professorId') professorId: string) {
    return this.service.findByProfessor(professorId);
  }

  @Put(':professorId/dados-folha')
  @ApiOperation({ summary: 'Criar ou atualizar dados de folha do professor' })
  upsert(@Param('professorId') professorId: string, @Body() dto: UpsertDadosFolhaProfessorDto, @Request() req: any) {
    return this.service.upsert(professorId, dto, req.user?.sub);
  }
}
