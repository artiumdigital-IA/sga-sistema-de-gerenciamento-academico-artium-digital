import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFileUrl } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Carteira, formatarData, formatarGrau, formatarMesAno, getCarteira } from '../../lib/discente';
import { emBreve } from '../../lib/em-breve';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro } from '../../lib/ui';

/**
 * Perfil — cartão de identificação (carteirinha) que expande/recolhe, igual
 * ao app de referência: recolhida mostra foto + nome + curso; expandida
 * mostra CPF, nascimento, curso, tipo de curso (Curso.grau), modelo de
 * ensino e campus. Modelo de ensino e campus não existem no schema hoje
 * (Curso.modalidade não é devolvido por /discente/carteira, e não existe
 * relação Aluno/Curso -> Unidade) -- mostramos "Em breve" nesses dois em
 * vez de esconder o campo, pra manter o layout igual à referência.
 */
export default function PerfilScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [expandida, setExpandida] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setCarteira(await getCarteira());
    } catch {
      setErro('Não foi possível carregar seus dados.');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carteira === null && !erro) return <Carregando />;

  const fotoUrl = apiFileUrl(carteira?.aluno.fotoUrl ?? null);
  const ativo = carteira?.aluno.situacaoVinculo === 'ATIVO';

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.headerTitulo}>Perfil</Text>

      {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={carregar} /> : null}

      {carteira ? (
        <View style={styles.carteirinha}>
          <View style={styles.carteirinhaTopo}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.foto} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Feather name="user" size={22} color={theme.branco} />
              </View>
            )}
            <View style={styles.carteirinhaNomeBloco}>
              <Text style={styles.carteirinhaNome}>{carteira.aluno.nome}</Text>
              {expandida ? (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeTexto}>{ativo ? 'ATIVO' : carteira.aluno.situacaoVinculo}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {!expandida ? <Text style={styles.carteirinhaCurso}>{carteira.curso.nome}</Text> : null}

          {expandida ? (
            <View style={styles.carteirinhaGrade}>
              <View style={styles.carteirinhaColuna}>
                <Text style={styles.carteirinhaRotulo}>CPF</Text>
                <Text style={styles.carteirinhaValor}>{carteira.aluno.cpf}</Text>
              </View>
              <View style={styles.carteirinhaColuna}>
                <Text style={styles.carteirinhaRotulo}>Nascimento</Text>
                <Text style={styles.carteirinhaValor}>{formatarData(carteira.aluno.dataNascimento)}</Text>
              </View>
              <View style={[styles.carteirinhaColuna, styles.carteirinhaColunaLarga]}>
                <Text style={styles.carteirinhaRotulo}>Curso</Text>
                <Text style={styles.carteirinhaValor}>{carteira.curso.nome}</Text>
              </View>
              <View style={styles.carteirinhaColuna}>
                <Text style={styles.carteirinhaRotulo}>Tipo de curso</Text>
                <Text style={styles.carteirinhaValor}>{formatarGrau(carteira.curso.grau)}</Text>
              </View>
              <View style={styles.carteirinhaColuna}>
                <Text style={styles.carteirinhaRotulo}>Modelo de ensino</Text>
                <Text style={styles.carteirinhaValorEsmaecido}>Em breve</Text>
              </View>
              <View style={styles.carteirinhaColuna}>
                <Text style={styles.carteirinhaRotulo}>Campus</Text>
                <Text style={styles.carteirinhaValorEsmaecido}>Em breve</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.carteirinhaRodape}>
            <View style={styles.carteirinhaColuna}>
              <Text style={styles.carteirinhaRotulo}>Validade</Text>
              <Text style={styles.carteirinhaValor}>{formatarMesAno(carteira.validaAte)}</Text>
            </View>
            <View style={styles.carteirinhaColuna}>
              <Text style={styles.carteirinhaRotulo}>Matrícula</Text>
              <Text style={styles.carteirinhaValor}>{carteira.aluno.ra}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.expandirLink} onPress={() => setExpandida((v) => !v)}>
        <Feather name={expandida ? 'minimize-2' : 'maximize-2'} size={14} color={theme.corPrimaria} />
        <Text style={styles.expandirTexto}>{expandida ? 'Recolher carteirinha' : 'Expandir carteirinha'}</Text>
      </TouchableOpacity>

      <Text style={styles.secaoTitulo}>Minha conta</Text>
      <TouchableOpacity style={styles.contaDestaque} onPress={() => emBreve('Conquistas e recompensas')}>
        <Feather name="star" size={16} color={theme.corPrimaria} />
        <Text style={styles.contaDestaqueTexto}>Conquistas e recompensas</Text>
      </TouchableOpacity>

      <View style={styles.contaLista}>
        <TouchableOpacity style={styles.contaItem} onPress={() => emBreve('Meus dados')}>
          <Text style={styles.contaItemTexto}>Meus dados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contaItem} onPress={() => emBreve('Política de Privacidade')}>
          <Text style={styles.contaItemTexto}>Política de Privacidade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contaItem} onPress={() => router.push('/documentos')}>
          <Text style={styles.contaItemTexto}>Envio de documentação</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contaItem, styles.contaItemUltimo]}
          onPress={() => emBreve('Configuração de atendimento')}
        >
          <Text style={styles.contaItemTexto}>Configuração de atendimento</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.sair} onPress={logout}>
        <Text style={styles.sairTexto}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: theme.cinza900, textAlign: 'center', marginBottom: 16 },
  carteirinha: { backgroundColor: theme.corPrimaria, borderRadius: 16, padding: 20 },
  carteirinhaTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.branco },
  fotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carteirinhaNomeBloco: { flex: 1, gap: 6 },
  carteirinhaNome: { fontSize: 16, fontWeight: '700', color: theme.branco },
  carteirinhaCurso: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 10 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: theme.sucesso, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeTexto: { color: theme.branco, fontSize: 10, fontWeight: '700' },
  carteirinhaGrade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  carteirinhaColuna: { width: '48%', marginBottom: 12 },
  carteirinhaColunaLarga: { width: '100%' },
  carteirinhaRotulo: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  carteirinhaValor: { fontSize: 13, color: theme.branco, fontWeight: '600', marginTop: 2 },
  carteirinhaValorEsmaecido: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 2, fontStyle: 'italic' },
  carteirinhaRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  expandirLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  expandirTexto: { color: theme.corPrimaria, fontSize: 13, fontWeight: '700' },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: theme.cinza900, marginTop: 12, marginBottom: 8 },
  contaDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.corPrimaria,
    padding: 14,
    marginBottom: 12,
  },
  contaDestaqueTexto: { color: theme.corPrimaria, fontSize: 14, fontWeight: '700' },
  contaLista: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200 },
  contaItem: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cinza100 },
  contaItemUltimo: { borderBottomWidth: 0 },
  contaItemTexto: { fontSize: 14, color: theme.cinza900 },
  sair: { alignItems: 'center', paddingVertical: 20 },
  sairTexto: { color: theme.corPrimaria, fontSize: 14, fontWeight: '700' },
});
