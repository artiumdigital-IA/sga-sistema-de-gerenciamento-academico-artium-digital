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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CursoService } from './curso.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@ApiTags('Cursos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cursos')
export class CursoController {
  constructor(private readonly cursoService: CursoService) {}

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

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar curso' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCursoDto,
    @Request() req: any,
  ) {
    return this.cursoService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover curso' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.cursoService.remove(id, req.user?.id);
  }
}
