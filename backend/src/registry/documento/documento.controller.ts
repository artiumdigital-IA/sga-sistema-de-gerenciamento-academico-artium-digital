import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';
import { DocumentoService } from './documento.service';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentoController {
  constructor(private readonly service: DocumentoService) {}

  // ⚠️ Precisa vir ANTES de "carteirinha/:alunoId" — o Nest casa rotas na ordem
  // declarada, senão "validar" seria interpretado como um :alunoId.
  // Deliberadamente SEM @Tela() -- rota publica de verificação de carteirinha.
  @Public()
  @Get('carteirinha/validar/:codigo')
  @ApiOperation({ summary: 'Validação pública de carteirinha estudantil pelo código impresso/QR (sem autenticação)' })
  validarCarteirinha(@Param('codigo') codigo: string) {
    return this.service.validarCarteirinha(codigo);
  }

  // @Tela('documentos') abaixo -- correspondem a tela "Documentos" (declaração,
  // boletim, carteirinha...) em /dashboard/secretaria/documentos.

  @Tela('documentos')
  @Get('declaracao-matricula/:alunoId')
  @ApiOperation({ summary: 'Dados para Declaração de Matrícula' })
  getDeclaracaoMatricula(@Param('alunoId') alunoId: string) {
    return this.service.getDeclaracaoMatricula(alunoId);
  }

  @Tela('documentos')
  @Get('boletim/:alunoId')
  @ApiOperation({ summary: 'Dados para Boletim (notas e frequência) de um período letivo' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  getBoletim(
    @Param('alunoId') alunoId: string,
    @Query('periodoLetivoId') periodoLetivoId?: string,
  ) {
    return this.service.getBoletim(alunoId, periodoLetivoId);
  }

  @Tela('documentos')
  @Get('carteirinha/:alunoId')
  @ApiOperation({ summary: 'Dados para Emissão de Carteirinha do aluno' })
  getCarteirinha(@Param('alunoId') alunoId: string) {
    return this.service.getCarteirinha(alunoId);
  }

  @Tela('documentos')
  @Get('historico-oficial/:alunoId')
  @ApiOperation({ summary: 'Dados para Histórico Escolar Oficial (por período, CR e integralização)' })
  getHistoricoOficial(@Param('alunoId') alunoId: string) {
    return this.service.getHistoricoOficial(alunoId);
  }

  @Tela('documentos')
  @Get('calendario-academico/:periodoLetivoId')
  @ApiOperation({ summary: 'Dados para documento imprimível do Calendário Acadêmico de um período letivo' })
  getCalendarioAcademico(@Param('periodoLetivoId') periodoLetivoId: string) {
    return this.service.getCalendarioAcademico(periodoLetivoId);
  }
}
