import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';
import { DiscenteService } from './discente.service';
import { AbrirProtocoloDto } from './dto/abrir-protocolo.dto';

/**
 * Autoatendimento do aluno ("Menu Discente" — ver components/dashboard/RightPanel.tsx
 * no frontend). Todo o controller é restrito ao perfil ALUNO: cada rota resolve o
 * Aluno do próprio usuário autenticado (nunca recebe alunoId por parâmetro), então um
 * aluno nunca consegue ver dado de outro só trocando um ID na URL.
 *
 * Cada rota (exceto "painel", que é o resumo carregado por qualquer ALUNO autenticado,
 * igual ao Painel inicial pros demais perfis) tem seu próprio @Tela(), permitindo à
 * secretaria/admin ativar/desativar cada sub-item do Menu Discente independentemente
 * na matriz de Permissões de Tela (/dashboard/admin/permissoes).
 */
@ApiTags('Discente (Autoatendimento do Aluno)')
@ApiBearerAuth()
@Roles(Perfil.ALUNO)
@Controller('discente')
export class DiscenteController {
  constructor(private readonly service: DiscenteService) {}

  @Get('painel')
  @ApiOperation({ summary: 'Resumo do Menu Discente: dados básicos, progresso no curso, CR/integralização, pendências' })
  painel(@Request() req: any) {
    return this.service.painel(req.user.id);
  }

  @Tela('discente-horarios')
  @Get('horarios')
  @ApiOperation({ summary: 'Quadro de Horários do próprio aluno' })
  horarios(@Request() req: any) {
    return this.service.horarios(req.user.id);
  }

  @Tela('discente-documentos')
  @Get('documentos')
  @ApiOperation({ summary: 'Pendências e documentos já enviados do próprio aluno' })
  documentos(@Request() req: any) {
    return this.service.documentos(req.user.id);
  }

  @Tela('discente-protocolo')
  @Get('protocolo/tipos')
  @ApiOperation({ summary: 'Tipos de protocolo ativos (formulário de abertura)' })
  tiposProtocolo() {
    return this.service.tiposProtocolo();
  }

  @Tela('discente-protocolo')
  @Get('protocolo')
  @ApiOperation({ summary: 'Meus protocolos (abertura/consulta)' })
  meusProtocolos(@Request() req: any) {
    return this.service.meusProtocolos(req.user.id);
  }

  @Tela('discente-protocolo')
  @Post('protocolo')
  @ApiOperation({ summary: 'Abrir novo protocolo em meu nome' })
  abrirProtocolo(@Body() dto: AbrirProtocoloDto, @Request() req: any) {
    return this.service.abrirProtocolo(req.user.id, dto);
  }

  @Tela('discente-carteira')
  @Get('carteira')
  @ApiOperation({ summary: 'Minha Carteira de Estudante (dados + QR de validação)' })
  carteira(@Request() req: any) {
    return this.service.carteira(req.user.id);
  }

  @Tela('discente-disciplinas')
  @Get('disciplinas')
  @ApiOperation({ summary: 'Minhas disciplinas e avaliações do período atual' })
  disciplinas(@Request() req: any) {
    return this.service.disciplinas(req.user.id);
  }

  @Tela('discente-historico')
  @Get('historico')
  @ApiOperation({ summary: 'Minhas notas e histórico acadêmico (CR + integralização)' })
  historico(@Request() req: any) {
    return this.service.historico(req.user.id);
  }

  @Tela('discente-financeiro')
  @Get('financeiro')
  @ApiOperation({ summary: 'Meus contratos e parcelas (somente leitura)' })
  financeiro(@Request() req: any) {
    return this.service.financeiro(req.user.id);
  }
}
