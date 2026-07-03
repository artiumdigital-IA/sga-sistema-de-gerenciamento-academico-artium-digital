import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
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

  @Public()
  @Get()
  @ApiOperation({ summary: 'Configuração visual da instituição (nome, logo, símbolo, cores) — público, usado até na tela de login' })
  getConfig() {
    return this.service.getConfig();
  }

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
  @Put()
  @ApiOperation({ summary: 'Atualizar nome/cores da instituição (ADMIN)' })
  update(@Body() dto: UpdateBrandingDto, @Request() req: any) {
    return this.service.update(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @Roles(Perfil.ADMIN)
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
}
