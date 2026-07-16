/**
 * lib/em-breve.ts — placeholder padrão pras abas que ainda não têm conteúdo
 * definido (SGA, Podcast — ver app/(tabs)/sga.tsx e podcast.tsx). Mesmo
 * padrão do mobile/lib/em-breve.ts (app do aluno).
 */
import { Alert } from 'react-native';

export function emBreve(recurso?: string) {
  Alert.alert('Em breve', recurso ? `"${recurso}" ainda não está disponível.` : 'Essa função ainda não está disponível.');
}
