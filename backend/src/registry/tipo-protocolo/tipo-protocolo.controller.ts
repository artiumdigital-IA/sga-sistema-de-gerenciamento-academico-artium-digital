import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TipoProtocoloService } from './tipo-protocolo.service';
import { CreateTipoProtocoloDto } from './dto/create-tipo-protocolo.dto';
import { UpdateTipoProtocoloDto } from './dto/update-tipo-protocolo.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Tipos de Protocolo')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('tipos-protocolo')
@Tela('tipos-protocolo')
export class TipoProtocoloController {
  constructor(private readonly service: TipoProtocoloService) {}

  @Post()
  @ApiOperation({ summary: 'Criar tipo de protocolo' })
  create(@Body() dto: CreateTipoProtocoloDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de protocolo' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTipoProtocoloDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
