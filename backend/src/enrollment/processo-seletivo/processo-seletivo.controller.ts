import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProcessoSeletivoService } from './processo-seletivo.service';
import { CreateProcessoSeletivoDto } from './dto/create-processo-seletivo.dto';
import { UpdateProcessoSeletivoDto } from './dto/update-processo-seletivo.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Processo Seletivo')
@ApiBearerAuth()
@Controller('processos-seletivos')
export class ProcessoSeletivoController {
  constructor(private readonly service: ProcessoSeletivoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Criar processo seletivo' })
  create(@Body() dto: CreateProcessoSeletivoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar processos seletivos' })
  findAll(@Query('cursoId') cursoId?: string) {
    return this.service.findAll(cursoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar processo seletivo por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar processo seletivo' })
  update(@Param('id') id: string, @Body() dto: UpdateProcessoSeletivoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Excluir processo seletivo' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
