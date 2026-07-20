import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EmprestimoService } from './emprestimo.service';
import { CreateEmprestimoDto } from './dto/create-emprestimo.dto';
import { DevolverEmprestimoDto } from './dto/devolver-emprestimo.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

// Registrar/consultar-todos/devolver é operação de balcão, restrita a
// ADMIN/SECRETARIA/SUPORTE. "meus" é autoatendimento (sem @Roles — qualquer
// autenticado consulta só os próprios empréstimos, resolvido via req.user.id,
// nunca por parâmetro — mesmo cuidado de IDOR já usado em DiscenteController).
//
// Rotas literais ("meus", "relatorio/resumo") declaradas ANTES de ":id" —
// Nest/Express casa por ordem de declaração (mesmo cuidado documentado em
// outros controllers do projeto, ex: usuarios.controller.ts).
@ApiTags('Biblioteca — Empréstimos')
@ApiBearerAuth()
@Tela('biblioteca-emprestimos')
@Controller('biblioteca/emprestimos')
export class EmprestimoController {
  constructor(private readonly service: EmprestimoService) {}

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Post()
  @ApiOperation({ summary: 'Registrar empréstimo de livro ou equipamento' })
  create(@Body() dto: CreateEmprestimoDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tipoItem', required: false })
  @ApiQuery({ name: 'usuarioId', required: false })
  @ApiQuery({ name: 'atrasados', required: false, type: Boolean })
  @ApiOperation({ summary: 'Listar todos os empréstimos (com filtros)' })
  findAll(
    @Query('status') status?: string,
    @Query('tipoItem') tipoItem?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('atrasados') atrasados?: string,
  ) {
    return this.service.findAll({ status, tipoItem, usuarioId, atrasados: atrasados === 'true' });
  }

  @Get('meus')
  @ApiOperation({ summary: 'Meus empréstimos (autoatendimento — aluno ou professor)' })
  meus(@Request() req: any) {
    return this.service.meus(req.user.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Get('relatorio/resumo')
  @ApiOperation({ summary: 'Resumo do acervo/equipamentos + livros mais emprestados' })
  relatorio() {
    return this.service.relatorioResumo();
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Get(':id')
  @ApiOperation({ summary: 'Detalhar empréstimo' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.SUPORTE)
  @Patch(':id/devolver')
  @ApiOperation({ summary: 'Registrar devolução (ou marcar como extraviado)' })
  devolver(@Param('id') id: string, @Body() dto: DevolverEmprestimoDto, @Request() req: any) {
    return this.service.devolver(id, dto, req.user?.id);
  }
}
