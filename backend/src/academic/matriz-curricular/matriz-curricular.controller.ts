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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MatrizCurricularService } from './matriz-curricular.service';
import { CreateMatrizDto } from './dto/create-matriz.dto';
import { UpdateMatrizDto } from './dto/update-matriz.dto';

@ApiTags('Matrizes Curriculares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matrizes')
export class MatrizCurricularController {
  constructor(private readonly matrizService: MatrizCurricularService) {}

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

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar matriz curricular' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMatrizDto,
    @Request() req: any,
  ) {
    return this.matrizService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover matriz curricular' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.matrizService.remove(id, req.user?.id);
  }
}
