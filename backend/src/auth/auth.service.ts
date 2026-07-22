import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
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
    const mfaObrigatorio = ['ADMIN', 'SECRETARIA', 'FINANCEIRO', 'MASTER'];

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

      const totpValido = authenticator.verify({ token: totpToken, secret: u.mfaSegredo });
      if (!totpValido) {
        // Não bateu como TOTP — tenta como código de recuperação de uso único.
        const idx = await this.encontrarRecoveryCodeValido(u.mfaRecoveryCodes, totpToken);
        if (idx === -1) {
          await this.audit.log({
            usuarioId: usuario.id, acao: 'LOGIN_FALHA', entidade: 'Usuario', entidadeId: usuario.id,
            dadosDepois: { email: usuario.email, motivo: 'mfa_invalido' }, ip: ip ?? undefined, userAgent: userAgent ?? undefined,
          });
          throw new UnauthorizedException('Código MFA inválido.');
        }
        const restantes = [...u.mfaRecoveryCodes];
        restantes.splice(idx, 1);
        await this.prisma.usuario.update({ where: { id: u.id }, data: { mfaRecoveryCodes: restantes } });
        await this.audit.log({
          usuarioId: usuario.id, acao: 'MFA_RECOVERY_CODE_USADO', entidade: 'Usuario', entidadeId: usuario.id,
          dadosDepois: { email: usuario.email, codigosRestantes: restantes.length }, ip: ip ?? undefined, userAgent: userAgent ?? undefined,
        });
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

  /* ── MFA: enrollment self-service ──────────────────────────────────── */

  /** Gera um segredo TOTP novo (ainda pendente de confirmação) + QR code pra escanear. */
  async gerarSetupMfa(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException();

    const secret = authenticator.generateSecret();
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { mfaSegredoPendente: secret } });

    const otpauthUrl = authenticator.keyuri(usuario.email, 'FIURJ Plataforma', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    const chaveManual = secret.match(/.{1,4}/g)?.join(' ') ?? secret;

    return { qrCodeDataUrl, chaveManual };
  }

  /** Confirma o setup: valida o 1º código gerado pelo app e ativa o MFA de vez. */
  async ativarMfa(usuarioId: string, totpToken: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario?.mfaSegredoPendente) {
      throw new BadRequestException('Nenhum setup de MFA em andamento. Gere o QR code primeiro.');
    }
    const valido = authenticator.verify({ token: totpToken, secret: usuario.mfaSegredoPendente });
    if (!valido) throw new UnauthorizedException('Código inválido. Confira o horário do celular e tente novamente.');

    const codigosRecuperacao = this.gerarCodigosRecuperacao();
    const hashes = await Promise.all(codigosRecuperacao.map((c) => bcrypt.hash(c, 10)));

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaSegredo: usuario.mfaSegredoPendente, mfaSegredoPendente: null, mfaAtivo: true, mfaRecoveryCodes: hashes },
    });

    await this.audit.log({
      usuarioId, acao: 'MFA_ATIVADO', entidade: 'Usuario', entidadeId: usuarioId,
      dadosDepois: { email: usuario.email },
    });

    // Códigos em texto puro só existem aqui — nunca ficam armazenados, só o hash.
    return { codigosRecuperacao };
  }

  /** Desativa o MFA — exige a senha atual como reconfirmação. */
  async desativarMfa(usuarioId: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException();
    const valido = await bcrypt.compare(senha, usuario.senhaHash);
    if (!valido) throw new UnauthorizedException('Senha incorreta.');

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaAtivo: false, mfaSegredo: null, mfaSegredoPendente: null, mfaRecoveryCodes: [] },
    });

    await this.audit.log({
      usuarioId, acao: 'MFA_DESATIVADO', entidade: 'Usuario', entidadeId: usuarioId,
      dadosDepois: { email: usuario.email },
    });
    return { ok: true };
  }

  /** Gera um novo lote de 8 códigos de recuperação, invalidando os antigos. */
  async regerarCodigosRecuperacao(usuarioId: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException();
    if (!usuario.mfaAtivo) throw new BadRequestException('MFA não está ativo.');
    const valido = await bcrypt.compare(senha, usuario.senhaHash);
    if (!valido) throw new UnauthorizedException('Senha incorreta.');

    const codigosRecuperacao = this.gerarCodigosRecuperacao();
    const hashes = await Promise.all(codigosRecuperacao.map((c) => bcrypt.hash(c, 10)));
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { mfaRecoveryCodes: hashes } });

    await this.audit.log({
      usuarioId, acao: 'MFA_CODIGOS_REGERADOS', entidade: 'Usuario', entidadeId: usuarioId,
      dadosDepois: { email: usuario.email },
    });
    return { codigosRecuperacao };
  }

  private gerarCodigosRecuperacao(): string[] {
    return Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());
  }

  /** Compara um código informado contra os hashes de recuperação salvos (bcrypt, sequencial — lista é sempre pequena). */
  private async encontrarRecoveryCodeValido(hashes: string[], codigo: string): Promise<number> {
    const normalizado = codigo.trim().toUpperCase();
    for (let i = 0; i < hashes.length; i++) {
      if (await bcrypt.compare(normalizado, hashes[i])) return i;
    }
    return -1;
  }
}
