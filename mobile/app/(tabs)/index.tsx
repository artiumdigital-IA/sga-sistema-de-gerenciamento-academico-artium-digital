import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFileUrl } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { getPainel, Painel } from '../../lib/discente';
import { emBreve } from '../../lib/em-breve';
import { theme } from '../../lib/theme';
import { Cartao, CartaoIcone, Carregando, GradeCartoes, MensagemErro } from '../../lib/ui';

/**
 * Início — painel do aluno redesenhado pra seguir a referência visual que o
 * usuário mandou (prints de outro app de portal do aluno): cabeçalho azul
 * com saudação + curso + sino de avisos + foto (abre Perfil), cartão de
 * progresso, "Disciplinas em andamento", "Minha renovação" (retrátil) e a
 * grade "Meu curso". Ver lib/discente.ts pros tipos de /discente/painel.
 *
 * Cartões sem dado real no backend (Calendário acadêmico, Conquistas e
 * recompensas, Provas no polo, Horas AAC, Certificações, Conteúdos extras,
 * "Minha renovação") mostram "Em breve" ao tocar -- pedido explícito do
 * usuário pra manter o layout igual à referência mesmo nas partes que a
 * FIURJ ainda não tem pronto. "Disciplinas e avaliações", "Notas e
 * histórico" e "Documentos" são reais e levam pras telas antigas
 * (boletim/historico/documentos, ver app/(tabs)/_layout.tsx).
 */
export default function InicioScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [renovacaoAberta, setRenovacaoAberta] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setPainel(await getPainel());
    } catch {
      setErro('Não foi possível carregar seus dados. Puxe pra baixo pra tentar de novo.');
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

  if (painel === null && !erro) return <Carregando />;

  const primeiroNome = (painel?.aluno.nome ?? usuario?.email ?? 'aluno').split(' ')[0];
  const fotoUrl = apiFileUrl(painel?.aluno.fotoUrl ?? null);

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
            {painel ? <Text style={styles.cursoTexto}>{painel.aluno.curso}</Text> : null}
          </View>
          <View style={styles.headerAcoes}>
            <TouchableOpacity onPress={() => router.push('/avisos')} style={styles.sino}>
              <Feather name="bell" size={22} color={theme.branco} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/perfil')}>
              {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={18} color={theme.corPrimaria} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {painel ? (
          <TouchableOpacity
            style={styles.progressoCard}
            onPress={() => emBreve('Detalhes do progresso no período')}
            activeOpacity={0.8}
          >
            <View style={styles.progressoTopo}>
              <Text style={styles.progressoPercentual}>{painel.progresso.percentual}%</Text>
              <Text style={styles.progressoLabel}>Progresso no período</Text>
              <Feather name="chevron-right" size={18} color={theme.cinza400} />
            </View>
            <View style={styles.barraFundo}>
              <View style={[styles.barraPreenchida, { width: `${Math.min(100, painel.progresso.percentual)}%` }]} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.corpo}>
        {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={carregar} /> : null}

        <Text style={styles.secaoTitulo}>Disciplinas em andamento</Text>
        <Cartao>
          <View style={styles.disciplinasVazio}>
            <Text style={styles.disciplinasVazioTexto}>
              Estamos preparando tudo para você, em breve suas disciplinas estarão disponíveis.
            </Text>
            <Feather name="coffee" size={28} color={theme.cinza400} />
          </View>
        </Cartao>

        <TouchableOpacity style={styles.renovacaoLinha} onPress={() => setRenovacaoAberta((v) => !v)}>
          <Text style={styles.renovacaoTitulo}>Minha renovação</Text>
          <Feather name={renovacaoAberta ? 'chevron-up' : 'chevron-down'} size={20} color={theme.cinza900} />
        </TouchableOpacity>
        {renovacaoAberta ? (
          <Cartao>
            <Text style={styles.vazio}>Em breve você vai poder acompanhar sua renovação por aqui.</Text>
          </Cartao>
        ) : null}

        <Text style={styles.secaoTitulo}>Meu curso</Text>
        <GradeCartoes>
          <CartaoIcone icone="edit-3" titulo="Disciplinas e avaliações" aoPressionar={() => router.push('/boletim')} />
          <CartaoIcone icone="calendar" titulo="Calendário acadêmico" aoPressionar={() => emBreve('Calendário acadêmico')} />
          <CartaoIcone icone="bar-chart-2" titulo="Notas e histórico" aoPressionar={() => router.push('/historico')} />
          <CartaoIcone icone="file-text" titulo="Documentos" aoPressionar={() => router.push('/documentos')} />
          <CartaoIcone
            icone="star"
            titulo="Conquistas e recompensas"
            badge="Novo!"
            aoPressionar={() => emBreve('Conquistas e recompensas')}
          />
          <CartaoIcone icone="map-pin" titulo="Provas no polo" aoPressionar={() => emBreve('Provas no polo')} />
          <CartaoIcone icone="refresh-cw" titulo="Minha renovação" aoPressionar={() => emBreve('Minha renovação')} />
          <CartaoIcone icone="clock" titulo="Horas AAC" aoPressionar={() => emBreve('Horas AAC')} />
          <CartaoIcone icone="award" titulo="Certificações" aoPressionar={() => emBreve('Certificações')} />
          <CartaoIcone icone="sidebar" titulo="Conteúdos extras" aoPressionar={() => emBreve('Conteúdos extras')} />
        </GradeCartoes>
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
  cursoTexto: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerAcoes: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sino: { padding: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.branco },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressoCard: {
    backgroundColor: theme.branco,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressoTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressoPercentual: { fontSize: 18, fontWeight: '700', color: theme.cinza900 },
  progressoLabel: { fontSize: 13, color: theme.cinza700, flex: 1 },
  barraFundo: { height: 6, borderRadius: 3, backgroundColor: theme.cinza100, overflow: 'hidden' },
  barraPreenchida: { height: 6, borderRadius: 3, backgroundColor: theme.corPrimaria },
  corpo: { padding: 16, gap: 12 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: theme.cinza900, marginTop: 8 },
  disciplinasVazio: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  disciplinasVazioTexto: { flex: 1, fontSize: 13, color: theme.cinza500 },
  renovacaoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cinza200,
    padding: 16,
  },
  renovacaoTitulo: { fontSize: 14, fontWeight: '600', color: theme.cinza900 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
