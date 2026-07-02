import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RamalService } from './ramal.service';
import { CreateRamalDto } from './dto/create-ramal.dto';
import { UpdateRamalDto } from './dto/update-ramal.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

// Sem @Roles() no nível do controller: a leitura (GET) precisa estar aberta
// a qualquer autenticado (é o que alimenta o modal "Ramais" do BottomBar,
// visível pra Admin/Secretaria/Financeiro/Professor/Aluno). Só escrita
// (criar/editar/apagar) é restrita a ADMIN, decorada rota a rota.
@ApiTags('Ramais')
@ApiBearerAuth()
@Controller('ramais')
export class RamalController {
  constructor(private readonly service: RamalService) {}

  @Roles(Perfil.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Cadastrar ramal (ADMIN)' })
  create(@Body() dto: CreateRamalDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ramais (qualquer autenticado)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ramal por ID (qualquer autenticado)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Editar ramal (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateRamalDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remover ramal (ADMIN)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
