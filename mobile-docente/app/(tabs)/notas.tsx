import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError } from '../../lib/api';
import {
  Avaliacao,
  AvaliacaoTipo,
  consolidarResultado,
  criarAvaliacao,
  getAvaliacoes,
  getMatriculasDaOferta,
  getOfertas,
  MatriculaComResultado,
  MatriculaStatus,
  Oferta,
  removerAvaliacao,
  STATUS_MATRICULA_LABEL,
  TIPO_AVALIACAO_LABEL,
} from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro, Pill, SeletorOferta } from '../../lib/ui';

/**
 * Notas — avaliações individuais (tipo/nota/peso) + consolidação de
 * resultado (média + frequência), mesma regra já usada no dashboard web
 * (ver frontend/app/dashboard/academico/notas). Coexiste com a tela Pauta
 * (regra AV1-AV5 por semestre) — decisão de qual é a fonte de verdade pra
 * situação final do aluno ainda está em aberto no projeto (ver CLAUDE.md).
 */
const CORES_STATUS: Record<MatriculaStatus, string> = {
  MATRICULADO: theme.corPrimaria,
  PENDENTE_EXAME: theme.aviso,
  APROVADO: theme.sucesso,
  REPROVADO: theme.erro,
  DEPENDENCIA: '#7c3aed',
  TRANCADO: theme.cinza500,
  CANCELADO: theme.cinza500,
};

const TIPOS: AvaliacaoTipo[] = ['PROVA', 'TRABALHO', 'SEMINARIO', 'EXAME_FINAL', 'OUTRO'];

