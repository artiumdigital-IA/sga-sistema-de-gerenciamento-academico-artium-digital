import { Controller, Get, Post, Patch, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AcordoPagarService } from './acordo-pagar.service';
import { CreateAcordoPagarDto, UpdateAcordoPagarDto } from './dto/acordo-pagar.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Acordos')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/acordos')
@Tela('cpagar-acordos')
export class AcordoPagarController {
  constructor(private readonly service: AcordoPagarService) {}

  @Post()
  @ApiOperation({ summary: 'Criar acordo de parcelamento com fornecedor/prestador + gerar parcelas' })
  create(@Body() dto: CreateAcordoPagarDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAcordoPagarDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.sub);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.updateStatus(id, status, req.user?.sub);
  }

  @Patch('parcelas/:parcelaId/pagar')
  @ApiOperation({ summary: 'Registrar pagamento de uma parcela' })
  pagarParcela(@Param('parcelaId') parcelaId: string, @Body() body: { valorPago: number; formaPagamento: string; dataPagamento?: string }, @Request() req: any) {
    return this.service.pagarParcela(parcelaId, body, req.user?.sub);
  }
}
