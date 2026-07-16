import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getOfertas, Oferta, rotuloOferta, rotuloPeriodo } from '../../lib/docente';
import { ApiError } from '../../lib/api';
import { theme } from '../../lib/theme';
import { Carregando, Cartao, MensagemErro } from '../../lib/ui';

/**
 * Início — saudação + resumo das minhas turmas no período. Mesmo estilo de
 * cabeçalho azul do app do aluno (mobile/app/(tabs)/index.tsx), simplificado
 * pro professor: sem progresso/disciplinas em andamento (isso é conceito de
 * aluno), só um resumo rápido de "quantas turmas, quantos alunos" e a lista
 * das turmas — o dia a dia de verdade (lançar nota, avisar turma etc.) fica
 * em "Docentes On".
 */
export default function InicioScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setOfertas(await getOfertas());
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar suas turmas.');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aoAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  if (ofertas === null && !erro) return <Carregando />;

  const primeiroNome = (usuario?.nome ?? usuario?.email ?? 'professor').split(' ')[0];
  const totalAlunos = (ofertas ?? []).reduce((soma, o) => soma + o._count.matriculas, 0);

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudoTela}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.corPrimaria} />}
    >
      <View style={styles.header}>
        <View style={styles.headerLinha}>
          <View style={styles.headerTextos}>
            <Text style={styles.saudacao}>Olá, {primeiroNome}</Text>
            <Text style={styles.subTexto}>Portal do Professor</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.sair}>
            <Feather name="log-out" size={20} color={theme.branco} />
          </TouchableOpacity>
        </View>

        <View style={styles.resumoLinha}>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoNumero}>{ofertas?.length ?? 0}</Text>
            <Text style={styles.resumoLabel}>Turmas</Text>
          </View>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoNumero}>{totalAlunos}</Text>
            <Text style={styles.resumoLabel}>Alunos</Text>
          </View>
        </View>
      </View>

      <View style={styles.corpo}>
        {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={carregar} /> : null}

        <TouchableOpacity style={styles.atalho} onPress={() => router.push('/docentes-on')} activeOpacity={0.8}>
          <View style={styles.atalhoIcone}>
            <Feather name="grid" size={18} color={theme.branco} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.atalhoTitulo}>Docentes On</Text>
            <Text style={styles.atalhoSub}>Pauta, Notas, Captura de Prova, Alunos, Aviso para Turma</Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.cinza400} />
        </TouchableOpacity>

        <Text style={styles.secaoTitulo}>Minhas turmas</Text>
        {ofertas && ofertas.length > 0 ? (
          ofertas.map((o) => (
            <Cartao key={o.id}>
              <Text style={styles.turmaTitulo}>{rotuloOferta(o)}</Text>
              <Text style={styles.turmaSub}>{rotuloPeriodo(o)}</Text>
              <Text style={styles.turmaMatriculas}>{o._count.matriculas} aluno(s) matriculado(s)</Text>
            </Cartao>
          ))
        ) : (
          <Cartao>
            <Text style={styles.vazio}>Você não tem turmas neste período.</Text>
          </Cartao>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudoTela: { flexGrow: 1 },
  header: { backgroundColor: theme.corPrimaria, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 24 },
  headerLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTextos: { flex: 1 },
  saudacao: { fontSize: 20, fontWeight: '700', color: theme.branco },
  subTexto: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sair: { padding: 4 },
  resumoLinha: { flexDirection: 'row', gap: 12 },
  resumoCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  resumoNumero: { fontSize: 22, fontWeight: '700', color: theme.branco },
  resumoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  corpo: { padding: 16, gap: 12 },
  atalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.corPrimaria,
    padding: 14,
  },
  atalhoIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.corPrimaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  atalhoSub: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: theme.cinza900, marginTop: 8 },
  turmaTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  turmaSub: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
  turmaMatriculas: { fontSize: 12, color: theme.corPrimaria, fontWeight: '600', marginTop: 8 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
