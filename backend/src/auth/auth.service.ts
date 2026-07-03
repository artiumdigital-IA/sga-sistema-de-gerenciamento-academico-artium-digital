import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async validateUser(email: string, senha: string, ip?: string | null, userAgent?: string | null) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.status !== 'ATIVO') {
      await this.audit.log({
        acao: 'LOGIN_FALHA',
        entidade: 'Usuario',
        dadosDepois: { email, motivo: !usuario ? 'usuario_nao_encontrado' : 'usuario_inativo_ou_bloqueado' },
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      });
      return null;
    }

    const valido = await bcrypt.compare(senha, usuario.senhaHash);
    if (!valido) {
      await this.audit.log({
        usuarioId: usuario.id,
        acao: 'LOGIN_FALHA',
        entidade: 'Usuario',
        entidadeId: usuario.id,
        dadosDepois: { email, motivo: 'senha_invalida' },
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      });
      return null;
    }

    const { senhaHash, mfaSegredo, ...result } = usuario;
    return result;
  }

  async login(
    usuario: { id: string; email: string; perfil: string; mfaAtivo: boolean },
    totpToken?: string,
    ip?: string | null,
    userAgent?: string | null,
  ) {
    // Perfis que exigem MFA
    const mfaObrigatorio = ['ADMIN', 'SECRETARIA', 'FINANCEIRO'];

    if (mfaObrigatorio.includes(usuario.perfil) && usuario.mfaAtivo) {
      if (!totpToken) {
        await this.audit.log({
          usuarioId: usuario.id, acao: 'LOGIN_FALHA', entidade: 'Usuario', entidadeId: usuario.id,
          dadosDepois: { email: usuario.email, motivo: 'mfa_ausente' }, ip: ip ?? undefined, userAgent: userAgent ?? undefined,
        });
        throw new UnauthorizedException('Código MFA obrigatório para este perfil.');
      }
      const u = await this.prisma.usuario.findUnique({ where: { id: usuario.id } });
      if (!u?.mfaSegredo) throw new UnauthorizedException('MFA não configurado.');
      const valido = authenticator.verify({ token: totpToken, secret: u.mfaSegredo });
      if (!valido) {
        await this.audit.log({
          usuarioId: usuario.id, acao: 'LOGIN_FALHA', entidade: 'Usuario', entidadeId: usuario.id,
          dadosDepois: { email: usuario.email, motivo: 'mfa_invalido' }, ip: ip ?? undefined, userAgent: userAgent ?? undefined,
        });
        throw new UnauthorizedException('Código MFA inválido.');
      }
    }

    await this.audit.log({
      usuarioId: usuario.id, acao: 'LOGIN', entidade: 'Usuario', entidadeId: usuario.id,
      dadosDepois: { email: usuario.email }, ip: ip ?? undefined, userAgent: userAgent ?? undefined,
    });

    const payload = { sub: usuario.id, email: usuario.email, perfil: usuario.perfil };
    return { accessToken: this.jwt.sign(payload) };
  }

  async hashSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, 12);
  }
}
