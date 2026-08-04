import { Controller, Get, Post, Body, Param, Patch, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { CreateContratoDto } from './contrato.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Financeiro — Contratos')
@ApiBearerAuth()
@Controller('financeiro/contratos')
@Tela('contratos')
export class ContratoController {
  constructor(private readonly service: ContratoService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Criar contrato + gerar parcelas' })
  create(@Body() dto: CreateContratoDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Listar contratos (paginado, com busca por nome/RA)' })
  findAll(
    @Query('alunoId') alunoId?: string,
    @Query('periodoLetivoId') periodoLetivoId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      alunoId,
      periodoLetivoId,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // Rota literal ANTES de ":id" -- mesmo cuidado de sempre (Nest/Express casa
  // por ordem de declaração). Usada pela tela de emissão de Boleto (CNAB),
  // que precisa da lista completa (com parcelas + status do boleto) de UM
  // aluno pra escolher qual parcela emitir -- volume naturalmente pequeno,
  // não precisa da paginação/resumo do findAll() usado na listagem geral.
  @Get('aluno/:alunoId')
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Contratos completos (com parcelas) de um aluno' })
  findAllPorAluno(@Param('alunoId') alunoId: string) {
    return this.service.findAllCompletoPorAluno(alunoId);
  }

  @Get(':id')
  @Roles(Perfil.ADMIN, Perfil.SECRETARIA, Perfil.FINANCEIRO)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id/status')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.updateStatus(id, status, req.user.id);
  }
}
