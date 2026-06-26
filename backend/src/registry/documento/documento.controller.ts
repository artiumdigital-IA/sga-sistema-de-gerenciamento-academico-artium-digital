import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
}
