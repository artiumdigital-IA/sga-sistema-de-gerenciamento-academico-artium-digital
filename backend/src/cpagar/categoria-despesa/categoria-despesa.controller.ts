import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriaDespesaService } from './categoria-despesa.service';
import { CreateCategoriaDespesaDto, UpdateCategoriaDespesaDto } from './dto/categoria-despesa.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Categorias de Despesa')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/categorias-despesa')
@Tela('cpagar-gastos')
export class CategoriaDespesaController {
  constructor(private readonly service: CategoriaDespesaService) {}

  @Post() create(@Body() dto: CreateCategoriaDespesaDto, @Request() req: any) { return this.service.create(dto, req.user?.sub); }
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCategoriaDespesaDto, @Request() req: any) { return this.service.update(id, dto, req.user?.sub); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req: any) { return this.service.remove(id, req.user?.sub); }
}
