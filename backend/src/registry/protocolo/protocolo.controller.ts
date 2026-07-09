import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProtocoloService } from './protocolo.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { UpdateProtocoloStatusDto } from './dto/update-protocolo-status.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Protocolos')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('protocolos')
@Tela('protocolos')
export class ProtocoloController {
  constructor(private readonly service: ProtocoloService) {}

  @Post()
  @ApiOperation({ summary: 'Lançar protocolo (gera número sequencial automaticamente)' })
  create(@Body() dto: CreateProtocoloDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar protocolos (filtros opcionais)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tipoId', required: false })
  @ApiQuery({ name: 'alunoId', required: false })
  findAll(@Query('status') status?: string, @Query('tipoId') tipoId?: string, @Query('alunoId') alunoId?: string) {
    return this.service.findAll({ status, tipoId, alunoId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do protocolo (fluxo aberto → em andamento → concluído/cancelado)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateProtocoloStatusDto, @Request() req: any) {
    return this.service.updateStatus(id, dto, req.user?.id);
  }
}
