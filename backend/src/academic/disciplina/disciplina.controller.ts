import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DisciplinaService } from './disciplina.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';
import { AddPrerequisitoDto } from './dto/add-prerequisito.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Disciplinas')
@ApiBearerAuth()
@Controller('disciplinas')
@Tela('disciplinas')
export class DisciplinaController {
  constructor(private readonly disciplinaService: DisciplinaService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Criar disciplina' })
  create(@Body() dto: CreateDisciplinaDto, @Request() req: any) {
    return this.disciplinaService.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar disciplinas (opcionalmente filtrar por matrizCurricularId)' })
  @ApiQuery({ name: 'matrizCurricularId', required: false })
  findAll(@Query('matrizCurricularId') matrizCurricularId?: string) {
    return this.disciplinaService.findAll(matrizCurricularId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar disciplina por ID (inclui pré-requisitos)' })
  findOne(@Param('id') id: string) {
    return this.disciplinaService.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar disciplina' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDisciplinaDto,
    @Request() req: any,
  ) {
    return this.disciplinaService.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover disciplina' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.disciplinaService.remove(id, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post(':id/prerequisitos')
  @ApiOperation({ summary: 'Adicionar pré-requisito a uma disciplina' })
  addPrerequisito(
    @Param('id') id: string,
    @Body() dto: AddPrerequisitoDto,
    @Request() req: any,
  ) {
    return this.disciplinaService.addPrerequisito(
      id,
      dto.prerequisitoId,
      req.user?.id,
    );
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id/prerequisitos/:prerequisitoId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover pré-requisito de uma disciplina' })
  removePrerequisito(
    @Param('id') id: string,
    @Param('prerequisitoId') prerequisitoId: string,
    @Request() req: any,
  ) {
    return this.disciplinaService.removePrerequisito(
      id,
      prerequisitoId,
      req.user?.id,
    );
  }
}
