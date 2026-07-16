import { Controller, Get, Query, Res, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { Perfil } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';
import { RelatoriosMasterService } from './relatorios-master.service';

/**
 * Relatórios Master — exportação completa do banco (backup) e dos arquivos
 * enviados. Restrito só a MASTER (nem ADMIN) por ser um backup com dado
 * pessoal/financeiro da instituição inteira, incluindo credenciais no
 * dump SQL.
 */
@ApiTags('Relatórios Master')
@ApiBearerAuth()
@Roles(Perfil.MASTER)
@Controller('relatorios-master')
@Tela('relatorios-master')
export class RelatoriosMasterController {
  constructor(private readonly service: RelatoriosMasterService) {}

  @Get('dump-sql')
  @ApiOperation({ summary: 'Backup SQL completo (pg_dump) ou só schema' })
  @ApiQuery({ name: 'apenasSchema', required: false })
  async dumpSql(@Query('apenasSchema') apenasSchema: string | undefined, @Res() res: Response, @Request() req: any) {
    const schema = apenasSchema === 'true';
    await this.service.registrarExport(req.user.id, schema ? 'sql-schema' : 'sql-completo');
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${schema ? 'schema' : 'banco-completo'}.sql"`);
    await this.service.streamPgDump(schema, res);
  }

  @Get('dump-xlsx')
  @ApiOperation({ summary: 'Banco completo em XLSX (1 aba por tabela, credenciais redigidas)' })
  async dumpXlsx(@Res() res: Response, @Request() req: any) {
    await this.service.registrarExport(req.user.id, 'xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="banco-completo.xlsx"');
    await this.service.streamXlsx(res);
  }

  @Get('dump-xml')
  @ApiOperation({ summary: 'Banco completo em XML (credenciais redigidas)' })
  async dumpXml(@Res() res: Response, @Request() req: any) {
    await this.service.registrarExport(req.user.id, 'xml');
    const xml = await this.service.gerarXml();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="banco-completo.xml"');
    res.send(xml);
  }

  @Get('dump-json')
  @ApiOperation({ summary: 'Banco completo em JSON (credenciais redigidas)' })
  async dumpJson(@Res() res: Response, @Request() req: any) {
    await this.service.registrarExport(req.user.id, 'json');
    const dados = await this.service.gerarJson();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="banco-completo.json"');
    res.send(JSON.stringify(dados, null, 2));
  }

  @Get('uploads-zip')
  @ApiOperation({ summary: 'ZIP de tudo em uploads/ (avatars, documentos, capturas de prova, branding)' })
  async uploadsZip(@Res() res: Response, @Request() req: any) {
    await this.service.registrarExport(req.user.id, 'uploads-zip');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="uploads.zip"');
    await this.service.streamUploadsZip(res);
  }
}
