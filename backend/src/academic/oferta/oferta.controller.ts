import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OfertaService } from './oferta.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';

@ApiTags('Ofertas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ofertas')
export class OfertaController {
  constructor(private readonly service: OfertaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar oferta de disciplina' })
  create(@Body() dto: CreateOfertaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ofertas (opcional: filtrar por periodoLetivoId)' })
  @ApiQuery({ name: 'periodoLetivoId', required: false })
  findAll(@Query('periodoLetivoId') periodoLetivoId?: string) {
    return this.service.findAll(periodoLetivoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar oferta por ID (inclui alunos matriculados)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar oferta' })
  update(@Param('id') id: string, @Body() dto: UpdateOfertaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover oferta' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
