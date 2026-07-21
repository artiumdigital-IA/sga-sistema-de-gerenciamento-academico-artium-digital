import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Financeiro — CNAB — Boletos')
@ApiBearerAuth()
@Controller('financeiro/cnab/boletos')
@Tela('cnab-boletos')
export class BoletoController {
  constructor(private readonly service: BoletoService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Emitir boleto a partir de uma parcela' })
  create(@Body() dto: CreateBoletoDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Listar boletos' })
  findAll(@Query('status') status?: string, @Query('contaBancariaId') contaBancariaId?: string) {
    return this.service.findAll(status, contaBancariaId);
  }

  @Get(':id')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Mudar status manualmente (CANCELADO/PROTESTADO/REGISTRADO — não LIQUIDADO, que sempre passa pela conciliação real)' })
  mudarStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.mudarStatus(id, status, req.user.sub);
  }
}
