import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.status !== 'ATIVO') return null;
    const valido = await bcrypt.compare(senha, usuario.senhaHash);
    if (!valido) return null;
    const { senhaHash, mfaSegredo, ...result } = usuario;
    return result;
  }

  async login(usuario: { id: string; email: string; perfil: string; mfaAtivo: boolean }, totpToken?: string) {
    // Perfis que exigem MFA
    const mfaObrigatorio = ['ADMIN', 'SECRETARIA', 'FINANCEIRO'];

    if (mfaObrigatorio.includes(usuario.perfil) && usuario.mfaAtivo) {
      if (!totpToken) {
        throw new UnauthorizedException('Código MFA obrigatório para este perfil.');
      }
      const u = await this.prisma.usuario.findUnique({ where: { id: usuario.id } });
      if (!u?.mfaSegredo) throw new UnauthorizedException('MFA não configurado.');
      const valido = authenticator.verify({ token: totpToken, secret: u.mfaSegredo });
      if (!valido) throw new UnauthorizedException('Código MFA inválido.');
    }

    const payload = { sub: usuario.id, email: usuario.email, perfil: usuario.perfil };
    return { accessToken: this.jwt.sign(payload) };
  }

  async hashSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, 12);
  }
}
