import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BolsistaService } from './bolsista.service';
import { CreateBolsistaDto } from './dto/create-bolsista.dto';
import { UpdateBolsistaDto } from './dto/update-bolsista.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Financeiro — Bolsistas')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO, Perfil.SECRETARIA)
@Controller('bolsistas')
export class BolsistaController {
  constructor(private readonly service: BolsistaService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar bolsista' })
  create(@Body() dto: CreateBolsistaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiQuery({ name: 'somenteAtivos', required: false })
  @ApiOperation({ summary: 'Listagem de Alunos Bolsistas' })
  findAll(@Query('somenteAtivos') somenteAtivos?: string) {
    return this.service.findAll(somenteAtivos === 'true');
  }

  @Get('aluno/:alunoId')
  @ApiOperation({ summary: 'Bolsas de um aluno' })
  findByAluno(@Param('alunoId') alunoId: string) {
    return this.service.findByAluno(alunoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar bolsa' })
  update(@Param('id') id: string, @Body() dto: UpdateBolsistaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro de bolsista' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
