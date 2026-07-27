import { Body, Controller, Get, Post, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';
import { DiscenteService } from './discente.service';
import { AbrirProtocoloDto } from './dto/abrir-protocolo.dto';
import { AbrirRequerimentoDto } from './dto/abrir-requerimento.dto';

const UPLOAD_DIR_REQUERIMENTOS = './uploads/requerimentos';
const TIPOS_PERMITIDOS = /\/(jpg|jpeg|png|webp|pdf)$/;

interface ArquivoUpload {
  originalname: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Autoatendimento do aluno ("Menu Discente" — ver components/dashboard/RightPanel.tsx
 * no frontend). Todo o controller é restrito ao perfil ALUNO: cada rota resolve o
 * Aluno do próprio usuário autenticado (nunca recebe alunoId por parâmetro), então um
 * aluno nunca consegue ver dado de outro só trocando um ID na URL.
 *
 * Cada rota (exceto "painel", que é o resumo carregado por qualquer ALUNO autenticado,
 * igual ao Painel inicial pros demais perfis) tem seu próprio @Tela(), permitindo à
 * secretaria/admin ativar/desativar cada sub-item do Menu Discente independentemente
 * na matriz de Permissões de Tela (/dashboard/admin/permissoes).
 */
@ApiTags('Discente (Autoatendimento do Aluno)')
@ApiBearerAuth()
@Roles(Perfil.ALUNO)
@Controller('discente')
export class DiscenteController {
  constructor(private readonly service: DiscenteService) {}

  @Get('painel')
  @ApiOperation({ summary: 'Resumo do Menu Discente: dados básicos, progresso no curso, CR/integralização, pendências' })
  painel(@Request() req: any) {
    return this.service.painel(req.user.id);
  }

  @Tela('discente-horarios')
  @Get('horarios')
  @ApiOperation({ summary: 'Quadro de Horários do próprio aluno' })
  horarios(@Request() req: any) {
    return this.service.horarios(req.user.id);
  }

  @Tela('discente-documentos')
  @Get('documentos')
  @ApiOperation({ summary: 'Pendências e documentos já enviados do próprio aluno' })
  documentos(@Request() req: any) {
    return this.service.documentos(req.user.id);
  }

  @Tela('discente-protocolo')
  @Get('protocolo/tipos')
  @ApiOperation({ summary: 'Tipos de protocolo ativos (formulário de abertura)' })
  tiposProtocolo() {
    return this.service.tiposProtocolo();
  }

  @Tela('discente-protocolo')
  @Get('protocolo')
  @ApiOperation({ summary: 'Meus protocolos (abertura/consulta)' })
  meusProtocolos(@Request() req: any) {
    return this.service.meusProtocolos(req.user.id);
  }

  @Tela('discente-protocolo')
  @Post('protocolo')
  @ApiOperation({ summary: 'Abrir novo protocolo em meu nome' })
  abrirProtocolo(@Body() dto: AbrirProtocoloDto, @Request() req: any) {
    return this.service.abrirProtocolo(req.user.id, dto);
  }

  @Tela('discente-carteira')
  @Get('carteira')
  @ApiOperation({ summary: 'Minha Carteira de Estudante (dados + QR de validação)' })
  carteira(@Request() req: any) {
    return this.service.carteira(req.user.id);
  }

  @Tela('discente-disciplinas')
  @Get('disciplinas')
  @ApiOperation({ summary: 'Minhas disciplinas e avaliações do período atual' })
  disciplinas(@Request() req: any) {
    return this.service.disciplinas(req.user.id);
  }

  @Tela('discente-historico')
  @Get('historico')
  @ApiOperation({ summary: 'Minhas notas e histórico acadêmico (CR + integralização)' })
  historico(@Request() req: any) {
    return this.service.historico(req.user.id);
  }

  @Tela('discente-financeiro')
  @Get('financeiro')
  @ApiOperation({ summary: 'Meus contratos e parcelas (somente leitura)' })
  financeiro(@Request() req: any) {
    return this.service.financeiro(req.user.id);
  }

  @Tela('discente-aac')
  @Get('horas-complementares')
  @ApiOperation({ summary: 'Minhas horas complementares (feitas/total do curso) + lançamentos' })
  horasComplementares(@Request() req: any) {
    return this.service.horasComplementares(req.user.id);
  }

  @Tela('discente-requerimentos')
  @Get('requerimentos/tipos')
  @ApiOperation({ summary: 'Tabela de preços dos requerimentos (só os ativos)' })
  tiposRequerimento() {
    return this.service.tiposRequerimento();
  }

  @Tela('discente-requerimentos')
  @Get('requerimentos')
  @ApiOperation({ summary: 'Meus requerimentos (abertura/consulta)' })
  meusRequerimentos(@Request() req: any) {
    return this.service.meusRequerimentos(req.user.id);
  }

  @Tela('discente-requerimentos')
  @Post('requerimentos')
  @ApiOperation({ summary: 'Abrir novo requerimento a partir da tabela de preços (anexo obrigatório pra tipos com exigeAnexo, ex: Hora Complementar)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multer.diskStorage({
        destination: UPLOAD_DIR_REQUERIMENTOS,
        filename: (_req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_PERMITIDOS.test(file.mimetype)) {
          return cb(new Error('Envie um arquivo PDF, JPG, PNG ou WEBP.'), false);
        }
        cb(null, true);
      },
    }),
  )
  abrirRequerimento(@Body() dto: AbrirRequerimentoDto, @UploadedFile() arquivo: ArquivoUpload | undefined, @Request() req: any) {
    return this.service.abrirRequerimento(req.user.id, dto, arquivo);
  }
}
