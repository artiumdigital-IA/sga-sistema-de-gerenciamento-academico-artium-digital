import { Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import type { ColorValue } from 'react-native';
import { theme } from '../../lib/theme';

/**
 * Barra de abas redesenhada pra seguir a referência visual que o usuário
 * mandou (prints de outro app de portal do aluno): 5 abas embaixo (Início,
 * Carreiras, Financeiro, Suporte, Perfil), fundo branco, ícone/label azul
 * quando ativo -- igual ao print de referência.
 *
 * As telas "antigas" (Boletim, Histórico, Documentos, Avisos, Biblioteca)
 * continuam existindo e com dado real, só que agora são alcançadas por
 * cartões/links dentro das novas telas (ver "Meu curso" em index.tsx) em vez
 * de aba própria -- por isso usam `href: null` (fica de fora da barra
 * debaixo, mas continua navegável via router.push) e ganham um cabeçalho
 * próprio com seta de voltar, já que a barra de abas não é uma pilha (Tabs),
 * então sem isso não teria como voltar visualmente pro Início.
 */
type IconName = keyof typeof Feather.glyphMap;

function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <Feather name={name} size={22} color={color} />;
}

function BotaoVoltar() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
      <Feather name="chevron-left" size={24} color={theme.branco} />
    </TouchableOpacity>
  );
}

function opcoesTelaAntiga(title: string) {
  return {
    href: null,
    headerShown: true,
    title,
    headerStyle: { backgroundColor: theme.corPrimaria },
    headerTintColor: theme.branco,
    headerTitleStyle: { fontWeight: '600' as const },
    headerLeft: () => <BotaoVoltar />,
  } as const;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.branco, borderTopColor: theme.cinza200 },
        tabBarActiveTintColor: theme.corPrimaria,
        tabBarInactiveTintColor: theme.cinza400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="carreiras"
        options={{ title: 'Carreiras', tabBarIcon: ({ color }) => <TabIcon name="briefcase" color={color} /> }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{ title: 'Financeiro', tabBarIcon: ({ color }) => <TabIcon name="dollar-sign" color={color} /> }}
      />
      <Tabs.Screen
        name="suporte"
        options={{ title: 'Suporte', tabBarIcon: ({ color }) => <TabIcon name="help-circle" color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <TabIcon name="user" color={color} /> }}
      />

      <Tabs.Screen name="boletim" options={opcoesTelaAntiga('Boletim')} />
      <Tabs.Screen name="historico" options={opcoesTelaAntiga('Histórico')} />
      <Tabs.Screen name="documentos" options={opcoesTelaAntiga('Documentos')} />
      <Tabs.Screen name="avisos" options={opcoesTelaAntiga('Avisos')} />
      <Tabs.Screen name="biblioteca" options={opcoesTelaAntiga('Biblioteca')} />
    </Tabs>
  );
}
