import { Controller, Get, Put, Body, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotaPautaService } from './nota-pauta.service';
import { UpsertNotaPautaDto } from './dto/upsert-nota-pauta.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil, EtapaAvaliativa } from '@prisma/client';

@ApiTags('Notas por Pauta (Bimestral)')
@ApiBearerAuth()
@Controller('notas-pauta')
export class NotaPautaController {
  constructor(private readonly service: NotaPautaService) {}

  private validarEtapa(etapa: string): EtapaAvaliativa {
    if (!Object.values(EtapaAvaliativa).includes(etapa as EtapaAvaliativa)) {
      throw new BadRequestException(`Etapa inválida: "${etapa}".`);
    }
    return etapa as EtapaAvaliativa;
  }

  @Get()
  @ApiOperation({ summary: 'Pauta de uma oferta num bimestre/etapa — Lançamento de Notas & Frequência por Pauta' })
  @ApiQuery({ name: 'ofertaId', required: true })
  @ApiQuery({ name: 'etapa', required: true, enum: EtapaAvaliativa })
  pauta(@Query('ofertaId') ofertaId: string, @Query('etapa') etapa: string) {
    return this.service.pauta(ofertaId, this.validarEtapa(etapa));
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.PROFESSOR)
  @Put(':matriculaDisciplinaId')
  @ApiOperation({ summary: 'Lançar/atualizar a linha de notas de um aluno num bimestre/etapa' })
  @ApiQuery({ name: 'etapa', required: true, enum: EtapaAvaliativa })
  salvar(
    @Param('matriculaDisciplinaId') matriculaDisciplinaId: string,
    @Query('etapa') etapa: string,
    @Body() dto: UpsertNotaPautaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    return this.service.salvar(matriculaDisciplinaId, this.validarEtapa(etapa), dto, req.user?.id);
  }
}
