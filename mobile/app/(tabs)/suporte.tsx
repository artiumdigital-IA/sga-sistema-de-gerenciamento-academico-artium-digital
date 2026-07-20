import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../lib/api';
import {
  Chamado,
  criarChamado,
  formatarData,
  getMeusChamados,
  getTiposChamado,
  Prioridade,
  PRIORIDADES,
  STATUS_CHAMADO_LABEL,
  StatusChamado,
  TipoChamado,
} from '../../lib/chamados';
import { theme } from '../../lib/theme';
import { Cartao, Carregando, MensagemErro } from '../../lib/ui';

/**
 * Suporte — abrir e acompanhar chamados de manutenção (elétrica, hidráulica,
 * TI, mobiliário etc.). Substitui o placeholder antigo (lista de itens "Em
 * breve" sem nenhum backend) por uma feature real, mesmo padrão de abas do
 * módulo Biblioteca (biblioteca.tsx): "Abrir Chamado" / "Meus Chamados".
 * Quem atende é a equipe de suporte (perfil SUPORTE), pelo dashboard
 * web — aqui é só autoatendimento do lado do aluno.
 */
const COR_STATUS: Record<StatusChamado, string> = {
  EM_ANDAMENTO: theme.aviso,
  ABERTO: theme.corPrimaria,
  CONCLUIDO: theme.sucesso,
  CANCELADO: theme.cinza500,
};

const COR_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: theme.cinza500,
  MEDIA: theme.corPrimaria,
  ALTA: theme.aviso,
  URGENTE: theme.erro,
};

type Aba = 'abrir' | 'meus';

export default function SuporteScreen() {
  const [aba, setAba] = useState<Aba>('abrir');

  const [tipos, setTipos] = useState<TipoChamado[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [local, setLocal] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [chamados, setChamados] = useState<Chamado[] | null>(null);
  const [erroChamados, setErroChamados] = useState<string | null>(null);

  const carregarChamados = useCallback(async () => {
    setErroChamados(null);
    try {
      setChamados(await getMeusChamados());
    } catch (err) {
      setErroChamados(err instanceof ApiError ? err.message : 'Não foi possível carregar seus chamados.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const ts = await getTiposChamado();
        setTipos(ts);
        if (ts.length > 0) setTipoId(ts[0].id);
      } catch (err) {
        setErroForm(err instanceof ApiError ? err.message : 'Não foi possível carregar os tipos de chamado.');
      }
      await carregarChamados();
    })();
  }, [carregarChamados]);

  async function abrirChamado() {
    if (!tipoId || !local.trim() || !titulo.trim()) {
      setErroForm('Selecione o tipo e preencha local e título.');
      return;
    }
    setErroForm(null);
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
      setErroForm(err instanceof ApiError ? err.message : 'Não foi possível abrir o chamado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Suporte</Text>
        <Text style={styles.subtitulo}>Abra e acompanhe chamados de manutenção</Text>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity style={[styles.aba, aba === 'abrir' && styles.abaAtiva]} onPress={() => setAba('abrir')}>
          <Text style={[styles.abaTexto, aba === 'abrir' && styles.abaTextoAtivo]}>Abrir Chamado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aba, aba === 'meus' && styles.abaAtiva]} onPress={() => setAba('meus')}>
          <Text style={[styles.abaTexto, aba === 'meus' && styles.abaTextoAtivo]}>Meus Chamados</Text>
        </TouchableOpacity>
      </View>

      {aba === 'abrir' ? (
        <ScrollView contentContainerStyle={styles.conteudo}>
          {erroForm ? <Text style={styles.erro}>{erroForm}</Text> : null}
          {sucesso ? <Text style={styles.sucesso}>{sucesso}</Text> : null}

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
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}>
          {chamados === null && !erroChamados ? (
            <Carregando />
          ) : erroChamados ? (
            <MensagemErro mensagem={erroChamados} aoTentarNovamente={carregarChamados} />
          ) : chamados && chamados.length > 0 ? (
            chamados.map((c) => (
              <Cartao key={c.id}>
                <View style={styles.chamadoTopo}>
                  <Text style={styles.chamadoNumero}>{c.numero}</Text>
                  <View style={[styles.statusPill, { backgroundColor: COR_STATUS[c.status] }]}>
                    <Text style={styles.statusPillTexto}>{STATUS_CHAMADO_LABEL[c.status]}</Text>
                  </View>
                </View>
                <Text style={styles.chamadoTitulo}>{c.titulo}</Text>
                <Text style={styles.chamadoSub}>{c.tipo.nome} · {c.local}</Text>
                <Text style={styles.chamadoData}>Aberto em {formatarData(c.dataAbertura)}</Text>
              </Cartao>
            ))
          ) : (
            <Cartao>
              <Text style={styles.vazio}>Você ainda não abriu nenhum chamado.</Text>
            </Cartao>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  header: { backgroundColor: theme.corPrimaria, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 },
  titulo: { fontSize: 20, fontWeight: '700', color: theme.branco, textAlign: 'center' },
  subtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 6 },
  abas: { flexDirection: 'row', backgroundColor: theme.branco, borderBottomWidth: 1, borderBottomColor: theme.cinza200 },
  aba: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaAtiva: { borderBottomColor: theme.corPrimaria },
  abaTexto: { fontSize: 13, fontWeight: '600', color: theme.cinza400 },
  abaTextoAtivo: { color: theme.corPrimaria },
  conteudo: { padding: 16, gap: 10 },
  erro: { color: theme.erro, fontSize: 12, marginBottom: 4 },
  sucesso: { color: theme.sucesso, fontSize: 12, marginBottom: 4 },
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
  chip: { borderWidth: 1, borderColor: theme.cinza200, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.branco },
  chipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  chipTexto: { fontSize: 12, fontWeight: '600', color: theme.cinza700 },
  chipTextoAtivo: { color: theme.branco },
  botaoEnviar: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  botaoEnviarTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
  chamadoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chamadoNumero: { fontSize: 12, fontWeight: '700', color: theme.cinza500 },
  chamadoTitulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900, marginTop: 6 },
  chamadoSub: { fontSize: 12, color: theme.cinza500, marginTop: 2 },
  chamadoData: { fontSize: 11, color: theme.cinza500, marginTop: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusPillTexto: { fontSize: 11, fontWeight: '700', color: theme.branco },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
