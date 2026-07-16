import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { CartaoIcone, GradeCartoes } from '../../lib/ui';

/**
 * Docentes On — hub com os 6 atalhos do dia a dia do professor: Pauta,
 * Notas, Captura de Prova, Alunos, Aviso para Turma, Chamado de Manutenção.
 * Mesmo visual da grade "Meu curso" do app do aluno (CartaoIcone/GradeCartoes,
 * ver lib/ui.tsx). Cada cartão navega pra uma tela "de dados" própria (ver
 * app/(tabs)/_layout.tsx — todas têm href: null, então só são alcançadas
 * por aqui).
 */
export default function DocentesOnScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Docentes On</Text>
        <Text style={styles.headerSub}>Atalhos rápidos para o dia a dia das suas turmas.</Text>
      </View>

      <GradeCartoes>
        <CartaoIcone icone="clipboard" titulo="Pauta" aoPressionar={() => router.push('/pauta')} />
        <CartaoIcone icone="edit-3" titulo="Notas" aoPressionar={() => router.push('/notas')} />
        <CartaoIcone icone="camera" titulo="Captura de Prova" aoPressionar={() => router.push('/captura-prova')} />
        <CartaoIcone icone="users" titulo="Alunos" aoPressionar={() => router.push('/alunos')} />
        <CartaoIcone icone="bell" titulo="Aviso para Turma" aoPressionar={() => router.push('/aviso-turma')} />
        <CartaoIcone icone="tool" titulo="Chamado de Manutenção" aoPressionar={() => router.push('/chamados')} />
      </GradeCartoes>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, paddingTop: 56 },
  header: { marginBottom: 16 },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: theme.cinza900 },
  headerSub: { fontSize: 13, color: theme.cinza500, marginTop: 4 },
});
