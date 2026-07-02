import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DocumentoService } from './documento.service';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentoController {
  constructor(private readonly service: DocumentoService) {}

  @Get('declaracao-matricula/:alunoId')
  @ApiOperation({ summary: 'Dados para Declaração de Matrícula' })
  getDeclaracaoMatricula(@Param('alunoId') alunoId: string) {
    return this.service.getDeclaracaoMatricula(alunoId);
  }

  @Get('boletim/:alunoId')
  @ApiOperation({ summary: 'Dados para Boletim (notas e frequência) de um período letivo' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  getBoletim(
    @Param('alunoId') alunoId: string,
    @Query('periodoLetivoId') periodoLetivoId?: string,
  ) {
    return this.service.getBoletim(alunoId, periodoLetivoId);
  }
}
