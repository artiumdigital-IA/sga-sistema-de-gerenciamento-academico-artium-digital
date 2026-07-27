import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError } from '../../lib/api';
import {
  abrirRequerimento,
  formatarTaxa,
  getMeusRequerimentos,
  getTiposRequerimento,
  Requerimento,
  TipoRequerimento,
} from '../../lib/discente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro } from '../../lib/ui';

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Análise',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
  CANCELADO: 'Cancelado',
};
const STATUS_COR: Record<string, string> = {
  ABERTO: theme.corPrimaria,
  EM_ANALISE: theme.aviso,
  DEFERIDO: theme.sucesso,
  INDEFERIDO: theme.erro,
  CANCELADO: theme.cinza500,
};

/**
 * Requerimentos — autoatendimento do aluno: tabela de preços (prazo/local/
 * taxa de cada item, ver TipoRequerimentoCatalogo no backend) + solicitar um
 * novo + acompanhar os que já pediu. Mesmo backend usado pela versão web
 * (/dashboard/discente/requerimentos) — os pedidos chegam pra secretaria em
 * /dashboard/secretaria/requerimentos.
 */
export default function RequerimentosScreen() {
  const [tipos, setTipos] = useState<TipoRequerimento[] | null>(null);
  const [meus, setMeus] = useState<Requerimento[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarTabela, setMostrarTabela] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregarMeus = useCallback(async () => {
    try {
      setMeus(await getMeusRequerimentos());
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar seus requerimentos.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setTipos(await getTiposRequerimento());
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar a tabela de requerimentos.');
      }
    })();
    carregarMeus();
  }, [carregarMeus]);

  async function enviar() {
    if (!tipoId) return;
    setEnviando(true);
    setErro(null);
    try {
      await abrirRequerimento({ tipoCatalogoId: tipoId, descricao: descricao.trim() || undefined });
      setTipoId(null);
      setDescricao('');
      setMostrarForm(false);
      await carregarMeus();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o requerimento.');
    } finally {
      setEnviando(false);
    }
  }

  const tipoSelecionado = tipos?.find((t) => t.id === tipoId) ?? null;

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>Requerimentos</Text>
      <Text style={styles.subtitulo}>Solicite documentos e serviços da secretaria e acompanhe o andamento.</Text>

      {erro ? <MensagemErro mensagem={erro} /> : null}

      <View style={styles.botoesTopo}>
        <TouchableOpacity style={styles.botaoSecundario} onPress={() => setMostrarTabela((v) => !v)}>
          <Feather name="list" size={14} color={theme.corPrimaria} />
          <Text style={styles.botaoSecundarioTexto}>{mostrarTabela ? 'Ocultar tabela' : 'Tabela de Requerimentos'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoPrimario} onPress={() => setMostrarForm((v) => !v)}>
          <Text style={styles.botaoPrimarioTexto}>{mostrarForm ? 'Cancelar' : '+ Novo Requerimento'}</Text>
        </TouchableOpacity>
      </View>

      {mostrarTabela ? (
        tipos === null ? (
          <Carregando />
        ) : (
          <View style={styles.tabela}>
            {tipos.map((t) => (
              <View key={t.id} style={styles.tabelaLinha}>
                <Text style={styles.tabelaNome}>{t.nome}</Text>
                <Text style={styles.tabelaDetalhe}>
                  {t.prazoDias ? `Prazo: ${t.prazoDias} dia(s) · ` : ''}R$ {formatarTaxa(t)}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : null}

      {mostrarForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Requerimento</Text>
          <View style={styles.chipsLista}>
            {(tipos ?? []).map((t) => {
              const ativo = t.id === tipoId;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setTipoId(t.id)}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{t.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {tipoSelecionado ? (
            <Text style={styles.formInfo}>
              Taxa: R$ {formatarTaxa(tipoSelecionado)}
              {tipoSelecionado.prazoDias ? ` · Prazo: ${tipoSelecionado.prazoDias} dia(s)` : ''}
            </Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Observações (opcional)"
            placeholderTextColor={theme.cinza400}
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
          <TouchableOpacity
            style={[styles.botaoPrimario, (!tipoId || enviando) && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={!tipoId || enviando}
          >
            <Text style={styles.botaoPrimarioTexto}>{enviando ? 'Enviando...' : 'Solicitar'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.secaoTitulo}>Meus requerimentos</Text>
      {meus === null ? (
        <Carregando />
      ) : meus.length === 0 ? (
        <Text style={styles.vazio}>Você ainda não abriu nenhum requerimento.</Text>
      ) : (
        meus.map((r) => (
          <View key={r.id} style={styles.requerimentoCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.requerimentoNome}>{r.tipoCatalogo?.nome ?? 'Outro'}</Text>
              <Text style={styles.requerimentoData}>{new Date(r.criadoEm).toLocaleDateString('pt-BR')}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: (STATUS_COR[r.status] ?? theme.cinza500) + '22' }]}>
              <Text style={[styles.statusTexto, { color: STATUS_COR[r.status] ?? theme.cinza500 }]}>
                {STATUS_LABEL[r.status] ?? r.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, paddingTop: 56, gap: 10 },
  titulo: { fontSize: 20, fontWeight: '700', color: theme.cinza900 },
  subtitulo: { fontSize: 13, color: theme.cinza500, marginTop: 2, marginBottom: 4 },
  botoesTopo: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  botaoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.corPrimaria,
    borderRadius: 8,
    paddingVertical: 10,
  },
  botaoSecundarioTexto: { color: theme.corPrimaria, fontSize: 12, fontWeight: '700' },
  botaoPrimario: { flex: 1, backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  botaoPrimarioTexto: { color: theme.branco, fontSize: 12, fontWeight: '700' },
  tabela: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, overflow: 'hidden' },
  tabelaLinha: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.cinza100 },
  tabelaNome: { fontSize: 13, fontWeight: '600', color: theme.cinza900 },
  tabelaDetalhe: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
  formCard: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, padding: 14, gap: 10 },
  formLabel: { fontSize: 12, fontWeight: '700', color: theme.cinza700 },
  chipsLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: theme.cinza200, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.branco },
  chipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  chipTexto: { fontSize: 11, fontWeight: '600', color: theme.cinza700 },
  chipTextoAtivo: { color: theme.branco },
  formInfo: { fontSize: 12, color: theme.cinza500, backgroundColor: theme.cinza50, padding: 8, borderRadius: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.cinza200,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.cinza900,
    backgroundColor: theme.branco,
    minHeight: 44,
  },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900, marginTop: 8 },
  vazio: { fontSize: 13, color: theme.cinza500 },
  requerimentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cinza200,
    padding: 12,
  },
  requerimentoNome: { fontSize: 13, fontWeight: '600', color: theme.cinza900 },
  requerimentoData: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusTexto: { fontSize: 11, fontWeight: '700' },
});
