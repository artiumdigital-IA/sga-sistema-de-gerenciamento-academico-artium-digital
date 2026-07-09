import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FinanceiroRelatoriosService } from './financeiro.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';

@ApiTags('Relatórios — Financeiro')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO, Perfil.SECRETARIA)
@Controller('relatorios/financeiro')
@Tela('relatorio-financeiro')
export class FinanceiroRelatoriosController {
  constructor(private readonly service: FinanceiroRelatoriosService) {}

  @Get('inadimplencia')
  @ApiOperation({ summary: 'Relatório de Inadimplência — parcelas vencidas e não pagas' })
  inadimplencia() { return this.service.inadimplencia(); }

  @Get('resumo-turma')
  @ApiOperation({ summary: 'Resumo Financeiro por Turma (aproximado por Curso + Período Letivo)' })
  resumoTurma() { return this.service.resumoPorTurma(); }

  @Get('resumo-contabil')
  @ApiOperation({ summary: 'Resumo Financeiro por Curso/Competência (Contabilidade)' })
  resumoContabil() { return this.service.resumoContabilPorCompetencia(); }
}
