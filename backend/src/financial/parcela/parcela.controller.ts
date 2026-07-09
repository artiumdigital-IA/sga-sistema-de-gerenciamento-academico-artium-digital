import { Controller, Param, Patch, Body, Request, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ParcelaService } from './parcela.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Financeiro — Parcelas')
@ApiBearerAuth()
@Controller('financeiro/parcelas')
@Tela('contratos')
export class ParcelaController {
  constructor(private readonly service: ParcelaService) {}

  @Patch(':id/pagar')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Registrar pagamento de parcela' })
  pagar(@Param('id') id: string, @Body() body: { valorPago: number; formaPagamento: string; dataPagamento?: string }, @Request() req: any) {
    return this.service.registrarPagamento(id, body, req.user.sub);
  }

  @Patch(':id/cancelar')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  cancelar(@Param('id') id: string, @Request() req: any) {
    return this.service.cancelar(id, req.user.sub);
  }

  @Post('atualizar-vencidas')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Marcar parcelas vencidas (cron manual)' })
  atualizarVencidas() { return this.service.atualizarVencidas(); }
}
