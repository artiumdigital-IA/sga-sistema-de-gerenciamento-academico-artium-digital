import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Envio de push notification via Expo Push Service — não usa Firebase/APNs
 * direto, o app mobile é Expo-managed (ver mobile/eas.json) então o token
 * obtido por expo-notifications já é um "Expo push token" que a própria
 * Expo encaminha pro FCM/APNs por trás. Não precisa de credencial nenhuma
 * pra esse endpoint público da Expo (https://exp.host/--/api/v2/push/send).
 */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TAMANHO_LOTE = 100; // limite da própria Expo por request

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrarToken(usuarioId: string, token: string, plataforma?: string) {
    return (this.prisma as any).pushToken.upsert({
      where: { token },
      update: { usuarioId, plataforma },
      create: { usuarioId, token, plataforma },
    });
  }

  async removerToken(token: string) {
    try {
      await (this.prisma as any).pushToken.delete({ where: { token } });
    } catch {
      // token já não existia — remover token é idempotente, não é erro.
    }
    return { message: 'Token removido.' };
  }

  /**
   * Manda a mesma notificação pra todos os tokens registrados dos usuários
   * informados. Falha de rede/API da Expo NUNCA deve derrubar quem chamou —
   * o aviso já foi salvo no banco antes disso e continua valendo no mural
   * mesmo se o push falhar (ver DocenteService.criarAvisoTurma).
   */
  async enviarParaUsuarios(usuarioIds: string[], titulo: string, corpo: string, data?: Record<string, unknown>) {
    if (usuarioIds.length === 0) return { destinatarios: 0 };

    const tokens: { token: string }[] = await (this.prisma as any).pushToken.findMany({
      where: { usuarioId: { in: usuarioIds } },
      select: { token: true },
    });
    if (tokens.length === 0) return { destinatarios: 0 };

    const mensagens = tokens.map(t => ({
      to: t.token,
      title: titulo,
      body: corpo,
      data: data ?? {},
      sound: 'default',
    }));

    try {
      for (let i = 0; i < mensagens.length; i += TAMANHO_LOTE) {
        const lote = mensagens.slice(i, i + TAMANHO_LOTE);
        await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(lote),
        });
      }
    } catch (err) {
      this.logger.warn(`Falha ao enviar push notification: ${(err as Error).message}`);
    }

    return { destinatarios: tokens.length };
  }
}
