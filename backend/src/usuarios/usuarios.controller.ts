import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetSenhaDto } from './dto/reset-senha.dto';
import { MinhaSenhaDto } from './dto/minha-senha.dto';
import { UpdateMeuPerfilDto } from './dto/update-meu-perfil.dto';

const AVATAR_UPLOAD_DIR = './uploads/avatars';
const TIPOS_IMAGEM_PERMITIDOS = /\/(jpg|jpeg|png|webp)$/;

// Evita depender de @types/multer (nao instalado no projeto) para o tipo
// do arquivo recebido via multipart/form-data.
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

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  // ── Gestao de usuarios (ADMIN only) ─────────────────────────────────────

  @Roles(Perfil.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Criar usuario (ADMIN)' })
  create(@Body() dto: CreateUsuarioDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN, Perfil.SECRETARIA)
  @Get()
  @ApiOperation({ summary: 'Listar todos os usuarios (ADMIN/SECRETARIA — SECRETARIA precisa pra escolher destinatário de Mensagens)' })
  findAll() {
    return this.service.findAll();
  }

  // ── Auto-servico (qualquer autenticado) ─────────────────────────────────
  // IMPORTANTE: estas rotas literais ('me', 'me/senha', 'me/foto') precisam
  // vir ANTES das rotas com ':id' abaixo, senao o Nest tenta casar "me" como
  // se fosse um :id (Express casa por ordem de declaracao).

  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil completo do usuario autenticado' })
  meuPerfil(@Request() req: any) {
    return this.service.meuPerfil(req.user?.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar nome/telefone do proprio perfil (qualquer perfil)' })
  atualizarMeuPerfil(@Body() dto: UpdateMeuPerfilDto, @Request() req: any) {
    return this.service.atualizarMeuPerfil(req.user?.id, dto);
  }

  @Patch('me/senha')
  @ApiOperation({ summary: 'Alterar propria senha (qualquer perfil)' })
  alterarMinhaSenha(@Body() dto: MinhaSenhaDto, @Request() req: any) {
    return this.service.alterarMinhaSenha(req.user?.id, dto);
  }

  @Post('me/foto')
  @ApiOperation({ summary: 'Trocar foto de perfil (qualquer perfil)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: multer.diskStorage({
        destination: AVATAR_UPLOAD_DIR,
        filename: (req: any, file: ArquivoUpload, cb: (error: Error | null, filename: string) => void) => {
          const usuarioId = req.user?.id ?? 'anon';
          const sufixo = Date.now();
          cb(null, `${usuarioId}-${sufixo}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
      fileFilter: (_req: any, file: ArquivoUpload, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!TIPOS_IMAGEM_PERMITIDOS.test(file.mimetype)) {
          return cb(new BadRequestException('Envie uma imagem JPG, PNG ou WEBP.'), false);
        }
        cb(null, true);
      },
    }),
  )
  atualizarMinhaFoto(@UploadedFile() file: ArquivoUpload, @Request() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const fotoUrl = `/uploads/avatars/${file.filename}`;
    return this.service.atualizarMinhaFoto(req.user?.id, fotoUrl);
  }

  // ── Gestao de usuarios (ADMIN only) — rotas ':id' ───────────────────────

  @Roles(Perfil.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuario por ID (ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Perfil.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar perfil/status de usuario (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Post(':id/bloquear')
  @ApiOperation({ summary: 'Bloquear usuario (ADMIN)' })
  bloquear(@Param('id') id: string, @Request() req: any) {
    return this.service.bloquear(id, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Post(':id/ativar')
  @ApiOperation({ summary: 'Reativar usuario bloqueado (ADMIN)' })
  ativar(@Param('id') id: string, @Request() req: any) {
    return this.service.ativar(id, req.user?.id);
  }

  @Roles(Perfil.ADMIN)
  @Post(':id/resetar-senha')
  @ApiOperation({ summary: 'Resetar senha de qualquer usuario (ADMIN)' })
  resetarSenha(@Param('id') id: string, @Body() dto: ResetSenhaDto, @Request() req: any) {
    return this.service.resetarSenha(id, dto, req.user?.id);
  }
}
