import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError } from '../../lib/api';
import { AlunoDocente, getAlunos, getOfertas, Oferta, rotuloOferta } from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, Cartao, MensagemErro } from '../../lib/ui';

/**
 * Alunos — todos os alunos matriculados nas minhas turmas (dedupe por
 * aluno, ver DocenteService.meusAlunos no backend), com filtro opcional por
 * turma. Chip "Todas" é um caso especial (ofertaId undefined na API) que o
 * SeletorOferta compartilhado (lib/ui.tsx) não cobre, por isso essa tela
 * monta seu próprio seletor em vez de reusá-lo.
 */
// Regex de diacríticos construída via String.fromCharCode (não como literal
// no código-fonte) — mesmo cuidado já documentado em
// frontend/components/dashboard/RightPanel.tsx, pra evitar qualquer risco
// de corrupção de encoding ao passar pelas camadas de escrita/edição.
const DIACRITICOS = new RegExp(String.fromCharCode(91, 92, 117, 48, 51, 48, 48, 45, 92, 117, 48, 51, 54, 102, 93), 'g');
function normalizar(s: string): string {
  return s.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();
}

export default function AlunosScreen() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<AlunoDocente[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setOfertas(await getOfertas());
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar suas turmas.');
      }
    })();
  }, []);

  const carregarAlunos = useCallback(async (oferta: string | null) => {
    setErro(null);
    setCarregando(true);
    try {
      setAlunos(await getAlunos(oferta ?? undefined));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os alunos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAlunos(ofertaId);
  }, [ofertaId, carregarAlunos]);

  const alunosFiltrados = useMemo(() => {
    if (!alunos) return [];
    const alvo = normalizar(busca.trim());
    if (!alvo) return alunos;
    return alunos.filter((a) => normalizar(a.aluno.nome).includes(alvo) || a.aluno.ra.includes(alvo));
  }, [alunos, busca]);

  return (
    <View style={styles.tela}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorScroll} contentContainerStyle={styles.seletorConteudo}>
        <TouchableOpacity style={[styles.chip, ofertaId === null && styles.chipAtivo]} onPress={() => setOfertaId(null)}>
          <Text style={[styles.chipTexto, ofertaId === null && styles.chipTextoAtivo]}>Todas as turmas</Text>
        </TouchableOpacity>
        {ofertas.map((o) => {
          const ativo = o.id === ofertaId;
          return (
            <TouchableOpacity key={o.id} style={[styles.chip, ativo && styles.chipAtivo]} onPress={() => setOfertaId(o.id)}>
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{rotuloOferta(o)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.buscaLinha}>
        <Feather name="search" size={16} color={theme.cinza400} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar por nome ou RA..."
          placeholderTextColor={theme.cinza400}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={() => carregarAlunos(ofertaId)} /> : null}

        {carregando ? (
          <Carregando />
        ) : alunosFiltrados.length > 0 ? (
          alunosFiltrados.map((a) => (
            <Cartao key={a.aluno.id}>
              <Text style={styles.nome}>{a.aluno.nome}</Text>
              <Text style={styles.sub}>RA {a.aluno.ra} · {a.aluno.situacaoVinculo}</Text>
              <Text style={styles.turmas}>{a.turmas.join(' · ')}</Text>
            </Cartao>
          ))
        ) : (
          <Text style={styles.vazio}>Nenhum aluno encontrado.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  seletorScroll: { flexGrow: 0 },
  seletorConteudo: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  chip: { backgroundColor: theme.branco, borderRadius: 10, borderWidth: 1, borderColor: theme.cinza200, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  chipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  chipTexto: { fontSize: 12, fontWeight: '700', color: theme.cinza900 },
  chipTextoAtivo: { color: theme.branco },
  buscaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cinza200,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  buscaInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: theme.cinza900 },
  conteudo: { padding: 16, gap: 10 },
  vazio: { fontSize: 13, color: theme.cinza500, textAlign: 'center', marginTop: 24 },
  nome: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  sub: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
  turmas: { fontSize: 12, color: theme.corPrimaria, fontWeight: '600', marginTop: 8 },
});
