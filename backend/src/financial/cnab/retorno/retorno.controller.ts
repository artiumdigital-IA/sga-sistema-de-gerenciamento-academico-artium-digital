import { BadRequestException, Controller, Get, Post, Body, Param, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { RetornoService } from './retorno.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../../permissoes-tela/decorators/tela.decorator';

const UPLOAD_DIR = './uploads/cnab/retornos';

// Evita depender de @types/multer (não instalado no projeto) — mesmo padrão
// de backend/src/registry/documento-aluno/documento-aluno.controller.ts.
interface ArquivoUpload {
  fieldname: string; originalname: string; encoding: string; mimetype: string;
  size: number; destination: string; filename: string; path: string; buffer: Buffer;
}

@ApiTags('Financeiro — CNAB — Retornos')
@ApiBearerAuth()
@Controller('financeiro/cnab/retornos')
@Tela('cnab-retornos')
export class RetornoController {
  constructor(private readonly service: RetornoService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  @ApiOperation({ summary: 'Importar arquivo de retorno CNAB e processar as ocorrências (baixa automática)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          const sufixo = Date.now();
          cb(null, `retorno-${sufixo}${extname(file.originalname).toLowerCase() || '.txt'}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — arquivo CNAB é texto puro, bem menor que isso
    }),
  )
  importar(@Body('contaBancariaId') contaBancariaId: string, @UploadedFile() file: ArquivoUpload, @Request() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.importar(contaBancariaId, file, req.user.sub);
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
}
