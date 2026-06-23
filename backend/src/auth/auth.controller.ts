import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login com e-mail/senha (+ MFA para Admin/Secretaria/Financeiro)' })
  async login(@Request() req: any, @Body('totpToken') totpToken?: string) {
    return this.authService.login(req.user, totpToken);
  }
}
