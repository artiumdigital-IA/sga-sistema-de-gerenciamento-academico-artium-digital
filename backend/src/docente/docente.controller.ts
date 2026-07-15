import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';
import { DocenteService } from './docente.service';
import { CriarCapturaProvaDto } from './dto/criar-captura-prova.dto';
import { CriarAvisoTurmaDto } from './dto/criar-aviso-turma.dto';

const UPLOAD_DIR = './uploads/capturas-prova';
const TIPOS_PERMITIDOS = /\/(jpg|jpeg|png|webp|pdf)$/;

interface ArquivoUpload {
  originalname: string;
  filename: string;
  size: number;
  mimetype: string;
}

@ApiTags('Docente (Autoatendimento do Professor)')
@ApiBearerAuth()
@Roles(Perfil.PROFESSOR)
@Controller('docente')
export class DocenteController {
  constructor(private readonly service: DocenteService) {}

  @Get('ofertas')
  @ApiOperation({ summary: 'Minhas turmas — alimenta os seletores das outras telas do Menu Docente' })
  minhasOfertas(@Request() req: any) {
    return this.service.minhasOfertas(req.user.id);
  }

  @Tela('docente-alunos')
  @Get('alunos')
  @ApiOperation({ summary: 'Alunos matriculados nas minhas turmas' })
  meusAlunos(@Query('ofertaId') ofertaId: string | undefined, @Request() req: any) {
    return this.service.meusAlunos(req.user.id, ofertaId);
  }

  @Tela('docente-captura-prova')
  @Get('captura-prova')
  @ApiOperation({ summary: 'Minhas capturas de prova já enviadas' })
  listarCapturas(
    @Query('ofertaId') ofertaId: string | undefined,
    @Query('alunoId') alunoId: string | undefined,
    @Request() req: any,
  ) {
    return this.service.listarCapturas(req.user.id, { ofertaId, alunoId });
  }

  @Tela('docente-captura-prova')
  @Post('captura-prova')
  @ApiOperation({ summary: 'Enviar foto/PDF da prova física corrigida de um aluno' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_PERMITIDOS.test(file.mimetype)) {
          return cb(new BadRequestException('Envie um arquivo PDF, JPG, PNG ou WEBP.'), false);
        }
        cb(null, true);
      },
    }),
  )
  criarCaptura(@Body() dto: CriarCapturaProvaDto, @UploadedFile() arquivo: ArquivoUpload, @Request() req: any) {
    if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.criarCaptura(req.user.id, dto.alunoId, dto.ofertaId, dto.observacoes, arquivo);
  }

  @Tela('docente-captura-prova')
  @Delete('captura-prova/:id')
  @ApiOperation({ summary: 'Remover uma captura de prova enviada por mim' })
  removerCaptura(@Param('id') id: string, @Request() req: any) {
    return this.service.removerCaptura(req.user.id, id);
  }

  @Tela('docente-aviso-turma')
  @Get('aviso-turma')
  @ApiOperation({ summary: 'Avisos de turma que já enviei' })
  listarAvisosTurma(@Request() req: any) {
    return this.service.listarAvisosTurma(req.user.id);
  }

  @Tela('docente-aviso-turma')
  @Post('aviso-turma')
  @ApiOperation({ summary: 'Enviar aviso para os alunos de uma turma (com push notification no app)' })
  criarAvisoTurma(@Body() dto: CriarAvisoTurmaDto, @Request() req: any) {
    return this.service.criarAvisoTurma(req.user.id, dto);
  }
}
