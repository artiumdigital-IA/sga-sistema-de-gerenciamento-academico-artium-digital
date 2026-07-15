/**
 * lib/push.ts — registro do Expo push token do dispositivo.
 *
 * Usado hoje só pra "Aviso para Turma" (Menu Docente, ver
 * backend/src/docente/): quando um professor envia um aviso pra turma, o
 * backend manda um push pra cada token registrado dos alunos matriculados.
 *
 * Depende do pacote `expo-notifications`, que ainda NÃO está instalado
 * neste projeto (ver mobile/package.json) — rodar localmente:
 *   npx expo install expo-notifications
 * (nunca fixar a versão à mão: o Expo Go da SDK instalada no celular embute
 * uma versão nativa específica de cada lib nativa, e uma incompatibilidade
 * de versão já causou um crash nativo SIGSEGV neste projeto antes, com o
 * react-native-reanimated — ver CLAUDE.md, seção "App mobile (Expo Go)").
 *
 * E de rodar `eas init` (mobile/eas.json já existe, falta só rodar) — sem
 * isso app.json não tem `extra.eas.projectId` e o registro é pulado
 * silenciosamente (ver tentarRegistrarPushToken abaixo).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiFetch } from './api';

export async function tentarRegistrarPushToken(): Promise<void> {
  try {
    // Import dinâmico: se expo-notifications ainda não foi instalado, isso
    // lança e caímos no catch sem quebrar o resto do app (login/telas).
    // @ts-expect-error — pacote ainda não instalado (`npx expo install
    // expo-notifications`, ver comentário no topo do arquivo); remover esta
    // linha assim que o pacote existir em node_modules (o typecheck vai
    // reclamar de "unused @ts-expect-error" como lembrete de sobra).
    const Notifications = await import('expo-notifications');

    const permissaoAtual = await Notifications.getPermissionsAsync();
    let status = permissaoAtual.status;
    if (status !== 'granted') {
      const pedido = await Notifications.requestPermissionsAsync();
      status = pedido.status;
    }
    if (status !== 'granted') return; // usuário negou — nada a fazer

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) {
      console.warn('[push] extra.eas.projectId ausente em app.json — rode "eas init" antes de testar push.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiFetch('/push/token', {
      method: 'POST',
      body: JSON.stringify({ token, plataforma: Platform.OS }),
    });
  } catch (err) {
    // Falha de push (lib não instalada, emulador sem Google Play Services,
    // permissão negada, etc.) nunca deve travar login nem qualquer outra
    // tela — é um "nice to have", não um requisito pra usar o app.
    console.warn('[push] não foi possível registrar o token:', err);
  }
}
