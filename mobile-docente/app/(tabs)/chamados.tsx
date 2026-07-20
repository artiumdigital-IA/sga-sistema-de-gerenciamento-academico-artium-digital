import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../lib/api';
import {
  Chamado,
  criarChamado,
  getMeusChamados,
  getTiposChamado,
  Prioridade,
  PRIORIDADES,
  STATUS_CHAMADO_LABEL,
  StatusChamado,
  TipoChamado,
} from '../../lib/chamados';
import { formatarData } from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, Cartao, Pill } from '../../lib/ui';

const COR_STATUS: Record<StatusChamado, string> = {
  ABERTO: theme.corPrimaria,
  EM_ANDAMENTO: theme.aviso,
  CONCLUIDO: theme.sucesso,
  CANCELADO: theme.cinza500,
};

const COR_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: theme.cinza500,
  MEDIA: theme.corPrimaria,
  ALTA: theme.aviso,
  URGENTE: theme.erro,
};

/**
 * Chamado de Manutenção — abrir e acompanhar chamados de suporte (elétrica,
 * hidráulica, TI, mobiliário etc.). Diferente das outras telas de Docentes
 * On, não é escopado a uma turma/oferta — é sobre a instalação física. Quem
 * atende é a equipe de suporte (perfil SUPORTE), pelo dashboard web.
 */
export default function ChamadosScreen() {
  const [tipos, setTipos] = useState<TipoChamado[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [local, setLocal] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const [chamados, setChamados] = useState<Chamado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregarChamados = useCallback(async () => {
    try {
      setChamados(await getMeusChamados());
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar seus chamados.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const ts = await getTiposChamado();
        setTipos(ts);
        if (ts.length > 0) setTipoId(ts[0].id);
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os tipos de chamado.');
      }
      await carregarChamados();
    })();
  }, [carregarChamados]);

  async function abrirChamado() {
    if (!tipoId || !local.trim() || !titulo.trim()) {
      setErro('Selecione o tipo e preencha local e título.');
      return;
    }
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      const criado = await criarChamado({
        tipoId,
        local: local.trim(),
        prioridade,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
      });
      setSucesso(`Chamado ${criado.numero} aberto com sucesso.`);
      setLocal('');
      setTitulo('');
      setDescricao('');
      setPrioridade('MEDIA');
      await carregarChamados();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível abrir o chamado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {sucesso ? <Text style={styles.sucesso}>{sucesso}</Text> : null}

      <View style={styles.form}>
        <Text style={styles.rotulo}>Tipo</Text>
        <View style={styles.chipsLinha}>
          {tipos.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, tipoId === t.id && styles.chipAtivo]}
              onPress={() => setTipoId(t.id)}
            >
              <Text style={[styles.chipTexto, tipoId === t.id && styles.chipTextoAtivo]}>{t.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.rotulo}>Local</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Sala 101"
          placeholderTextColor={theme.cinza400}
          value={local}
          onChangeText={setLocal}
        />

        <Text style={styles.rotulo}>Prioridade</Text>
        <View style={styles.chipsLinha}>
          {PRIORIDADES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.chip, prioridade === p.value && { backgroundColor: COR_PRIORIDADE[p.value], borderColor: COR_PRIORIDADE[p.value] }]}
              onPress={() => setPrioridade(p.value)}
            >
              <Text style={[styles.chipTexto, prioridade === p.value && styles.chipTextoAtivo]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.rotulo}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Ar-condicionado não liga"
          placeholderTextColor={theme.cinza400}
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.rotulo}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Detalhes do problema..."
          placeholderTextColor={theme.cinza400}
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <TouchableOpacity style={[styles.botaoEnviar, enviando && { opacity: 0.6 }]} onPress={abrirChamado} disabled={enviando}>
          <Text style={styles.botaoEnviarTexto}>{enviando ? 'Enviando...' : 'Abrir chamado'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.secaoTitulo}>Meus chamados</Text>
      {chamados === null ? (
        <Carregando />
      ) : chamados.length > 0 ? (
        chamados.map((c) => (
          <Cartao key={c.id}>
            <View style={styles.chamadoTopo}>
              <Text style={styles.chamadoNumero}>{c.numero}</Text>
              <Pill texto={STATUS_CHAMADO_LABEL[c.status]} cor={COR_STATUS[c.status]} />
            </View>
            <Text style={styles.chamadoTitulo}>{c.titulo}</Text>
            <Text style={styles.chamadoSub}>{c.tipo.nome} · {c.local}</Text>
            <Text style={styles.chamadoData}>Aberto em {formatarData(c.dataAbertura)}</Text>
          </Cartao>
        ))
      ) : (
        <Text style={styles.vazio}>Você ainda não abriu nenhum chamado.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, gap: 10 },
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
  chipsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.cinza200, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  chipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  chipTexto: { fontSize: 12, fontWeight: '600', color: theme.cinza700 },
  chipTextoAtivo: { color: theme.branco },
  botaoEnviar: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  botaoEnviarTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: theme.cinza900, marginTop: 8 },
  chamadoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chamadoNumero: { fontSize: 12, fontWeight: '700', color: theme.cinza500 },
  chamadoTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900, marginTop: 6 },
  chamadoSub: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
  chamadoData: { fontSize: 11, color: theme.cinza500, marginTop: 8 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
