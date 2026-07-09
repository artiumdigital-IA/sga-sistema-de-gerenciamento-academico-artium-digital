import { Controller, Post, Get, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ResultadoDisciplinaService } from './resultado-disciplina.service';
import { ConsolidarResultadoDto } from './dto/consolidar-resultado.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Resultado de Disciplinas')
@ApiBearerAuth()
@Controller('matriculas')
@Tela('matriculas')
export class ResultadoDisciplinaController {
  constructor(private readonly service: ResultadoDisciplinaService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Post(':id/consolidar')
  @ApiOperation({ summary: 'Calcular e persistir média + frequência de uma matrícula' })
  consolidar(
    @Param('id') id: string,
    @Body() dto: ConsolidarResultadoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    return this.service.consolidar(id, dto, req.user?.id);
  }

  @Get(':id/resultado')
  @ApiOperation({ summary: 'Buscar resultado consolidado de uma matrícula' })
  findOne(@Param('id') id: string) {
    return this.service.findByMatricula(id);
  }
}
