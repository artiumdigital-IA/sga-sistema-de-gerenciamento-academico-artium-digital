import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MotivoOcorrenciaService } from './motivo-ocorrencia.service';
import { CreateMotivoOcorrenciaDto } from './dto/create-motivo-ocorrencia.dto';
import { UpdateMotivoOcorrenciaDto } from './dto/update-motivo-ocorrencia.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Motivos de Ocorrência')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('motivos-ocorrencia')
@Tela('motivos-ocorrencia')
export class MotivoOcorrenciaController {
  constructor(private readonly service: MotivoOcorrenciaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar motivo de ocorrência' })
  create(@Body() dto: CreateMotivoOcorrenciaDto, @Request() req: any) {
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
  update(@Param('id') id: string, @Body() dto: UpdateMotivoOcorrenciaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
