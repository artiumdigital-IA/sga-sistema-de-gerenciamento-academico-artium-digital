import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EquipamentoService } from './equipamento.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Mesmo padrão de LivroController: leitura (GET) aberta a qualquer
// autenticado, escrita restrita a ADMIN/SECRETARIA rota a rota.
@ApiTags('Biblioteca — Equipamentos')
@ApiBearerAuth()
@Tela('biblioteca-equipamentos')
@Controller('biblioteca/equipamentos')
export class EquipamentoController {
  constructor(private readonly service: EquipamentoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Cadastrar equipamento' })
  create(@Body() dto: CreateEquipamentoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiQuery({ name: 'busca', required: false })
  @ApiOperation({ summary: 'Listar equipamentos (busca por patrimônio/modelo/nº série)' })
  findAll(@Query('busca') busca?: string) {
    return this.service.findAll(busca);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar equipamento' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Editar equipamento' })
  update(@Param('id') id: string, @Body() dto: UpdateEquipamentoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @ApiOperation({ summary: 'Remover equipamento (bloqueado se emprestado)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
