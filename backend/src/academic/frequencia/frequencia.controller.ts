import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FrequenciaService } from './frequencia.service';
import { LancarFrequenciaDto } from './dto/lancar-frequencia.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

type Req = { user: { id: string; perfil: string } };

@ApiTags('Frequência Diária')
@ApiBearerAuth()
@Controller('frequencia')
@Tela('frequencia')
export class FrequenciaController {
  constructor(private readonly service: FrequenciaService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Post('lancar')
  @ApiOperation({ summary: 'Lançar frequência (entrada/faltas) de uma turma num dia' })
  lancar(@Body() dto: LancarFrequenciaDto, @Request() req: Req) {
    return this.service.lancar(dto, req.user);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Get()
  @ApiOperation({ summary: 'Consultar lançamentos de uma oferta numa data (Manutenção de Frequência)' })
  @ApiQuery({ name: 'ofertaId', required: true })
  @ApiQuery({ name: 'data', required: true })
  listar(@Query('ofertaId') ofertaId: string, @Query('data') data: string, @Request() req: Req) {
    return this.service.listarPorOfertaEData(ofertaId, data, req.user);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Get('resumo/:ofertaId')
  @ApiOperation({ summary: 'Resumo de frequência por aluno de uma oferta (Listagem de Alunos em Atraso)' })
  resumoOferta(@Param('ofertaId') ofertaId: string, @Request() req: Req) {
    return this.service.resumoPorOferta(ofertaId, req.user);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Get('resumo-matricula/:matriculaDisciplinaId')
  @ApiOperation({ summary: 'Resumo de frequência de uma matrícula (auto-preenche o Consolidar)' })
  resumoMatricula(@Param('matriculaDisciplinaId') matriculaDisciplinaId: string, @Request() req: Req) {
    return this.service.resumoPorMatricula(matriculaDisciplinaId, req.user);
  }
}
