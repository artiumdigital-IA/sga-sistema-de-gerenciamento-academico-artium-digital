import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError } from '../../lib/api';
import {
  contagemExemplares,
  descricaoItemEmprestimo,
  Emprestimo,
  formatarData,
  getAcervo,
  getMeusEmprestimos,
  Livro,
  rotuloStatusEmprestimo,
  StatusEmprestimo,
} from '../../lib/biblioteca';
import { theme } from '../../lib/theme';
import { Cartao, Carregando, MensagemErro } from '../../lib/ui';

/**
 * Biblioteca — tela "antiga" (sem aba própria, ver _layout.tsx), alcançada
 * pelo cartão "Biblioteca" em "Meu curso" (index.tsx). Duas seções internas:
 * Acervo (catálogo de livros, mesmo endpoint que o dashboard web usa) e Meus
 * Empréstimos (self-service via /biblioteca/emprestimos/meus). Sem
 * cadastro/registro de empréstimo aqui -- isso é operação de balcão,
 * restrita a ADMIN/SECRETARIA no dashboard web (ver
 * backend/src/library/emprestimo/emprestimo.controller.ts).
 */
const COR_STATUS: Record<StatusEmprestimo, string> = {
  EM_ANDAMENTO: theme.corPrimaria,
  DEVOLVIDO: theme.sucesso,
  PERDIDO: theme.erro,
};

type Aba = 'acervo' | 'emprestimos';

export default function BibliotecaScreen() {
  const [aba, setAba] = useState<Aba>('acervo');

  const [livros, setLivros] = useState<Livro[] | null>(null);
  const [erroLivros, setErroLivros] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const [emprestimos, setEmprestimos] = useState<Emprestimo[] | null>(null);
  const [erroEmprestimos, setErroEmprestimos] = useState<string | null>(null);

  const carregarAcervo = useCallback(async (termo?: string) => {
    setErroLivros(null);
    try {
      setLivros(await getAcervo(termo));
    } catch (err) {
      setErroLivros(err instanceof ApiError ? err.message : 'Não foi possível carregar o acervo.');
    }
  }, []);

  const carregarEmprestimos = useCallback(async () => {
    setErroEmprestimos(null);
    try {
      setEmprestimos(await getMeusEmprestimos());
    } catch (err) {
      setErroEmprestimos(err instanceof ApiError ? err.message : 'Não foi possível carregar seus empréstimos.');
    }
  }, []);

  useEffect(() => {
    carregarAcervo();
    carregarEmprestimos();
  }, [carregarAcervo, carregarEmprestimos]);

  return (
    <View style={styles.tela}>
      <View style={styles.abas}>
        <TouchableOpacity style={[styles.aba, aba === 'acervo' && styles.abaAtiva]} onPress={() => setAba('acervo')}>
          <Text style={[styles.abaTexto, aba === 'acervo' && styles.abaTextoAtivo]}>Acervo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aba, aba === 'emprestimos' && styles.abaAtiva]} onPress={() => setAba('emprestimos')}>
          <Text style={[styles.abaTexto, aba === 'emprestimos' && styles.abaTextoAtivo]}>Meus Empréstimos</Text>
        </TouchableOpacity>
      </View>

      {aba === 'acervo' ? (
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={styles.buscaLinha}>
            <Feather name="search" size={16} color={theme.cinza400} style={styles.buscaIcone} />
            <TextInput
              style={styles.buscaInput}
              placeholder="Buscar título, autor, categoria..."
              value={busca}
              onChangeText={setBusca}
              onSubmitEditing={() => carregarAcervo(busca)}
              returnKeyType="search"
            />
          </View>

          {livros === null && !erroLivros ? (
            <Carregando />
          ) : erroLivros ? (
            <MensagemErro mensagem={erroLivros} aoTentarNovamente={() => carregarAcervo(busca)} />
          ) : livros && livros.length > 0 ? (
            livros.map((l) => {
              const { disponiveis, total } = contagemExemplares(l);
              return (
                <Cartao key={l.id}>
                  <Text style={styles.livroTitulo}>{l.titulo}</Text>
                  <Text style={styles.livroAutor}>{l.autor}{l.categoria ? ` · ${l.categoria}` : ''}</Text>
                  <View style={styles.livroRodape}>
                    <Text style={[styles.livroDisponibilidade, disponiveis === 0 && styles.livroIndisponivel]}>
                      {disponiveis}/{total} exemplares disponíveis
                    </Text>
                    {l.anoPublicacao ? <Text style={styles.livroAno}>{l.anoPublicacao}</Text> : null}
                  </View>
                </Cartao>
              );
            })
          ) : (
            <Cartao>
              <Text style={styles.vazio}>Nenhum livro encontrado.</Text>
            </Cartao>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}>
          {emprestimos === null && !erroEmprestimos ? (
            <Carregando />
          ) : erroEmprestimos ? (
            <MensagemErro mensagem={erroEmprestimos} aoTentarNovamente={carregarEmprestimos} />
          ) : emprestimos && emprestimos.length > 0 ? (
            emprestimos.map((e) => (
              <Cartao key={e.id}>
                <Text style={styles.livroTitulo}>{descricaoItemEmprestimo(e)}</Text>
                <View style={styles.emprestimoLinha}>
                  <View style={[styles.statusPill, { backgroundColor: COR_STATUS[e.status] }]}>
                    <Text style={styles.statusPillTexto}>{rotuloStatusEmprestimo(e.status)}</Text>
                  </View>
                  {e.emAtraso ? (
                    <View style={[styles.statusPill, { backgroundColor: theme.erro }]}>
                      <Text style={styles.statusPillTexto}>Atrasado</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.emprestimoData}>
                  Devolver até {formatarData(e.dataPrevistaDevolucao)}
                  {e.dataDevolucao ? ` · devolvido em ${formatarData(e.dataDevolucao)}` : ''}
                </Text>
              </Cartao>
            ))
          ) : (
            <Cartao>
              <Text style={styles.vazio}>Você não tem empréstimos registrados.</Text>
            </Cartao>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  abas: { flexDirection: 'row', backgroundColor: theme.branco, borderBottomWidth: 1, borderBottomColor: theme.cinza200 },
  aba: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaAtiva: { borderBottomColor: theme.corPrimaria },
  abaTexto: { fontSize: 13, fontWeight: '600', color: theme.cinza400 },
  abaTextoAtivo: { color: theme.corPrimaria },
  conteudo: { padding: 16, gap: 12 },
  buscaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cinza200,
    paddingHorizontal: 12,
  },
  buscaIcone: { marginRight: 8 },
  buscaInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: theme.cinza900 },
  vazio: { fontSize: 13, color: theme.cinza500 },
  livroTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  livroAutor: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
  livroRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  livroDisponibilidade: { fontSize: 12, fontWeight: '600', color: theme.sucesso },
  livroIndisponivel: { color: theme.erro },
  livroAno: { fontSize: 12, color: theme.cinza400 },
  emprestimoLinha: { flexDirection: 'row', gap: 6, marginTop: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusPillTexto: { fontSize: 11, fontWeight: '700', color: theme.branco },
  emprestimoData: { fontSize: 12, color: theme.cinza500, marginTop: 8 },
});
