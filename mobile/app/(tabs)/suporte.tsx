import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { emBreve } from '../../lib/em-breve';
import { theme } from '../../lib/theme';

/** Suporte — mesma lista de assuntos do app de referência. Nenhum tem
 * endpoint no backend da FIURJ ainda, então cada item abre o placeholder
 * "Em breve" (ver lib/em-breve.ts). */
const ITENS: { icone: keyof typeof Feather.glyphMap; titulo: string; descricao: string }[] = [
  { icone: 'compass', titulo: 'Orientações', descricao: 'Materiais que te ajudam na sua jornada acadêmica do começo ao fim.' },
  { icone: 'headphones', titulo: 'Atendimento', descricao: 'Requerimentos e atendimentos remotos ou presenciais.' },
  {
    icone: 'message-circle',
    titulo: 'Ambiente de interação',
    descricao: 'Tire dúvidas sobre os conteúdos das aulas com seu tutor e a comunidade.',
  },
  { icone: 'smartphone', titulo: 'Apresentação do app', descricao: 'Acesse o passo a passo das principais áreas do seu app.' },
];

export default function SuporteScreen() {
  return (
    <View style={styles.tela}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Suporte</Text>
        <Text style={styles.subtitulo}>Que tipo de suporte você precisa hoje?</Text>
      </View>
      <View style={styles.lista}>
        {ITENS.map((item) => (
          <TouchableOpacity key={item.titulo} style={styles.item} onPress={() => emBreve(item.titulo)}>
            <Feather name={item.icone} size={20} color={theme.corPrimaria} style={styles.itemIcone} />
            <View style={styles.itemTextos}>
              <Text style={styles.itemTitulo}>{item.titulo}</Text>
              <Text style={styles.itemDescricao}>{item.descricao}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.cinza400} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  header: { backgroundColor: theme.corPrimaria, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 16 },
  titulo: { fontSize: 20, fontWeight: '700', color: theme.branco, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8 },
  lista: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.cinza200,
    gap: 12,
  },
  itemIcone: { width: 24 },
  itemTextos: { flex: 1 },
  itemTitulo: { fontSize: 15, fontWeight: '700', color: theme.cinza900 },
  itemDescricao: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
});
