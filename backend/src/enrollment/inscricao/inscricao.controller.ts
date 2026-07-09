import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InscricaoService } from './inscricao.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Inscrições')
@ApiBearerAuth()
@Controller('inscricoes')
@Tela('processos-seletivos')
export class InscricaoController {
  constructor(private readonly service: InscricaoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Registrar inscrição' })
  create(@Body() dto: CreateInscricaoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inscrições' })
  findAll(
    @Query('processoSeletivoId') processoSeletivoId?: string,
    @Query('candidatoId') candidatoId?: string,
  ) {
    return this.service.findAll(processoSeletivoId, candidatoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar inscrição por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar status / dados da inscrição' })
  update(@Param('id') id: string, @Body() dto: UpdateInscricaoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post(':id/converter-aluno')
  @ApiOperation({ summary: 'Converter inscrição aprovada em Aluno' })
  converterEmAluno(
    @Param('id') id: string,
    @Body('matrizCurricularId') matrizId: string,
    @Request() req: any,
  ) {
    return this.service.converterEmAluno(id, matrizId, req.user?.id);
  }
}
