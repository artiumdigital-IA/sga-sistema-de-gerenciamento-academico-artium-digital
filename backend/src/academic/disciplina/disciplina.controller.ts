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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DisciplinaService } from './disciplina.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';

@ApiTags('Disciplinas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disciplinas')
export class DisciplinaController {
  constructor(private readonly disciplinaService: DisciplinaService) {}

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

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar disciplina' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDisciplinaDto,
    @Request() req: any,
  ) {
    return this.disciplinaService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover disciplina' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.disciplinaService.remove(id, req.user?.id);
  }
}
