/**
 * lib/em-breve.ts — placeholder padrão pras seções que existem no app de
 * referência (visual que o usuário pediu pra espelhar) mas ainda não têm
 * dado real no backend da FIURJ (Carreiras, Conquistas e recompensas,
 * Provas no polo, Horas AAC, Certificações, Conteúdos extras, Portal de
 * negociação, Indique e ganhe, itens da tela Suporte, etc.).
 *
 * Centralizado aqui só pra manter a mensagem consistente entre as telas e
 * facilitar trocar por uma tela de verdade assim que o backend tiver o
 * endpoint correspondente — é só apagar a chamada a emBreve() e plugar o
 * fetch real no lugar.
 */
import { Alert } from 'react-native';

export function emBreve(recurso?: string) {
  Alert.alert('Em breve', recurso ? `"${recurso}" ainda não está disponível.` : 'Essa função ainda não está disponível.');
}
