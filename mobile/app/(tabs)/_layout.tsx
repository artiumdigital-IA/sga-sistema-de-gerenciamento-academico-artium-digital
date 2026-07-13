import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

/**
 * Ícones e cores da barra de abas espelham a identidade visual do sidebar
 * esquerdo do sistema web (ver frontend/app/dashboard/layout.tsx e
 * frontend/app/globals.css): fundo azul (--blue-dark, igual a
 * theme.corPrimaria), item ativo em vermelho (--red, igual a
 * theme.corSecundaria) com ícone/texto branco, item inativo em branco com
 * opacidade reduzida — mesmo esquema do sidebar (ativo = fundo vermelho +
 * texto branco, inativo = texto branco 70% opaco).
 *
 * Ícones via Feather (@expo/vector-icons — já vem junto do pacote "expo",
 * não é dependência nova). O sidebar web usa SVGs customizados desenhados
 * no mesmo estilo do Feather/lucide (traço, cantos arredondados), então
 * Feather é o equivalente mais próximo disponível no React Native sem
 * adicionar pacote novo. Mapeamento (mesmo ícone do item equivalente no
 * sidebar web, quando existe): Início→home, Boletim→edit-3 (o sidebar usa
 * lápis pra "Notas"), Documentos→file-text, Avisos→bell. "Histórico" não
 * tem item próprio no sidebar web (só aparece dentro do perfil do aluno),
 * usamos book-open por ser o mais coerente com o conteúdo.
 */
type IconName = keyof typeof Feather.glyphMap;

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Feather name={name} size={22} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.corPrimaria },
        headerTintColor: theme.branco,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: { backgroundColor: theme.corPrimaria, borderTopWidth: 0 },
        tabBarActiveTintColor: theme.branco,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarActiveBackgroundColor: theme.corSecundaria,
        tabBarItemStyle: { marginHorizontal: 4, marginVertical: 6, borderRadius: 10 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="boletim"
        options={{
          title: 'Boletim',
          tabBarIcon: ({ color }) => <TabIcon name="edit-3" color={color} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <TabIcon name="book-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color }) => <TabIcon name="file-text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color }) => <TabIcon name="bell" color={color} />,
        }}
      />
    </Tabs>
  );
}
