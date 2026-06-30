import { Controller, Get, Post, Body, Param, Patch, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { CreateContratoDto } from './contrato.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Financeiro — Contratos')
@ApiBearerAuth()
@Controller('financeiro/contratos')
export class ContratoController {
  constructor(private readonly service: ContratoService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Criar contrato + gerar parcelas' })
  create(@Body() dto: CreateContratoDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Listar contratos' })
  findAll(@Query('alunoId') alunoId?: string, @Query('periodoLetivoId') periodoLetivoId?: string) {
    return this.service.findAll(alunoId, periodoLetivoId);
  }

  @Get(':id')
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id/status')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.updateStatus(id, status, req.user.sub);
  }
}
