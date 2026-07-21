import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TabelaIrrfService } from './tabela-irrf.service';
import { CreateTabelaIrrfDto } from './dto/create-tabela-irrf.dto';
import { UpdateTabelaIrrfDto } from './dto/update-tabela-irrf.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Tabela IRRF')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/tabelas-irrf')
@Tela('cpagar-tabelas-imposto')
export class TabelaIrrfController {
  constructor(private readonly service: TabelaIrrfService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova tabela de IRRF (com faixas)' })
  create(@Body() dto: CreateTabelaIrrfDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('vigente')
  @ApiOperation({ summary: 'Tabela de IRRF ativa mais recente' })
  findVigente() {
    return this.service.findVigente();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTabelaIrrfDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.sub);
  }
}
