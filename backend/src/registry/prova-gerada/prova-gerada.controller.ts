import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProvaGeradaService } from './prova-gerada.service';
import { CriarProvaGeradaDto } from './dto/criar-prova-gerada.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

type Req = { user: { id: string; perfil: string } };

/**
 * Gerador de Prova — criar/"minhas provas" são autoatendimento do professor
 * (`@Tela('docente-gerador-prova')`, mesmo grupo "Menu Docente" de
 * Captura de Prova/Aviso de Turma). Listar todas é a tela "Provas Geradas"
 * da Secretaria (`@Tela('provas-geradas')`). Buscar uma prova é a única
 * rota compartilhada pelos dois públicos — usada tanto pelo professor pra
 * reimprimir a própria prova quanto pela Secretaria/Admin pra imprimir
 * qualquer uma; o ownership (professor só vê a sua) é checado no service,
 * não no @Roles().
 */
@ApiTags('Gerador de Prova')
@ApiBearerAuth()
@Controller('provas-geradas')
export class ProvaGeradaController {
  constructor(private readonly service: ProvaGeradaService) {}

  @Roles(Perfil.PROFESSOR)
  @Tela('docente-gerador-prova')
  @Post()
  @ApiOperation({ summary: 'Gerar uma nova prova (cabeçalho + questões)' })
  criar(@Body() dto: CriarProvaGeradaDto, @Request() req: Req) {
    return this.service.criar(req.user.id, dto);
  }

  @Roles(Perfil.PROFESSOR)
  @Tela('docente-gerador-prova')
  @Get('minhas')
  @ApiOperation({ summary: 'Provas geradas por mim' })
  minhas(@Request() req: Req) {
    return this.service.minhas(req.user.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('provas-geradas')
  @Get()
  @ApiOperation({ summary: 'Todas as provas geradas, de qualquer professor (Secretaria)' })
  listarTodas() {
    return this.service.listarTodas();
  }

  @Roles(Perfil.PROFESSOR, Perfil.ADMIN, Perfil.SECRETARIA)
  @Tela('provas-geradas')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma prova gerada (pra imprimir)' })
  buscarUma(@Param('id') id: string, @Request() req: Req) {
    return this.service.buscarUma(id, req.user);
  }
}
