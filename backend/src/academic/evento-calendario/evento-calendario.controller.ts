import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventoCalendarioService } from './evento-calendario.service';
import { CreateEventoCalendarioDto } from './dto/create-evento-calendario.dto';
import { UpdateEventoCalendarioDto } from './dto/update-evento-calendario.dto';

import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Calendário Acadêmico')
@ApiBearerAuth()
@Controller('eventos-calendario')
export class EventoCalendarioController {
  constructor(private readonly service: EventoCalendarioService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Criar item do calendário acadêmico' })
  create(@Body() dto: CreateEventoCalendarioDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar itens do calendário acadêmico (filtro por período letivo)' })
  findAll(@Query('periodoLetivoId') periodoLetivoId?: string) {
    return this.service.findAll(periodoLetivoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar item do calendário por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar item do calendário' })
  update(@Param('id') id: string, @Body() dto: UpdateEventoCalendarioDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover item do calendário' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
