import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../lib/api';
import {
  AvisoTurma,
  criarAvisoTurma,
  formatarDataHora,
  getAvisosTurma,
  getOfertas,
  Oferta,
  TagAviso,
  TAGS_AVISO,
} from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, Cartao, MensagemErro, Pill, SeletorOferta } from '../../lib/ui';

const COR_TAG: Record<TagAviso, string> = {
  GERAL: theme.corPrimaria,
  IMPORTANTE: theme.corSecundaria,
};

/**
 * Aviso para Turma — envia um aviso escopado à turma escolhida; quem tem o
 * app do aluno instalado recebe push notification também (ver
 * DocenteService.criarAvisoTurma no backend).
 */
export default function AvisoTurmaScreen() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [tag, setTag] = useState<TagAviso>('GERAL');

  const [avisos, setAvisos] = useState<AvisoTurma[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregarAvisos = useCallback(async () => {
    try {
      setAvisos(await getAvisosTurma());
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os avisos já enviados.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const os = await getOfertas();
        setOfertas(os);
        if (os.length > 0) setOfertaId(os[0].id);
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar suas turmas.');
      }
      await carregarAvisos();
    })();
  }, [carregarAvisos]);

  async function enviar() {
    if (!ofertaId || !titulo.trim() || !texto.trim()) {
      setErro('Selecione a turma e preencha título e texto.');
      return;
    }
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      const resultado = await criarAvisoTurma({ ofertaId, titulo: titulo.trim(), texto: texto.trim(), tag });
      setSucesso(`Aviso enviado! Push notification disparado para ${resultado.push.destinatarios} dispositivo(s).`);
      setTitulo('');
      setTexto('');
      await carregarAvisos();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o aviso.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <SeletorOferta ofertas={ofertas} selecionada={ofertaId} aoSelecionar={setOfertaId} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        {sucesso ? <Text style={styles.sucesso}>{sucesso}</Text> : null}

        <View style={styles.form}>
          <Text style={styles.rotulo}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Prova remarcada para sexta-feira"
            placeholderTextColor={theme.cinza400}
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.rotulo}>Texto</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Detalhes do aviso..."
            placeholderTextColor={theme.cinza400}
            value={texto}
            onChangeText={setTexto}
            multiline
          />

          <Text style={styles.rotulo}>Tag</Text>
          <View style={styles.tagsLinha}>
            {TAGS_AVISO.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.tagChip, tag === t.value && { backgroundColor: COR_TAG[t.value], borderColor: COR_TAG[t.value] }]}
                onPress={() => setTag(t.value)}
              >
                <Text style={[styles.tagChipTexto, tag === t.value && styles.tagChipTextoAtivo]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.botaoEnviar, enviando && { opacity: 0.6 }]} onPress={enviar} disabled={enviando}>
            <Text style={styles.botaoEnviarTexto}>{enviando ? 'Enviando...' : 'Enviar aviso'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.secaoTitulo}>Avisos já enviados</Text>
        {avisos === null ? (
          <Carregando />
        ) : avisos.length > 0 ? (
          avisos.map((a) => (
            <Cartao key={a.id}>
              <View style={styles.avisoTopo}>
                <Text style={styles.avisoTitulo}>{a.titulo}</Text>
                <Pill texto={a.tag === 'IMPORTANTE' ? 'Importante' : 'Geral'} cor={COR_TAG[a.tag]} />
              </View>
              {a.oferta ? <Text style={styles.avisoTurma}>{a.oferta.disciplina.codigo} - {a.oferta.disciplina.nome}</Text> : null}
              <Text style={styles.avisoTexto}>{a.texto}</Text>
              <Text style={styles.avisoData}>{formatarDataHora(a.criadoEm)}</Text>
            </Cartao>
          ))
        ) : (
          <Text style={styles.vazio}>Nenhum aviso de turma enviado ainda.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, paddingTop: 8, gap: 10 },
  erro: { color: theme.erro, fontSize: 12, marginBottom: 4 },
  sucesso: { color: theme.sucesso, fontSize: 12, marginBottom: 4 },
  form: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, padding: 14, gap: 4 },
  rotulo: { fontSize: 11, fontWeight: '700', color: theme.cinza700, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: theme.cinza200,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.cinza900,
    backgroundColor: theme.branco,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  tagsLinha: { flexDirection: 'row', gap: 8 },
  tagChip: { borderWidth: 1, borderColor: theme.cinza200, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  tagChipTexto: { fontSize: 12, fontWeight: '600', color: theme.cinza700 },
  tagChipTextoAtivo: { color: theme.branco },
  botaoEnviar: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  botaoEnviarTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: theme.cinza900, marginTop: 8 },
  avisoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avisoTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900, flex: 1, marginRight: 8 },
  avisoTurma: { fontSize: 11, color: theme.corPrimaria, fontWeight: '600', marginTop: 4 },
  avisoTexto: { fontSize: 12, color: theme.cinza700, marginTop: 6 },
  avisoData: { fontSize: 11, color: theme.cinza500, marginTop: 8 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