export default function NotasScreen() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState<string | null>(null);
  const [matriculas, setMatriculas] = useState<MatriculaComResultado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoLista, setCarregandoLista] = useState(false);

  const [expandida, setExpandida] = useState<string | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[] | null>(null);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const [tipo, setTipo] = useState<AvaliacaoTipo>('PROVA');
  const [nota, setNota] = useState('');
  const [peso, setPeso] = useState('1');
  const [faltas, setFaltas] = useState('');
  const [totalAulas, setTotalAulas] = useState('');

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

  const carregarMatriculas = useCallback(async (id: string) => {
    setErro(null);
    setCarregandoLista(true);
    try {
      setMatriculas(await getMatriculasDaOferta(id));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os alunos desta turma.');
    } finally {
      setCarregandoLista(false);
    }
  }, []);

  useEffect(() => {
    if (ofertaId) {
      setExpandida(null);
      carregarMatriculas(ofertaId);
    }
  }, [ofertaId, carregarMatriculas]);

  async function abrirAluno(matriculaId: string) {
    if (expandida === matriculaId) {
      setExpandida(null);
      return;
    }
    setExpandida(matriculaId);
    setErroAcao(null);
    setNota('');
    setPeso('1');
    setTipo('PROVA');
    setFaltas('');
    setTotalAulas('');
    setCarregandoAvaliacoes(true);
    try {
      setAvaliacoes(await getAvaliacoes(matriculaId));
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível carregar as avaliações.');
      setAvaliacoes([]);
    } finally {
      setCarregandoAvaliacoes(false);
    }
  }

  async function adicionarAvaliacao(matriculaId: string) {
    const notaNum = Number(nota.replace(',', '.'));
    const pesoNum = Number(peso.replace(',', '.'));
    if (!nota || Number.isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      setErroAcao('Informe uma nota válida entre 0 e 10.');
      return;
    }
    if (!peso || Number.isNaN(pesoNum) || pesoNum <= 0) {
      setErroAcao('Informe um peso válido maior que 0.');
      return;
    }
    setErroAcao(null);
    setProcessando(true);
    try {
      await criarAvaliacao({ matriculaDisciplinaId: matriculaId, tipo, nota: notaNum, peso: pesoNum });
      setAvaliacoes(await getAvaliacoes(matriculaId));
      setNota('');
      setPeso('1');
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível lançar a avaliação.');
    } finally {
      setProcessando(false);
    }
  }

  async function excluirAvaliacao(id: string, matriculaId: string) {
    setProcessando(true);
    setErroAcao(null);
    try {
      await removerAvaliacao(id);
      setAvaliacoes(await getAvaliacoes(matriculaId));
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir a avaliação.');
    } finally {
      setProcessando(false);
    }
  }

  async function consolidar(matriculaId: string) {
    const faltasNum = Number(faltas.trim());
    const totalAulasNum = Number(totalAulas.trim());
    if (!faltas || !Number.isInteger(faltasNum) || faltasNum < 0) {
      setErroAcao('Informe o total de faltas (número inteiro, 0 ou mais).');
      return;
    }
    if (!totalAulas || !Number.isInteger(totalAulasNum) || totalAulasNum < 1) {
      setErroAcao('Informe o total de aulas ministradas (número inteiro, mínimo 1).');
      return;
    }
    setErroAcao(null);
    setProcessando(true);
    try {
      await consolidarResultado(matriculaId, { faltas: faltasNum, totalAulas: totalAulasNum });
      if (ofertaId) await carregarMatriculas(ofertaId);
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível consolidar o resultado.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <SeletorOferta ofertas={ofertas} selecionada={ofertaId} aoSelecionar={setOfertaId} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={() => ofertaId && carregarMatriculas(ofertaId)} /> : null}

        {carregandoLista ? (
          <Carregando />
        ) : (
          matriculas?.map((m) => {
            const aberta = expandida === m.id;
            return (
              <View key={m.id} style={styles.alunoCard}>
                <TouchableOpacity style={styles.alunoTopo} onPress={() => abrirAluno(m.id)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alunoNome}>{m.aluno.nome}</Text>
                    <Text style={styles.alunoRa}>RA {m.aluno.ra}</Text>
                  </View>
                  {m.resultado ? (
                    <Text style={styles.mediaTexto}>{Number(m.resultado.mediaFinal).toFixed(2)}</Text>
                  ) : null}
                  <Pill texto={STATUS_MATRICULA_LABEL[m.status]} cor={CORES_STATUS[m.status]} />
                  <Feather name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color={theme.cinza400} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {aberta ? (
                  <View style={styles.painel}>
                    {erroAcao ? <Text style={styles.erroAcao}>{erroAcao}</Text> : null}

                    <Text style={styles.painelSecao}>Avaliações</Text>
                    {carregandoAvaliacoes ? (
                      <Carregando />
                    ) : avaliacoes && avaliacoes.length > 0 ? (
                      avaliacoes.map((a) => (
                        <View key={a.id} style={styles.avaliacaoLinha}>
                          <Text style={styles.avaliacaoTexto}>
                            {TIPO_AVALIACAO_LABEL[a.tipo]} · nota {Number(a.nota).toFixed(1)} · peso {a.peso}
                          </Text>
                          <TouchableOpacity onPress={() => excluirAvaliacao(a.id, m.id)} disabled={processando}>
                            <Feather name="trash-2" size={16} color={theme.erro} />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.vazioPequeno}>Nenhuma avaliação lançada ainda.</Text>
                    )}

                    <View style={styles.novaAvaliacao}>
                      <View style={styles.tiposLinha}>
                        {TIPOS.map((t) => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.tipoChip, tipo === t && styles.tipoChipAtivo]}
                            onPress={() => setTipo(t)}
                          >
                            <Text style={[styles.tipoChipTexto, tipo === t && styles.tipoChipTextoAtivo]}>{TIPO_AVALIACAO_LABEL[t]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.notaPesoLinha}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Nota (0-10)"
                          placeholderTextColor={theme.cinza400}
                          keyboardType="decimal-pad"
                          value={nota}
                          onChangeText={setNota}
                        />
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Peso"
                          placeholderTextColor={theme.cinza400}
                          keyboardType="decimal-pad"
                          value={peso}
                          onChangeText={setPeso}
                        />
                      </View>
                      <TouchableOpacity style={styles.botaoSecundario} onPress={() => adicionarAvaliacao(m.id)} disabled={processando}>
                        <Text style={styles.botaoSecundarioTexto}>Lançar avaliação</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.painelSecao}>Consolidar resultado</Text>
                    <View style={styles.notaPesoLinha}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Faltas"
                        placeholderTextColor={theme.cinza400}
                        keyboardType="number-pad"
                        value={faltas}
                        onChangeText={setFaltas}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Total de aulas"
                        placeholderTextColor={theme.cinza400}
                        keyboardType="number-pad"
                        value={totalAulas}
                        onChangeText={setTotalAulas}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.botaoPrimario, processando && { opacity: 0.6 }]}
                      onPress={() => consolidar(m.id)}
                      disabled={processando}
                    >
                      <Text style={styles.botaoPrimarioTexto}>{processando ? 'Processando...' : 'Consolidar'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {!carregandoLista && matriculas && matriculas.length === 0 ? (
          <Text style={styles.vazio}>Nenhum aluno matriculado nesta turma.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  conteudo: { padding: 16, paddingTop: 8, gap: 10 },
  vazio: { fontSize: 13, color: theme.cinza500, textAlign: 'center', marginTop: 24 },
  vazioPequeno: { fontSize: 12, color: theme.cinza500, marginBottom: 8 },
  alunoCard: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, overflow: 'hidden' },
  alunoTopo: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  alunoNome: { fontSize: 13, fontWeight: '700', color: theme.cinza900 },
  alunoRa: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  mediaTexto: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  painel: { borderTopWidth: 1, borderTopColor: theme.cinza100, padding: 14, backgroundColor: theme.cinza50 },
  erroAcao: { color: theme.erro, fontSize: 12, marginBottom: 8 },
  painelSecao: { fontSize: 12, fontWeight: '700', color: theme.cinza700, marginBottom: 8, marginTop: 4 },
  avaliacaoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.branco,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cinza200,
    padding: 10,
    marginBottom: 6,
  },
  avaliacaoTexto: { fontSize: 12, color: theme.cinza900 },
  novaAvaliacao: { marginTop: 10, marginBottom: 4 },
  tiposLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tipoChip: { borderWidth: 1, borderColor: theme.cinza200, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.branco },
  tipoChipAtivo: { backgroundColor: theme.corPrimaria, borderColor: theme.corPrimaria },
  tipoChipTexto: { fontSize: 11, fontWeight: '600', color: theme.cinza700 },
  tipoChipTextoAtivo: { color: theme.branco },
  notaPesoLinha: { flexDirection: 'row', gap: 8, marginBottom: 8 },
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
  botaoSecundario: { borderWidth: 1, borderColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  botaoSecundarioTexto: { color: theme.corPrimaria, fontSize: 12, fontWeight: '700' },
  botaoPrimario: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  botaoPrimarioTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
});
