import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

/** Carreiras — não existe endpoint/dado no backend da FIURJ ainda (é uma
 * seção só do app de referência), então a tela inteira é "Em breve". Ver
 * lib/em-breve.ts pro mesmo padrão usado nos cartões de outras telas. */
export default function CarreirasScreen() {
  return (
    <View style={styles.tela}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Carreiras</Text>
      </View>
      <View style={styles.corpo}>
        <Feather name="briefcase" size={40} color={theme.cinza400} />
        <Text style={styles.mensagem}>Em breve</Text>
        <Text style={styles.submensagem}>Estamos preparando essa área pra você. Volte mais tarde!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  header: { backgroundColor: theme.corPrimaria, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 },
  titulo: { fontSize: 18, fontWeight: '700', color: theme.branco, textAlign: 'center' },
  corpo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  mensagem: { fontSize: 18, fontWeight: '700', color: theme.cinza900, marginTop: 8 },
  submensagem: { fontSize: 13, color: theme.cinza500, textAlign: 'center' },
});
