import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { theme } from '../lib/theme';

/**
 * Guard de rotas — mesmo padrão do app do aluno (ver mobile/app/_layout.tsx):
 * enquanto carrega a sessão mostra um spinner; depois, redireciona pra
 * /login (sem sessão) ou pra /(tabs) (com sessão).
 */
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    const emAreaLogada = segments[0] === '(tabs)';
    if (!usuario && emAreaLogada) {
      router.replace('/login');
    } else if (usuario && !emAreaLogada) {
      router.replace('/(tabs)');
    }
  }, [usuario, carregando, segments, router]);

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.corPrimaria }}>
        <ActivityIndicator size="large" color={theme.branco} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RouteGuard>
        <Slot />
      </RouteGuard>
    </AuthProvider>
  );
}
