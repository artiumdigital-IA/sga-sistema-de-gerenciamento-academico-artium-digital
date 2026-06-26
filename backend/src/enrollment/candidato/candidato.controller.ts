import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CandidatoService } from './candidato.service';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Candidatos')
@ApiBearerAuth()
@Controller('candidatos')
export class CandidatoController {
  constructor(private readonly service: CandidatoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Registrar candidato' })
  create(@Body() dto: CreateCandidatoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar candidatos' })
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar candidato por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar candidato' })
  update(@Param('id') id: string, @Body() dto: UpdateCandidatoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Excluir candidato' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
