import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RamalService } from './ramal.service';
import { CreateRamalDto } from './dto/create-ramal.dto';
import { UpdateRamalDto } from './dto/update-ramal.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Sem @Roles() no nível do controller: a leitura (GET) precisa estar aberta
// a qualquer autenticado (é o que alimenta o modal "Ramais" do BottomBar,
// visível pra Admin/Secretaria/Financeiro/Professor/Aluno). Só escrita
// (criar/editar/apagar) é restrita a ADMIN, decorada rota a rota.
//
// Pelo mesmo motivo, GET também fica SEM @Tela('ramais') -- gatear a
// leitura quebraria o modal global do BottomBar pra qualquer perfil com a
// tela "Ramais" desabilitada. Só a gestão (criar/editar/apagar), que já é
// ADMIN-only, ganha @Tela('ramais').
@ApiTags('Ramais')
@ApiBearerAuth()
@Controller('ramais')
export class RamalController {
  constructor(private readonly service: RamalService) {}

  @Roles(Perfil.ADMIN)
  @Tela('ramais')
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
  @Tela('ramais')
  @Patch(':id')
  @ApiOperation({ summary: 'Editar ramal (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateRamalDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Tela('ramais')
  @Delete(':id')
  @ApiOperation({ summary: 'Remover ramal (ADMIN)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
