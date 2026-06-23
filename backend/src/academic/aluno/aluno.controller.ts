import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AlunoService } from './aluno.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@ApiTags('alunos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('alunos')
export class AlunoController {
  constructor(private readonly service: AlunoService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo aluno' })
  create(@Body() dto: CreateAlunoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiQuery({ name: 'cursoId', required: false })
  @ApiOperation({ summary: 'Listar alunos (opcional: filtrar por cursoId)' })
  findAll(@Query('cursoId') cursoId?: string) {
    return this.service.findAll(cursoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar aluno por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar aluno' })
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover aluno' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
