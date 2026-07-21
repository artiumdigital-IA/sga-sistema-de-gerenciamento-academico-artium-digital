import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TabelaInssService } from './tabela-inss.service';
import { CreateTabelaInssDto } from './dto/create-tabela-inss.dto';
import { UpdateTabelaInssDto } from './dto/update-tabela-inss.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Tabela INSS')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/tabelas-inss')
@Tela('cpagar-tabelas-imposto')
export class TabelaInssController {
  constructor(private readonly service: TabelaInssService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova tabela de INSS (com faixas)' })
  create(@Body() dto: CreateTabelaInssDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('vigente')
  @ApiOperation({ summary: 'Tabela de INSS ativa mais recente' })
  findVigente() {
    return this.service.findVigente();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTabelaInssDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.sub);
  }
}
