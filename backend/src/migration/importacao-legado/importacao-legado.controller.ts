import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Perfil, StatusLinhaImportacao } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';
import { ImportacaoLegadoService } from './importacao-legado.service';

const UPLOAD_DIR = './uploads/importacao-legado';

// Evita depender de @types/multer (não instalado no projeto) — mesmo padrão
// de backend/src/registry/documento-aluno/documento-aluno.controller.ts.
interface ArquivoUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

/**
 * Análise (dry-run) de planilhas legadas — restrito a ADMIN/MASTER porque
 * lida com dado financeiro/pessoal histórico da instituição inteira, mesmo
 * critério já usado em Relatórios Master e Painel do Sistema.
 */
@ApiTags('Migração — Importação de Dados Legados')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.MASTER)
@Controller('migration/importacao-legado')
@Tela('importacao-legado')
export class ImportacaoLegadoController {
  constructor(private readonly service: ImportacaoLegadoService) {}

  @Post()
  @ApiOperation({ summary: 'Envia uma planilha legada e inicia a análise (dry-run — não grava dado financeiro real)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          const sufixo = Date.now();
          cb(null, `legado-${sufixo}${extname(file.originalname).toLowerCase() || '.xlsx'}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        const nomeOk = /\.xlsx?$/i.test(file.originalname);
        const mimeOk = /spreadsheetml|ms-excel/i.test(file.mimetype);
        if (!nomeOk && !mimeOk) {
          return cb(new BadRequestException('Envie um arquivo .xlsx ou .xls.'), false);
        }
        cb(null, true);
      },
    }),
  )
  criar(@UploadedFile() arquivo: ArquivoUpload, @Request() req: any) {
    if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.criarLote(req.user.id, arquivo);
  }

  @Get()
  @ApiOperation({ summary: 'Lista lotes de importação anteriores' })
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um lote (status + relatório agregado)' })
  buscarUm(@Param('id') id: string) {
    return this.service.buscarUm(id);
  }

  @Get(':id/linhas')
  @ApiOperation({ summary: 'Navega as linhas do lote, paginado e filtrável por status' })
  @ApiQuery({ name: 'status', required: false, enum: StatusLinhaImportacao })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  listarLinhas(
    @Param('id') id: string,
    @Query('status') status?: StatusLinhaImportacao,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.listarLinhas(
      id,
      status,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Exporta as linhas do lote (filtráveis por status) em CSV' })
  @ApiQuery({ name: 'status', required: false, enum: StatusLinhaImportacao })
  async exportar(
    @Param('id') id: string,
    @Query('status') status: StatusLinhaImportacao | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportarCsv(id, status);
    const sufixo = status ? `-${status}` : '';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="importacao-legado-${id}${sufixo}.csv"`);
    // BOM no início (String.fromCharCode — nunca literal, ver lição de
    // encoding do projeto) — sem isso o Excel abre acento errado em CSV UTF-8.
    res.send(String.fromCharCode(0xfeff) + csv);
  }
}
