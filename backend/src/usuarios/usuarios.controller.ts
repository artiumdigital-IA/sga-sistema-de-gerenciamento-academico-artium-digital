import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetSenhaDto } from './dto/reset-senha.dto';
import { MinhaSenhaDto } from './dto/minha-senha.dto';

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

  @Roles(Perfil.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar todos os usuarios (ADMIN)' })
  findAll() {
    return this.service.findAll();
  }

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

  // ── Auto-servico (qualquer autenticado) ─────────────────────────────────

  @Patch('me/senha')
  @ApiOperation({ summary: 'Alterar propria senha (qualquer perfil)' })
  alterarMinhaSenha(@Body() dto: MinhaSenhaDto, @Request() req: any) {
    return this.service.alterarMinhaSenha(req.user?.id, dto);
  }
}
