import { Body, Controller, Delete, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';
import { RegistrarTokenDto } from './dto/registrar-token.dto';

/**
 * Sem @Roles() nem @Tela() de propósito — qualquer perfil autenticado pode
 * registrar o próprio token de push (hoje só o app do aluno usa, mas nada
 * impede o app/portal de outro perfil usar no futuro). Nunca aceita
 * usuarioId por parâmetro, sempre o do JWT (req.user.id).
 */
@ApiTags('Push Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly service: PushService) {}

  @Post('token')
  @ApiOperation({ summary: 'Registrar (ou atualizar) o Expo push token do dispositivo do usuário autenticado' })
  registrar(@Body() dto: RegistrarTokenDto, @Request() req: any) {
    return this.service.registrarToken(req.user.id, dto.token, dto.plataforma);
  }

  @Delete('token/:token')
  @ApiOperation({ summary: 'Remover um token (ex.: logout do dispositivo)' })
  remover(@Param('token') token: string) {
    return this.service.removerToken(token);
  }
}
