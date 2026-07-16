/**
 * lib/ui.tsx — pedacinhos de UI repetidos entre as telas (loading/erro/vazio),
 * mesmo padrão do mobile/lib/ui.tsx (app do aluno) — mesma identidade visual
 * entre os dois apps.
 */
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from './theme';
import { Oferta, rotuloOferta, rotuloPeriodo } from './docente';

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

type IconName = keyof typeof Feather.glyphMap;

/** Cartão com ícone + título, usado na grade "Docentes On" (mesmo visual do
 * "Meu curso" no app do aluno). `badge` é o selo tipo "Novo!" que aparece em
 * alguns cartões. */
export function CartaoIcone({
  icone,
  titulo,
  badge,
  aoPressionar,
}: {
  icone: IconName;
  titulo: string;
  badge?: string;
  aoPressionar: () => void;
}) {
  return (
    <TouchableOpacity style={styles.cartaoIcone} onPress={aoPressionar} activeOpacity={0.7}>
      <View style={styles.cartaoIconeTopo}>
        <Feather name={icone} size={22} color={theme.cinza900} />
        {badge ? (
          <View style={styles.cartaoBadge}>
            <Text style={styles.cartaoBadgeTexto}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cartaoIconeTitulo}>{titulo}</Text>
    </TouchableOpacity>
  );
}

/** Container em grade 2 colunas pros CartaoIcone. */
export function GradeCartoes({ children }: { children: React.ReactNode }) {
  return <View style={styles.grade}>{children}</View>;
}

export function LinhaDado({ rotulo, valor }: { rotulo: string; valor: string | number | null | undefined }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={styles.linhaValor}>{valor ?? '—'}</Text>
    </View>
  );
}

/** Selo pequeno colorido (status, tag) — reutilizado nas telas do Menu Docente. */
export function Pill({ texto, cor }: { texto: string; cor: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: cor }]}>
      <Text style={styles.pillTexto}>{texto}</Text>
    </View>
  );
}

/**
 * Seletor de turma (chips horizontais roláveis) — primeiro passo de Pauta,
 * Notas, Captura de Prova e Alunos: todas essas telas trabalham escopadas a
 * uma oferta (turma) do professor logado. Não usa um <Picker> nativo de
 * propósito, pra não precisar de mais uma dependência nativa — mesmo
 * critério já usado no resto do app (ver "Licoes aprendidas" no CLAUDE.md
 * sobre versão de lib nativa e Expo Go).
 */
export function SeletorOferta({
  ofertas,
  selecionada,
  aoSelecionar,
}: {
  ofertas: Oferta[];
  selecionada: string | null;
  aoSelecionar: (ofertaId: string) => void;
}) {
  if (ofertas.length === 0) {
    return (
      <View style={styles.cartao}>
        <Text style={styles.linhaRotulo}>Você ainda não tem turmas neste período.</Text>
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorScroll} contentContainerStyle={styles.seletorConteudo}>
      {ofertas.map((o) => {
        const ativa = o.id === selecionada;
        return (
          <TouchableOpacity
            key={o.id}
            style={[styles.seletorChip, ativa && styles.seletorChipAtivo]}
            onPress={() => aoSelecionar(o.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.seletorChipTitulo, ativa && styles.seletorChipTituloAtivo]}>{rotuloOferta(o)}</Text>
            <Text style={[styles.seletorChipSub, ativa && styles.seletorChipSubAtivo]}>{rotuloPeriodo(o)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
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
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cartaoIcone: {
    width: '48%',
    backgroundColor: theme.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cinza200,
    padding: 14,
    minHeight: 100,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartaoIconeTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cartaoIconeTitulo: { fontSize: 13, fontWeight: '600', color: theme.cinza900, marginTop: 10 },
  cartaoBadge: { backgroundColor: theme.corSecundaria, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  cartaoBadgeTexto: { color: theme.branco, fontSize: 10, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  pillTexto: { fontSize: 11, fontWeight: '700', color: theme.branco },
  seletorScroll: { flexGrow: 0 },
  seletorConteudo: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  seletorChip: {
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cinza200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    minWidth: 160,
  },
  seletorChipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  seletorChipTitulo: { fontSize: 13, fontWeight: '700', color: theme.cinza900 },
  seletorChipTituloAtivo: { color: theme.branco },
  seletorChipSub: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  seletorChipSubAtivo: { color: 'rgba(255,255,255,0.8)' },
});
