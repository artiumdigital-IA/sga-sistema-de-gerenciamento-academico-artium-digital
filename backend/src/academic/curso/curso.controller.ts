import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CursoService } from './curso.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Cursos')
@ApiBearerAuth()
@Controller('cursos')
export class CursoController {
  constructor(private readonly cursoService: CursoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Criar curso' })
  create(@Body() dto: CreateCursoDto, @Request() req: any) {
    return this.cursoService.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os cursos' })
  findAll() {
    return this.cursoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar curso por ID' })
  findOne(@Param('id') id: string) {
    return this.cursoService.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar curso' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCursoDto,
    @Request() req: any,
  ) {
    return this.cursoService.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover curso' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.cursoService.remove(id, req.user?.id);
  }
}
