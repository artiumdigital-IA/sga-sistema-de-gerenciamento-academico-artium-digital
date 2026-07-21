import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GastoVariavelService } from './gasto-variavel.service';
import { CreateGastoVariavelDto, UpdateGastoVariavelDto } from './dto/gasto-variavel.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Gastos Variáveis')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/gastos-variaveis')
@Tela('cpagar-gastos')
export class GastoVariavelController {
  constructor(private readonly service: GastoVariavelService) {}

  @Post() create(@Body() dto: CreateGastoVariavelDto, @Request() req: any) { return this.service.create(dto, req.user?.sub); }
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGastoVariavelDto, @Request() req: any) { return this.service.update(id, dto, req.user?.sub); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req: any) { return this.service.remove(id, req.user?.sub); }
}
