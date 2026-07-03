import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'senha', passReqToCallback: true });
  }

  async validate(req: any, email: string, senha: string) {
    const ip = req?.ip ?? req?.headers?.['x-forwarded-for'] ?? null;
    const userAgent = req?.headers?.['user-agent'] ?? null;
    const usuario = await this.authService.validateUser(email, senha, ip, userAgent);
    if (!usuario) throw new UnauthorizedException('Credenciais invalidas.');
    return usuario;
  }
}
