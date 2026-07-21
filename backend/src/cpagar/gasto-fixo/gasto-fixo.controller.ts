import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GastoFixoService } from './gasto-fixo.service';
import { CreateGastoFixoDto, UpdateGastoFixoDto } from './dto/gasto-fixo.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Gastos Fixos')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/gastos-fixos')
@Tela('cpagar-gastos')
export class GastoFixoController {
  constructor(private readonly service: GastoFixoService) {}

  @Post() create(@Body() dto: CreateGastoFixoDto, @Request() req: any) { return this.service.create(dto, req.user?.sub); }
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGastoFixoDto, @Request() req: any) { return this.service.update(id, dto, req.user?.sub); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req: any) { return this.service.remove(id, req.user?.sub); }
}
