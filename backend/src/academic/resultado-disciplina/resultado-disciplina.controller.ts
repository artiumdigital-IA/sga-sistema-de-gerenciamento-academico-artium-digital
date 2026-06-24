import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ResultadoDisciplinaService } from './resultado-disciplina.service';
import { ConsolidarResultadoDto } from './dto/consolidar-resultado.dto';

@ApiTags('Resultado de Disciplinas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matriculas')
export class ResultadoDisciplinaController {
  constructor(private readonly service: ResultadoDisciplinaService) {}

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
