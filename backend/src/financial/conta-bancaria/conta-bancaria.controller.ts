import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContaBancariaService } from './conta-bancaria.service';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Financeiro — Contas Bancárias')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('financeiro/contas-bancarias')
@Tela('contas-bancarias')
export class ContaBancariaController {
  constructor(private readonly service: ContaBancariaService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar conta bancária' })
  create(@Body() dto: CreateContaBancariaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiQuery({ name: 'somenteAtivas', required: false })
  @ApiOperation({ summary: 'Listar contas bancárias' })
  findAll(@Query('somenteAtivas') somenteAtivas?: string) {
    return this.service.findAll(somenteAtivas === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta bancária por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta bancária' })
  update(@Param('id') id: string, @Body() dto: UpdateContaBancariaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover conta bancária' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
