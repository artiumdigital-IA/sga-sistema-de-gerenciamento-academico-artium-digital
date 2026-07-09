import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentoAlunoService } from './documento-aluno.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

const UPLOAD_DIR = './uploads/documentos';
const TIPOS_PERMITIDOS = /\/(jpg|jpeg|png|webp|pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;

// Evita depender de @types/multer (nao instalado no projeto).
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

@ApiTags('Documentos do Aluno (Digitalização)')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('documentos-aluno')
@Tela('alunos')
export class DocumentoAlunoController {
  constructor(private readonly service: DocumentoAlunoService) {}

  @Get(':alunoId')
  @ApiOperation({ summary: 'Listar documentos digitalizados do aluno' })
  findByAluno(@Param('alunoId') alunoId: string) {
    return this.service.findByAluno(alunoId);
  }

  @Post(':alunoId')
  @ApiOperation({ summary: 'Enviar documento digitalizado do aluno' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          const alunoId = req.params?.alunoId ?? 'aluno';
          const sufixo = Date.now();
          cb(null, `${alunoId}-${sufixo}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_PERMITIDOS.test(file.mimetype)) {
          return cb(new BadRequestException('Envie um arquivo PDF, DOC/DOCX, JPG, PNG ou WEBP.'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Param('alunoId') alunoId: string,
    @Body('tipo') tipo: string,
    @UploadedFile() file: ArquivoUpload,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    if (!tipo) throw new BadRequestException('Informe o tipo do documento.');
    return this.service.create(alunoId, tipo, file, req.user?.id);
  }

  @Delete('arquivo/:id')
  @ApiOperation({ summary: 'Remover documento digitalizado' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
