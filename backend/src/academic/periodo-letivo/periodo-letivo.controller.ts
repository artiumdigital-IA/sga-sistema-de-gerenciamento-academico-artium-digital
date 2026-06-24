import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PeriodoLetivoService } from './periodo-letivo.service';
import { CreatePeriodoLetivoDto } from './dto/create-periodo-letivo.dto';
import { UpdatePeriodoLetivoDto } from './dto/update-periodo-letivo.dto';

@ApiTags('Períodos Letivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('periodos-letivos')
export class PeriodoLetivoController {
  constructor(private readonly service: PeriodoLetivoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar período letivo' })
  create(@Body() dto: CreatePeriodoLetivoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar períodos letivos' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar período letivo por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar período letivo' })
  update(@Param('id') id: string, @Body() dto: UpdatePeriodoLetivoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover período letivo' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
