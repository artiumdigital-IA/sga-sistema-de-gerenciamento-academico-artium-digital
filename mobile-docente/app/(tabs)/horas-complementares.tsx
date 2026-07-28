import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { ApiError, apiFileUrl } from '../../lib/api';
import {
  AlunoDocente,
  criarHoraComplementar,
  criarHoraComplementarDoRequerimento,
  formatarDataHora,
  getAlunos,
  getHoraComplementarPendente,
  getHorasComplementares,
  HoraComplementar,
  HoraComplementarPendente,
  removerHoraComplementar,
} from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro } from '../../lib/ui';

type ArquivoSelecionado = { uri: string; name: string; type: string };

/**
 * Horas Complementares — mesmo padrão visual da Captura de Prova, mas sem
 * seletor de turma: horas complementares são do curso como um todo, não de
 * uma disciplina específica (ver backend/src/docente/docente.service.ts).
 * Professor escolhe o aluno (entre todas as suas turmas), captura o
 * certificado (foto/galeria/PDF) e informa a quantidade de horas.
 */
export default function HorasComplementaresScreen() {
  const [alunos, setAlunos] = useState<AlunoDocente[] | null>(null);
  const [alunoId, setAlunoId] = useState<string | null>(null);

  const [lancamentos, setLancamentos] = useState<HoraComplementar[] | null>(null);
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
  const [horas, setHoras] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Requerimento de Hora Complementar que o próprio aluno abriu (autoatendimento,
  // certificado já anexado) e ainda não virou crédito real — quando existe, a
  // gente reaproveita o certificado dele em vez de pedir foto/PDF de novo.
  const [pendente, setPendente] = useState<HoraComplementarPendente | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setAlunos(await getAlunos());
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar seus alunos.');
      }
    })();
  }, []);

  const carregarLancamentos = useCallback(async (aluno: string) => {
    setCarregando(true);
    setErro(null);
    try {
      setLancamentos(await getHorasComplementares({ alunoId: aluno }));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os lançamentos já feitos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarPendente = useCallback(async (aluno: string) => {
    try {
      setPendente(await getHoraComplementarPendente(aluno));
    } catch {
      setPendente(null); // requerimento pendente é só um atalho — se falhar, cai no fluxo manual normal
    }
  }, []);

  useEffect(() => {
    setArquivo(null);
    setHoras('');
    setObservacoes('');
    setPendente(null);
    if (alunoId) {
      carregarLancamentos(alunoId);
      carregarPendente(alunoId);
    }
  }, [alunoId, carregarLancamentos, carregarPendente]);

  const certificadoPendenteEhPdf = pendente?.arquivoNome?.toLowerCase().endsWith('.pdf') ?? false;

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

  async function lancar() {
    const horasNum = Number(horas.trim());
    if (!alunoId || (!pendente && !arquivo)) {
      setErro('Selecione o aluno e o certificado (foto ou PDF).');
      return;
    }
    if (!horas || !Number.isInteger(horasNum) || horasNum < 1) {
      setErro('Informe a quantidade de horas (número inteiro, mínimo 1).');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      if (pendente) {
        await criarHoraComplementarDoRequerimento({ requerimentoId: pendente.id, horas: horasNum, observacoes: observacoes.trim() || undefined });
        await carregarPendente(alunoId); // pode haver outro certificado do aluno ainda pendente
      } else if (arquivo) {
        await criarHoraComplementar({ alunoId, horas: horasNum, observacoes: observacoes.trim() || undefined, arquivo });
      }
      setArquivo(null);
      setHoras('');
      setObservacoes('');
      await carregarLancamentos(alunoId);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível lançar as horas.');
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao(id: string) {
    Alert.alert('Excluir lançamento', 'Tem certeza que quer excluir este lançamento de horas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerHoraComplementar(id);
            if (alunoId) await carregarLancamentos(alunoId);
          } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível excluir o lançamento.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.tela}>
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
            <Text style={styles.secaoTitulo}>Novo lançamento</Text>
            <View style={styles.novoLancamento}>
              {pendente ? (
                <>
                  <View style={styles.pendenteAviso}>
                    <Feather name="check-circle" size={14} color={theme.corPrimaria} />
                    <Text style={styles.pendenteAvisoTexto}>Certificado enviado pelo aluno no pedido de Hora Complementar</Text>
                  </View>
                  {certificadoPendenteEhPdf ? (
                    <View style={styles.previewVazio}>
                      <Feather name="file-text" size={28} color={theme.corPrimaria} />
                      <Text style={styles.previewPdfNome} numberOfLines={1}>{pendente.arquivoNome}</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: apiFileUrl(pendente.arquivoUrl) ?? undefined }} style={styles.preview} resizeMode="cover" />
                  )}
                  {pendente.descricao ? <Text style={styles.pendenteDescricao}>{pendente.descricao}</Text> : null}
                </>
              ) : arquivo && arquivo.type === 'application/pdf' ? (
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
              {!pendente && (
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
              )}
              <TextInput
                style={styles.input}
                placeholder="Quantidade de horas"
                placeholderTextColor={theme.cinza400}
                keyboardType="number-pad"
                value={horas}
                onChangeText={setHoras}
              />
              <TextInput
                style={styles.input}
                placeholder="Observações (opcional)"
                placeholderTextColor={theme.cinza400}
                value={observacoes}
                onChangeText={setObservacoes}
                multiline
              />
              <TouchableOpacity
                style={[styles.botaoEnviar, (enviando || (!pendente && !arquivo) || !horas) && { opacity: 0.6 }]}
                onPress={lancar}
                disabled={enviando || (!pendente && !arquivo) || !horas}
              >
                <Text style={styles.botaoEnviarTexto}>{enviando ? 'Lançando...' : 'Lançar horas'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.secaoTitulo}>Horas já lançadas</Text>
            {carregando ? (
              <Carregando />
            ) : lancamentos && lancamentos.length > 0 ? (
              lancamentos.map((l) => (
                <View key={l.id} style={styles.lancamentoCard}>
                  {l.nomeArquivo.toLowerCase().endsWith('.pdf') ? (
                    <View style={[styles.lancamentoThumb, styles.lancamentoThumbPdf]}>
                      <Feather name="file-text" size={20} color={theme.corPrimaria} />
                    </View>
                  ) : (
                    <Image source={{ uri: apiFileUrl(l.url) ?? undefined }} style={styles.lancamentoThumb} resizeMode="cover" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lancamentoHoras}>{l.horas}h · {formatarDataHora(l.criadoEm)}</Text>
                    {l.observacoes ? <Text style={styles.lancamentoObs}>{l.observacoes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => confirmarExclusao(l.id)}>
                    <Feather name="trash-2" size={18} color={theme.erro} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.vazio}>Nenhuma hora complementar lançada pra este aluno ainda.</Text>
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
  novoLancamento: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, padding: 14, gap: 10 },
  preview: { width: '100%', height: 180, borderRadius: 8, backgroundColor: theme.cinza100 },
  previewVazio: { width: '100%', height: 180, borderRadius: 8, backgroundColor: theme.cinza100, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  previewPdfNome: { fontSize: 12, color: theme.cinza700, fontWeight: '600' },
  pendenteAviso: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendenteAvisoTexto: { fontSize: 11, color: theme.corPrimaria, fontWeight: '600', flexShrink: 1 },
  pendenteDescricao: { fontSize: 12, color: theme.cinza500 },
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
  botaoEnviar: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  botaoEnviarTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
  lancamentoCard: {
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
  lancamentoThumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: theme.cinza100 },
  lancamentoThumbPdf: { alignItems: 'center', justifyContent: 'center' },
  lancamentoHoras: { fontSize: 12, fontWeight: '600', color: theme.cinza900 },
  lancamentoObs: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
