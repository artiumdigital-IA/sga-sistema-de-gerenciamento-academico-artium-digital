import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname, join } from 'path';
import { unlink } from 'fs/promises';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';
import { BrandingService } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

const BRANDING_UPLOAD_DIR = './uploads/branding';
const TIPOS_IMAGEM_PERMITIDOS = /\/(jpg|jpeg|png|webp|svg\+xml)$/;

// Evita depender de @types/multer (nao instalado no projeto) para o tipo
// do arquivo recebido via multipart/form-data — mesmo padrao ja usado em
// usuarios.controller.ts.
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

@ApiTags('Branding')
@Controller('branding')
export class BrandingController {
  constructor(private readonly service: BrandingService) {}

  // Deliberadamente SEM @Tela() -- publico, usado ate na tela de login
  // (antes de existir usuario autenticado pra ter perfil nenhum).
  @Public()
  @Get()
  @ApiOperation({ summary: 'Configuração visual da instituição (nome, logo, símbolo, cores) — público, usado até na tela de login' })
  getConfig() {
    return this.service.getConfig();
  }

  // @Tela('visual') abaixo -- correspondem a tela "Identidade Visual"
  // (/dashboard/admin/visual) da matriz de Permissoes de Tela.

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Tela('visual')
  @Put()
  @ApiOperation({ summary: 'Atualizar nome/cores da instituição (ADMIN)' })
  update(@Body() dto: UpdateBrandingDto, @Request() req: any) {
    return this.service.update(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Tela('visual')
  @Post('logo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar logo da instituição (ADMIN)' })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: BRANDING_UPLOAD_DIR,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `logo-${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_IMAGEM_PERMITIDOS.test(file.mimetype)) {
          return cb(new BadRequestException('Envie uma imagem JPG, PNG, WEBP ou SVG.'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadLogo(@UploadedFile() file: ArquivoUpload, @Request() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.atualizarLogo(`/uploads/branding/${file.filename}`, req.user?.id);
  }

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Tela('visual')
  @Post('simbolo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar símbolo/ícone da instituição — usado como favicon (ADMIN)' })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: BRANDING_UPLOAD_DIR,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `simbolo-${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_IMAGEM_PERMITIDOS.test(file.mimetype)) {
          return cb(new BadRequestException('Envie uma imagem JPG, PNG, WEBP ou SVG.'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadSimbolo(@UploadedFile() file: ArquivoUpload, @Request() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.atualizarSimbolo(`/uploads/branding/${file.filename}`, req.user?.id);
  }

  // ── Galeria de Publicidade (imagens do /dashboard do aluno) ────────────
  // As imagens em si já vêm públicas dentro de GET /branding (mesmo padrão
  // de logo/símbolo) — só a gestão (enviar/ativar/desativar/remover) é
  // restrita ao ADMIN, atrás da mesma tela "Identidade Visual".

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Tela('visual')
  @Post('galeria')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar nova imagem pra galeria de publicidade do dashboard do aluno (ADMIN)' })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: BRANDING_UPLOAD_DIR,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `galeria-${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_IMAGEM_PERMITIDOS.test(file.mimetype)) {
          return cb(new BadRequestException('Envie uma imagem JPG, PNG, WEBP ou SVG.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImagemGaleria(@UploadedFile() file: ArquivoUpload, @Request() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.adicionarImagemGaleria(`/uploads/branding/${file.filename}`, req.user?.id);
  }

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Tela('visual')
  @Patch('galeria/:id')
  @ApiOperation({ summary: 'Ativar/desativar, reordenar ou definir o link de clique de uma imagem da galeria (ADMIN)' })
  atualizarImagemGaleria(
    @Param('id') id: string,
    @Body() dto: { ativa?: boolean; ordem?: number; link?: string | null },
    @Request() req: any,
  ) {
    return this.service.atualizarImagemGaleria(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Tela('visual')
  @Delete('galeria/:id')
  @ApiOperation({ summary: 'Remover imagem da galeria de publicidade (ADMIN)' })
  async removerImagemGaleria(@Param('id') id: string, @Request() req: any) {
    const { lista, urlRemovida } = await this.service.removerImagemGaleria(id, req.user?.id);
    try {
      const nomeArquivo = urlRemovida.split('/').pop();
      if (nomeArquivo) await unlink(join(process.cwd(), 'uploads', 'branding', nomeArquivo));
    } catch {
      /* arquivo já ausente do disco — segue o fluxo, o registro já foi removido do JSON */
    }
    return lista;
  }
}
