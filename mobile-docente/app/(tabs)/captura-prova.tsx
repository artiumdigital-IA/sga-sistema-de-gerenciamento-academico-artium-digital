import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ApiError, apiFileUrl } from '../../lib/api';
import {
  AlunoDocente,
  CapturaProva,
  criarCaptura,
  formatarDataHora,
  getAlunos,
  getCapturas,
  getOfertas,
  Oferta,
  removerCaptura,
} from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro, SeletorOferta } from '../../lib/ui';

type ArquivoSelecionado = { uri: string; name: string; type: string };

/**
 * Captura de Prova — foto (câmera ou galeria) ou o que o usuário escolher
 * da galeria (pode ser um PDF exportado como imagem também) da prova física
 * corrigida de um aluno. Backend aceita pdf/jpg/jpeg/png/webp até 10MB (ver
 * backend/src/docente/docente.controller.ts) — aqui só oferecemos
 * câmera/galeria de imagem, que cobre o caso de uso principal (foto da
 * prova em papel); anexar um PDF de verdade ficaria pra uma rodada futura
 * com expo-document-picker.
 */
export default function CapturaProvaScreen() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState<string | null>(null);

  const [alunos, setAlunos] = useState<AlunoDocente[] | null>(null);
  const [alunoId, setAlunoId] = useState<string | null>(null);

  const [capturas, setCapturas] = useState<CapturaProva[] | null>(null);
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
  const [observacoes, setObservacoes] = useState('');

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const os = await getOfertas();
        setOfertas(os);
        if (os.length > 0) setOfertaId(os[0].id);
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar suas turmas.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!ofertaId) return;
    setAlunoId(null);
    setCapturas(null);
    (async () => {
      try {
        setAlunos(await getAlunos(ofertaId));
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os alunos desta turma.');
      }
    })();
  }, [ofertaId]);

  const carregarCapturas = useCallback(async (oferta: string, aluno: string) => {
    setCarregando(true);
    setErro(null);
    try {
      setCapturas(await getCapturas({ ofertaId: oferta, alunoId: aluno }));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar as capturas já enviadas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (ofertaId && alunoId) carregarCapturas(ofertaId, alunoId);
  }, [ofertaId, alunoId, carregarCapturas]);

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
      name: asset.fileName ?? `prova-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function enviar() {
    if (!ofertaId || !alunoId || !arquivo) {
      setErro('Selecione a turma, o aluno e a foto da prova.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await criarCaptura({ ofertaId, alunoId, observacoes: observacoes.trim() || undefined, arquivo });
      setArquivo(null);
      setObservacoes('');
      await carregarCapturas(ofertaId, alunoId);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a captura.');
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao(id: string) {
    Alert.alert('Excluir captura', 'Tem certeza que quer excluir esta captura?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerCaptura(id);
            if (ofertaId && alunoId) await carregarCapturas(ofertaId, alunoId);
          } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível excluir a captura.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.tela}>
      <SeletorOferta ofertas={ofertas} selecionada={ofertaId} aoSelecionar={setOfertaId} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        {erro ? <MensagemErro mensagem={erro} /> : null}

        <Text style={styles.secaoTitulo}>Aluno</Text>
        {alunos === null ? (
          <Carregando />
        ) : (
          <View style={styles.alunosLista}>
            {alunos.map((a) => {
              const ativo = a.aluno.id === alunoId;
              return (
                <TouchableOpacity
                  key={a.aluno.id}
                  style={[styles.alunoChip, ativo && styles.alunoChipAtivo]}
                  onPress={() => setAlunoId(a.aluno.id)}
                >
                  <Text style={[styles.alunoChipTexto, ativo && styles.alunoChipTextoAtivo]}>{a.aluno.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {alunoId ? (
          <>
            <Text style={styles.secaoTitulo}>Nova captura</Text>
            <View style={styles.novaCaptura}>
              {arquivo ? (
                <Image source={{ uri: arquivo.uri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <View style={styles.previewVazio}>
                  <Feather name="image" size={28} color={theme.cinza400} />
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
              </View>
              <TextInput
                style={styles.input}
                placeholder="Observações (opcional)"
                placeholderTextColor={theme.cinza400}
                value={observacoes}
                onChangeText={setObservacoes}
                multiline
              />
              <TouchableOpacity
                style={[styles.botaoEnviar, (enviando || !arquivo) && { opacity: 0.6 }]}
                onPress={enviar}
                disabled={enviando || !arquivo}
              >
                <Text style={styles.botaoEnviarTexto}>{enviando ? 'Enviando...' : 'Enviar captura'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.secaoTitulo}>Capturas já enviadas</Text>
            {carregando ? (
              <Carregando />
            ) : capturas && capturas.length > 0 ? (
              capturas.map((c) => (
                <View key={c.id} style={styles.capturaCard}>
                  <Image source={{ uri: apiFileUrl(c.url) ?? undefined }} style={styles.capturaThumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.capturaData}>{formatarDataHora(c.criadoEm)}</Text>
                    {c.observacoes ? <Text style={styles.capturaObs}>{c.observacoes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => confirmarExclusao(c.id)}>
                    <Feather name="trash-2" size={18} color={theme.erro} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.vazio}>Nenhuma captura enviada pra este aluno nesta turma ainda.</Text>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, paddingTop: 8, gap: 8 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900, marginTop: 12, marginBottom: 8 },
  alunosLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alunoChip: { borderWidth: 1, borderColor: theme.cinza200, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.branco },
  alunoChipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  alunoChipTexto: { fontSize: 12, fontWeight: '600', color: theme.cinza700 },
  alunoChipTextoAtivo: { color: theme.branco },
  novaCaptura: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, padding: 14, gap: 10 },
  preview: { width: '100%', height: 180, borderRadius: 8, backgroundColor: theme.cinza100 },
  previewVazio: { width: '100%', height: 180, borderRadius: 8, backgroundColor: theme.cinza100, alignItems: 'center', justifyContent: 'center' },
  botoesFoto: { flexDirection: 'row', gap: 8 },
  botaoFoto: {
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
  botaoEnviar: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  botaoEnviarTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
  capturaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cinza200,
    padding: 10,
    marginBottom: 8,
  },
  capturaThumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: theme.cinza100 },
  capturaData: { fontSize: 12, fontWeight: '600', color: theme.cinza900 },
  capturaObs: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
