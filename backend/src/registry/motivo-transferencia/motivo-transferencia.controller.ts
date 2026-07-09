import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MotivoTransferenciaService } from './motivo-transferencia.service';
import { CreateMotivoTransferenciaDto } from './dto/create-motivo-transferencia.dto';
import { UpdateMotivoTransferenciaDto } from './dto/update-motivo-transferencia.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Sem @Roles() no GET: o catálogo alimenta o <datalist> de sugestão do campo
// motivo em Transferência de Turma e Mudança de Situação, usados também por
// perfis não-admin (SECRETARIA já cobre a maior parte, mas mantemos leitura
// aberta pelo mesmo motivo dos outros catálogos deste projeto).
@ApiTags('Motivos de Transferência e Cancelamento')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('motivos-transferencia')
@Tela('motivos-transferencia')
export class MotivoTransferenciaController {
  constructor(private readonly service: MotivoTransferenciaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar motivo de transferência/cancelamento' })
  create(@Body() dto: CreateMotivoTransferenciaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMotivoTransferenciaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
