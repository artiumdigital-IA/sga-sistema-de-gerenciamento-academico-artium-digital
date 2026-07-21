import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ColaboradorService } from './colaborador.service';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Dado de RH (salário, dependentes, dados bancários) — restrito a ADMIN/FINANCEIRO,
// mesmo padrão de sensibilidade já usado em FichaSaude (LGPD/dado sensível).
@ApiTags('CPagar — Colaboradores')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/colaboradores')
@Tela('cpagar-colaboradores')
export class ColaboradorController {
  constructor(private readonly service: ColaboradorService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar colaborador (prestador de serviço ou colaborador interno)' })
  create(@Body() dto: CreateColaboradorDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  @ApiQuery({ name: 'tipoVinculo', required: false })
  @ApiQuery({ name: 'ativo', required: false })
  findAll(@Query('tipoVinculo') tipoVinculo?: string, @Query('ativo') ativo?: string) {
    return this.service.findAll(tipoVinculo, ativo !== undefined ? ativo === 'true' : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateColaboradorDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.sub);
  }
}
