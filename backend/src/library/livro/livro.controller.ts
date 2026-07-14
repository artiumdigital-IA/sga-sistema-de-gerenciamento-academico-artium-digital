import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LivroService } from './livro.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';
import { CreateExemplarDto } from './dto/create-exemplar.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Sem @Roles() no nível do controller: a leitura do acervo (GET) fica aberta a
// qualquer autenticado, incluindo ALUNO (uma biblioteca sem consulta pública
// ao catálogo não serve pra nada). Só escrita (cadastrar/editar/remover livro
// e exemplares) é restrita a ADMIN/SECRETARIA, decorada rota a rota.
@ApiTags('Biblioteca — Acervo')
@ApiBearerAuth()
@Tela('biblioteca-acervo')
@Controller('biblioteca/livros')
export class LivroController {
  constructor(private readonly service: LivroService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post()
  @ApiOperation({ summary: 'Cadastrar livro no acervo' })
  create(@Body() dto: CreateLivroDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiQuery({ name: 'busca', required: false })
  @ApiOperation({ summary: 'Listar acervo (busca por título/autor/categoria)' })
  findAll(@Query('busca') busca?: string) {
    return this.service.findAll(busca);
  }

  @Get('exemplares/:exemplarId')
  @ApiOperation({ summary: 'Detalhar exemplar + dados do livro (usado pela etiqueta imprimível)' })
  findExemplar(@Param('exemplarId') exemplarId: string) {
    return this.service.findExemplar(exemplarId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar livro (com exemplares)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Patch(':id')
  @ApiOperation({ summary: 'Editar livro' })
  update(@Param('id') id: string, @Body() dto: UpdateLivroDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id')
  @ApiOperation({ summary: 'Remover livro (bloqueado se houver exemplar emprestado)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Post(':id/exemplares')
  @ApiOperation({ summary: 'Adicionar exemplar físico ao livro' })
  addExemplar(@Param('id') id: string, @Body() dto: CreateExemplarDto, @Request() req: any) {
    return this.service.addExemplar(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Delete(':id/exemplares/:exemplarId')
  @ApiOperation({ summary: 'Remover exemplar físico (bloqueado se emprestado)' })
  removeExemplar(@Param('id') id: string, @Param('exemplarId') exemplarId: string, @Request() req: any) {
    return this.service.removeExemplar(id, exemplarId, req.user?.id);
  }
}
