import { Controller, Get, Post, Body, Param, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RemessaService } from './remessa.service';
import { CreateRemessaDto } from './dto/create-remessa.dto';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../../permissoes-tela/decorators/tela.decorator';

@ApiTags('Financeiro — CNAB — Remessas')
@ApiBearerAuth()
@Controller('financeiro/cnab/remessas')
@Tela('cnab-remessas')
export class RemessaController {
  constructor(private readonly service: RemessaService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Gerar remessa CNAB a partir dos boletos EMITIDO de uma conta' })
  gerar(@Body() dto: CreateRemessaDto, @Request() req: any) {
    return this.service.gerar(dto, req.user.sub);
  }

  @Post('baixa')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Gerar remessa de baixa/cancelamento pros boletos já enviados/registrados' })
  gerarBaixa(@Body() dto: CreateRemessaDto, @Request() req: any) {
    return this.service.gerarBaixa(dto, req.user.sub);
  }

  @Get()
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/download')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Baixar o arquivo de remessa gerado' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { caminho, nomeArquivo } = await this.service.caminhoArquivo(id);
    res.download(caminho, nomeArquivo);
  }
}
