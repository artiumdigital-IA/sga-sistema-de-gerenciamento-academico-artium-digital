import { Controller, Get, Post, Patch, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FolhaPagamentoService } from './folha-pagamento.service';
import { CreateFolhaDto } from './dto/create-folha.dto';
import { CreateItemFolhaDto } from './dto/create-item-folha.dto';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Folha de Pagamento')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/folhas')
@Tela('cpagar-folha')
export class FolhaPagamentoController {
  constructor(private readonly service: FolhaPagamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Abrir folha de pagamento pra uma competência (mês/ano)' })
  create(@Body() dto: CreateFolhaDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/itens')
  @ApiOperation({ summary: 'Lançar professor ou colaborador na folha — calcula INSS/IRRF/FGTS na hora' })
  adicionarItem(@Param('id') id: string, @Body() dto: CreateItemFolhaDto, @Request() req: any) {
    return this.service.adicionarItem(id, dto, req.user?.sub);
  }

  @Post(':id/itens/:itemId/lancamentos')
  @ApiOperation({ summary: 'Provento ou desconto avulso num item da folha' })
  adicionarLancamento(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: CreateLancamentoDto, @Request() req: any) {
    return this.service.adicionarLancamento(id, itemId, dto, req.user?.sub);
  }

  @Patch(':id/itens/:itemId/pagar')
  marcarItemPago(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) {
    return this.service.marcarItemPago(id, itemId, req.user?.sub);
  }

  @Patch(':id/fechar')
  @ApiOperation({ summary: 'Fechar a folha (não permite mais lançar itens)' })
  fechar(@Param('id') id: string, @Request() req: any) {
    return this.service.fechar(id, req.user?.sub);
  }
}
