import { Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import type { ColorValue } from 'react-native';
import { theme } from '../../lib/theme';

/**
 * Barra de abas — mesmo padrão visual do app do aluno (mobile/app/(tabs)/_layout.tsx):
 * fundo branco, ícone/label azul quando ativo. 4 abas visíveis pedidas pelo
 * usuário (Início, SGA, Podcast, Docentes On); as 6 telas de dados (Pauta,
 * Notas, Captura de Prova, Alunos, Aviso para Turma, Chamados) são alcançadas
 * pelos cartões dentro de "Docentes On" — por isso usam href: null (mesmo truque
 * já usado no app do aluno pras telas "antigas") e ganham cabeçalho com seta
 * de voltar, já que a barra de abas não é uma pilha (Tabs).
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

function opcoesTelaDados(title: string) {
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
        name="sga"
        options={{ title: 'SGA', tabBarIcon: ({ color }) => <TabIcon name="monitor" color={color} /> }}
      />
      <Tabs.Screen
        name="podcast"
        options={{ title: 'Podcast', tabBarIcon: ({ color }) => <TabIcon name="mic" color={color} /> }}
      />
      <Tabs.Screen
        name="docentes-on"
        options={{ title: 'Docentes On', tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} /> }}
      />

      <Tabs.Screen name="pauta" options={opcoesTelaDados('Pauta')} />
      <Tabs.Screen name="notas" options={opcoesTelaDados('Notas')} />
      <Tabs.Screen name="captura-prova" options={opcoesTelaDados('Captura de Prova')} />
      <Tabs.Screen name="alunos" options={opcoesTelaDados('Alunos')} />
      <Tabs.Screen name="aviso-turma" options={opcoesTelaDados('Aviso para Turma')} />
      <Tabs.Screen name="chamados" options={opcoesTelaDados('Chamado de Manutenção')} />
    </Tabs>
  );
}
