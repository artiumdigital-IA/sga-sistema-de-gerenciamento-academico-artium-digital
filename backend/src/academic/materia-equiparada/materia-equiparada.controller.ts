import { Controller, Get, Post, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MateriaEquiparadaService } from './materia-equiparada.service';
import { CreateMateriaEquiparadaDto } from './dto/create-materia-equiparada.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Matérias Equiparadas')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('materias-equiparadas')
@Tela('alunos')
export class MateriaEquiparadaController {
  constructor(private readonly service: MateriaEquiparadaService) {}

  @Get(':alunoId')
  @ApiOperation({ summary: 'Listar equiparações de disciplina do aluno' })
  findByAluno(@Param('alunoId') alunoId: string) {
    return this.service.findByAluno(alunoId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar equiparação de disciplina' })
  create(@Body() dto: CreateMateriaEquiparadaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover equiparação' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
