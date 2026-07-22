import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login com e-mail/senha (+ MFA para Admin/Secretaria/Financeiro)' })
  async login(@Request() req: any, @Body('totpToken') totpToken?: string) {
    const ip = req.ip ?? req.headers?.['x-forwarded-for'] ?? null;
    const userAgent = req.headers?.['user-agent'] ?? null;
    return this.authService.login(req.user, totpToken, ip, userAgent);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna os dados do usuario autenticado (via JWT)' })
  me(@Request() req: any) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mfa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gera um segredo TOTP novo (pendente) + QR code para ativar o MFA' })
  setupMfa(@Request() req: any) {
    return this.authService.gerarSetupMfa(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mfa/ativar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirma o setup de MFA com o 1º código gerado pelo app autenticador' })
  ativarMfa(@Request() req: any, @Body('totpToken') totpToken: string) {
    return this.authService.ativarMfa(req.user.id, totpToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mfa/desativar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativa o MFA (exige senha atual)' })
  desativarMfa(@Request() req: any, @Body('senha') senha: string) {
    return this.authService.desativarMfa(req.user.id, senha);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mfa/recovery-codes/regenerar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gera um novo lote de códigos de recuperação, invalidando os antigos (exige senha atual)' })
  regerarCodigosRecuperacao(@Request() req: any, @Body('senha') senha: string) {
    return this.authService.regerarCodigosRecuperacao(req.user.id, senha);
  }
}
