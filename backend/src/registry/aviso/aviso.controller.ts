import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';
import { AvisoService } from './aviso.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@UseGuards(JwtAuthGuard)
@Controller('avisos')
export class AvisoController {
  constructor(private readonly service: AvisoService) {}

  // Deliberadamente SEM @Tela() -- alimenta o widget "Boletim Diário" do
  // Painel inicial pra qualquer perfil, além da tela dedicada de Avisos.
  // req.user repassado pro service filtrar aviso de turma quando ALUNO
  // (ver AvisoService.findAll) -- outros perfis continuam vendo tudo.
  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Tela('avisos')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('avisos')
  @Post()
  create(@Body() dto: CreateAvisoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('avisos')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAvisoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('avisos')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
