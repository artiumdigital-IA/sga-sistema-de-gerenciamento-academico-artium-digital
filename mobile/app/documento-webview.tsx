import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { getCurrentToken } from '../lib/auth';
import { webUrl } from '../lib/api';
import { theme } from '../lib/theme';
import { MensagemErro } from '../lib/ui';

function BotaoVoltar() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
      <Feather name="chevron-left" size={24} color={theme.branco} />
    </TouchableOpacity>
  );
}

/**
 * Documento oficial (Declaração/Boletim/Carteirinha/Histórico) num WebView
 * apontando pra tela de impressão do frontend web — reusa o layout oficial
 * já existente lá (papel timbrado, branding, botão imprimir) em vez de
 * tentar replicar o mesmo CSS no app. Ver ADR no README.
 *
 * Autenticação: o app guarda o JWT no SecureStore (não em cookie), mas o
 * frontend web exige o cookie `fiurj_token` tanto no middleware (gate
 * server-side de /dashboard/*) quanto no client (`getToken()` lê
 * `document.cookie` pra montar o header Authorization das próprias chamadas
 * de API que a página React faz). Por isso o cookie é injetado nos dois
 * pontos: `source.headers.Cookie` cobre a 1ª requisição (o middleware),
 * `injectedJavaScriptBeforeContentLoaded` cobre `document.cookie` pro
 * JavaScript da página (que roda depois que o HTML já carregou).
 */
export default function DocumentoWebViewScreen() {
  const { path, titulo } = useLocalSearchParams<{ path: string; titulo?: string }>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  const token = getCurrentToken();
  const uri = webUrl(path ?? '/');

  const injecaoCookie = token
    ? `document.cookie = 'fiurj_token=${token}; path=/'; true;`
    : 'true;';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: titulo ?? 'Documento',
          headerStyle: { backgroundColor: theme.corPrimaria },
          headerTintColor: theme.branco,
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => <BotaoVoltar />,
        }}
      />

      {erro ? (
        <MensagemErro
          mensagem={erro}
          aoTentarNovamente={() => {
            setErro(null);
            setCarregando(true);
            webviewRef.current?.reload();
          }}
        />
      ) : (
        <WebView
          ref={webviewRef}
          source={{ uri, headers: token ? { Cookie: `fiurj_token=${token}` } : undefined }}
          injectedJavaScriptBeforeContentLoaded={injecaoCookie}
          onLoadEnd={() => setCarregando(false)}
          onError={() => {
            setCarregando(false);
            setErro('Não foi possível carregar o documento. Verifique sua conexão e tente novamente.');
          }}
          onHttpError={(e) => {
            setCarregando(false);
            setErro(`O servidor retornou um erro (${e.nativeEvent.statusCode}) ao gerar o documento.`);
          }}
          startInLoadingState
          style={styles.webview}
        />
      )}

      {carregando && !erro && (
        <View style={styles.overlayCarregando} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.corPrimaria} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.branco },
  webview: { flex: 1, backgroundColor: theme.branco },
  overlayCarregando: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.branco,
  },
});
