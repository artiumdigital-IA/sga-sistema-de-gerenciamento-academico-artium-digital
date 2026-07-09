import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequerimentoService } from './requerimento.service';
import { CreateRequerimentoDto } from './dto/create-requerimento.dto';
import { UpdateRequerimentoDto } from './dto/update-requerimento.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Requerimentos')
@ApiBearerAuth()
@Controller('requerimentos')
@Tela('requerimentos')
export class RequerimentoController {
  constructor(private readonly service: RequerimentoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.ALUNO)
  @Post()
  @ApiOperation({ summary: 'Abrir requerimento' })
  create(@Body() dto: CreateRequerimentoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar requerimentos' })
  findAll(
    @Query('alunoId') alunoId?: string,
    @Query('status') status?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.findAll(alunoId, status, tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar requerimento por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar status / resposta' })
  update(@Param('id') id: string, @Body() dto: UpdateRequerimentoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }
}
