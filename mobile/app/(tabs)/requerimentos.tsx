import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { ApiError } from '../../lib/api';
import {
  abrirRequerimento,
  abrirRequerimentoComArquivo,
  formatarTaxa,
  getMeusRequerimentos,
  getTiposRequerimento,
  Requerimento,
  TipoRequerimento,
} from '../../lib/discente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro } from '../../lib/ui';

type ArquivoSelecionado = { uri: string; name: string; type: string };

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
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
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

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera nas configurações do celular pra tirar a foto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    aplicarResultado(resultado);
  }

  async function escolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos nas configurações do celular.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    aplicarResultado(resultado);
  }

  function aplicarResultado(resultado: ImagePicker.ImagePickerResult) {
    if (resultado.canceled || resultado.assets.length === 0) return;
    const asset = resultado.assets[0];
    setArquivo({
      uri: asset.uri,
      name: asset.fileName ?? `certificado-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function anexarPdf() {
    const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (resultado.canceled || resultado.assets.length === 0) return;
    const asset = resultado.assets[0];
    setArquivo({
      uri: asset.uri,
      name: asset.name ?? `certificado-${Date.now()}.pdf`,
      type: asset.mimeType ?? 'application/pdf',
    });
  }

  function selecionarTipo(id: string) {
    setTipoId(id);
    setArquivo(null);
  }

  async function enviar() {
    if (!tipoId) return;
    setEnviando(true);
    setErro(null);
    try {
      if (arquivo) {
        await abrirRequerimentoComArquivo({ tipoCatalogoId: tipoId, descricao: descricao.trim() || undefined, arquivo });
      } else {
        await abrirRequerimento({ tipoCatalogoId: tipoId, descricao: descricao.trim() || undefined });
      }
      setTipoId(null);
      setDescricao('');
      setArquivo(null);
      setMostrarForm(false);
      await carregarMeus();
    } catch (err) {
      // DIAGNOSTICO TEMPORARIO — tirar depois de descobrir a causa do "não
      // foi possível enviar" em produção com anexo real de celular.
      console.error('[requerimentos] erro ao enviar (detalhe):', err, arquivo ? { nome: arquivo.name, tipo: arquivo.type, uri: arquivo.uri } : null);
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o requerimento.');
    } finally {
      setEnviando(false);
    }
  }

  const tipoSelecionado = tipos?.find((t) => t.id === tipoId) ?? null;
  const precisaAnexo = !!tipoSelecionado?.exigeAnexo;

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
                  {t.prazoDias ? `Prazo: ${t.prazoDias} dia(s) · ` : ''}{formatarTaxa(t)}
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
                  onPress={() => selecionarTipo(t.id)}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{t.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {tipoSelecionado ? (
            <Text style={styles.formInfo}>
              Taxa: {formatarTaxa(tipoSelecionado)}
              {tipoSelecionado.prazoDias ? ` · Prazo: ${tipoSelecionado.prazoDias} dia(s)` : ''}
            </Text>
          ) : null}

          {precisaAnexo ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.formLabel}>Certificado (foto ou PDF) *</Text>
              {arquivo && arquivo.type === 'application/pdf' ? (
                <View style={styles.previewVazio}>
                  <Feather name="file-text" size={28} color={theme.corPrimaria} />
                  <Text style={styles.previewPdfNome} numberOfLines={1}>{arquivo.name}</Text>
                </View>
              ) : arquivo ? (
                <Image source={{ uri: arquivo.uri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <View style={styles.previewVazio}>
                  <Feather name="award" size={28} color={theme.cinza400} />
                </View>
              )}
              <View style={styles.botoesFoto}>
                <TouchableOpacity style={styles.botaoFoto} onPress={tirarFoto}>
                  <Feather name="camera" size={16} color={theme.corPrimaria} />
                  <Text style={styles.botaoFotoTexto}>Tirar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoFoto} onPress={escolherDaGaleria}>
                  <Feather name="image" size={16} color={theme.corPrimaria} />
                  <Text style={styles.botaoFotoTexto}>Galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoFoto} onPress={anexarPdf}>
                  <Feather name="file-text" size={16} color={theme.corPrimaria} />
                  <Text style={styles.botaoFotoTexto}>Anexar PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
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
            style={[styles.botaoPrimario, (!tipoId || (precisaAnexo && !arquivo) || enviando) && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={!tipoId || (precisaAnexo && !arquivo) || enviando}
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
  preview: { width: '100%', height: 160, borderRadius: 8, backgroundColor: theme.cinza100 },
  previewVazio: { width: '100%', height: 160, borderRadius: 8, backgroundColor: theme.cinza100, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  previewPdfNome: { fontSize: 12, color: theme.cinza700, fontWeight: '600' },
  botoesFoto: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botaoFoto: {
    flexGrow: 1,
    flexBasis: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.corPrimaria,
    borderRadius: 8,
    paddingVertical: 10,
  },
  botaoFotoTexto: { color: theme.corPrimaria, fontSize: 12, fontWeight: '700' },
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
