import { Controller, Get, Put, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotaPautaService } from './nota-pauta.service';
import { UpsertNotaPautaDto } from './dto/upsert-nota-pauta.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Notas por Pauta')
@ApiBearerAuth()
@Controller('notas-pauta')
@Tela('pauta')
export class NotaPautaController {
  constructor(private readonly service: NotaPautaService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Get()
  @ApiOperation({ summary: 'Pauta de uma oferta (semestre) — Lançamento de Notas & Frequência por Pauta' })
  @ApiQuery({ name: 'ofertaId', required: true })
  pauta(@Query('ofertaId') ofertaId: string, @Request() req: { user: { id: string; perfil: string } }) {
    return this.service.pauta(ofertaId, req.user);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Put(':matriculaDisciplinaId')
  @ApiOperation({ summary: 'Lançar/atualizar a linha de notas de um aluno no semestre' })
  salvar(
    @Param('matriculaDisciplinaId') matriculaDisciplinaId: string,
    @Body() dto: UpsertNotaPautaDto,
    @Request() req: { user: { id: string; perfil: string } },
  ) {
    return this.service.salvar(matriculaDisciplinaId, dto, req.user);
  }
}
