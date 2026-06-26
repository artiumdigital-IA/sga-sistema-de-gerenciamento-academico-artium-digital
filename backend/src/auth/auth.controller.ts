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
    return this.authService.login(req.user, totpToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna os dados do usuario autenticado (via JWT)' })
  me(@Request() req: any) {
    return req.user;
  }
}
