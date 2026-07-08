/**
 * lib/ui.tsx — pedacinhos de UI repetidos entre as telas (loading/erro/vazio),
 * só pra não copiar o mesmo JSX em cada arquivo de tab. Nada sofisticado —
 * quando o app crescer, vale trocar por um design system de verdade.
 */
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

export function Carregando() {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={theme.corPrimaria} />
    </View>
  );
}

export function MensagemErro({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <View style={styles.centro}>
      <Text style={styles.erroTexto}>{mensagem}</Text>
      {aoTentarNovamente ? <Text style={styles.link} onPress={aoTentarNovamente}>Tentar novamente</Text> : null}
    </View>
  );
}

/** ScrollView com pull-to-refresh já plugado — a maioria das telas usa isso. */
export function TelaComRefresh({
  children,
  atualizando,
  aoAtualizar,
}: {
  children: React.ReactNode;
  atualizando: boolean;
  aoAtualizar: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.corPrimaria} />}
    >
      {children}
    </ScrollView>
  );
}

export function Cartao({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <View style={styles.cartao}>
      {titulo ? <Text style={styles.cartaoTitulo}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

export function LinhaDado({ rotulo, valor }: { rotulo: string; valor: string | number | null | undefined }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={styles.linhaValor}>{valor ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erroTexto: { color: theme.erro, fontSize: 14, textAlign: 'center', marginBottom: 8 },
  link: { color: theme.corPrimaria, fontSize: 14, fontWeight: '600' },
  conteudo: { padding: 16, gap: 12 },
  cartao: {
    backgroundColor: theme.branco,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cinza200,
  },
  cartaoTitulo: { fontSize: 15, fontWeight: '700', color: theme.cinza900, marginBottom: 10 },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.cinza100,
  },
  linhaRotulo: { fontSize: 13, color: theme.cinza500 },
  linhaValor: { fontSize: 13, color: theme.cinza900, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
});
