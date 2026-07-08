import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { DocumentoService } from './documento.service';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentoController {
  constructor(private readonly service: DocumentoService) {}

  // ⚠️ Precisa vir ANTES de "carteirinha/:alunoId" — o Nest casa rotas na ordem
  // declarada, senão "validar" seria interpretado como um :alunoId.
  @Public()
  @Get('carteirinha/validar/:codigo')
  @ApiOperation({ summary: 'Validação pública de carteirinha estudantil pelo código impresso/QR (sem autenticação)' })
  validarCarteirinha(@Param('codigo') codigo: string) {
    return this.service.validarCarteirinha(codigo);
  }

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

  @Get('carteirinha/:alunoId')
  @ApiOperation({ summary: 'Dados para Emissão de Carteirinha do aluno' })
  getCarteirinha(@Param('alunoId') alunoId: string) {
    return this.service.getCarteirinha(alunoId);
  }

  @Get('historico-oficial/:alunoId')
  @ApiOperation({ summary: 'Dados para Histórico Escolar Oficial (por período, CR e integralização)' })
  getHistoricoOficial(@Param('alunoId') alunoId: string) {
    return this.service.getHistoricoOficial(alunoId);
  }

  @Get('calendario-academico/:periodoLetivoId')
  @ApiOperation({ summary: 'Dados para documento imprimível do Calendário Acadêmico de um período letivo' })
  getCalendarioAcademico(@Param('periodoLetivoId') periodoLetivoId: string) {
    return this.service.getCalendarioAcademico(periodoLetivoId);
  }
}
