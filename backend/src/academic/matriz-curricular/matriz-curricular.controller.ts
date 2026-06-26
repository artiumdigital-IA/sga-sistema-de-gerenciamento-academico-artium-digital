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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MatrizCurricularService } from './matriz-curricular.service';
import { CreateMatrizDto } from './dto/create-matriz.dto';
import { UpdateMatrizDto } from './dto/update-matriz.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Matrizes Curriculares')
@ApiBearerAuth()
@Controller('matrizes')
export class MatrizCurricularController {
  constructor(private readonly matrizService: MatrizCurricularService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Criar matriz curricular' })
  create(@Body() dto: CreateMatrizDto, @Request() req: any) {
    return this.matrizService.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar matrizes (opcionalmente filtrar por cursoId)' })
  @ApiQuery({ name: 'cursoId', required: false })
  findAll(@Query('cursoId') cursoId?: string) {
    return this.matrizService.findAll(cursoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar matriz por ID (inclui disciplinas)' })
  findOne(@Param('id') id: string) {
    return this.matrizService.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar matriz curricular' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMatrizDto,
    @Request() req: any,
  ) {
    return this.matrizService.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover matriz curricular' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.matrizService.remove(id, req.user?.id);
  }
}
