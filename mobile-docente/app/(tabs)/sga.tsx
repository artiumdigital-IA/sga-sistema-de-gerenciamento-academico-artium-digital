import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

/**
 * SGA — aba placeholder (confirmado com o usuário, Jul/2026: "Em breve").
 * Sem endpoint/conteúdo definido ainda; quando houver, essa tela troca por
 * dado real (ex.: WebView do dashboard web, ou atalhos específicos).
 */
export default function SgaScreen() {
  return (
    <View style={styles.tela}>
      <View style={styles.icone}>
        <Feather name="monitor" size={32} color={theme.corPrimaria} />
      </View>
      <Text style={styles.titulo}>SGA</Text>
      <Text style={styles.texto}>Em breve você vai poder acessar o Sistema de Gestão Acadêmica completo por aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.cinza100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: theme.cinza900, marginBottom: 8 },
  texto: { fontSize: 13, color: theme.cinza500, textAlign: 'center' },
});
