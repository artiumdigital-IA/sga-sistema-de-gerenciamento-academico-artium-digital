import { Controller, Get, Param, Query, Request } from '@nestjs/common';
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
  // boletim, carteirinha...) em /dashboard/secretaria/documentos. As mesmas
  // rotas também são usadas pelo app do aluno (mobile/) direto no
  // dispositivo do aluno -- por isso passamos req.user pro service, que
  // trava (ForbiddenException) quando o perfil é ALUNO e o :alunoId da URL
  // não é do próprio usuário autenticado (ver DocumentoService.verificarAcessoAluno).
  // Secretaria/Admin/Financeiro/Professor continuam podendo consultar
  // qualquer aluno, como já era.

  @Tela('documentos')
  @Get('declaracao-matricula/:alunoId')
  @ApiOperation({ summary: 'Dados para Declaração de Matrícula' })
  getDeclaracaoMatricula(@Param('alunoId') alunoId: string, @Request() req: any) {
    return this.service.getDeclaracaoMatricula(alunoId, req.user);
  }

  @Tela('documentos')
  @Get('boletim/:alunoId')
  @ApiOperation({ summary: 'Dados para Boletim (notas e frequência) de um período letivo' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  getBoletim(
    @Param('alunoId') alunoId: string,
    @Query('periodoLetivoId') periodoLetivoId: string | undefined,
    @Request() req: any,
  ) {
    return this.service.getBoletim(alunoId, periodoLetivoId, req.user);
  }

  @Tela('documentos')
  @Get('carteirinha/:alunoId')
  @ApiOperation({ summary: 'Dados para Emissão de Carteirinha do aluno' })
  getCarteirinha(@Param('alunoId') alunoId: string, @Request() req: any) {
    return this.service.getCarteirinha(alunoId, req.user);
  }

  @Tela('documentos')
  @Get('historico-oficial/:alunoId')
  @ApiOperation({ summary: 'Dados para Histórico Escolar Oficial (por período, CR e integralização)' })
  getHistoricoOficial(@Param('alunoId') alunoId: string, @Request() req: any) {
    return this.service.getHistoricoOficial(alunoId, req.user);
  }

  @Tela('documentos')
  @Get('calendario-academico/:periodoLetivoId')
  @ApiOperation({ summary: 'Dados para documento imprimível do Calendário Acadêmico de um período letivo' })
  getCalendarioAcademico(@Param('periodoLetivoId') periodoLetivoId: string) {
    return this.service.getCalendarioAcademico(periodoLetivoId);
  }
}
