import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { theme } from '../../lib/theme';
import { Cartao, Carregando, MensagemErro } from '../../lib/ui';

type PeriodoResumo = { id: string; ano: number; semestre: string };

type Disciplina = {
  disciplina: string;
  codigo: string;
  cargaHoraria: number;
  creditos: number;
  professor: string;
  isDependencia: boolean;
  statusMatricula: string;
  mediaFinal: number | null;
  faltas: number | null;
  frequenciaPercentual: number | null;
  situacaoResultado: string | null;
};

type Boletim = {
  aluno: { nome: string; ra: string };
  curso: { nome: string; grau: string };
  periodo: PeriodoResumo | null;
  periodosDisponiveis: PeriodoResumo[];
  disciplinas: Disciplina[];
};

function rotuloPeriodo(p: PeriodoResumo) {
  return `${p.ano}/${p.semestre === 'S1' ? '1' : '2'}`;
}

function corSituacao(situacao: string | null) {
  if (situacao === 'APROVADO') return theme.sucesso;
  if (situacao === 'REPROVADO') return theme.erro;
  return theme.cinza500;
}

export default function BoletimScreen() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<Boletim | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    async (periodoLetivoId?: string) => {
      if (!usuario?.alunoId) {
        setErro('Esta conta não está vinculada a um aluno.');
        return;
      }
      setErro(null);
      try {
        const query = periodoLetivoId ? `?periodoLetivoId=${periodoLetivoId}` : '';
        const resultado = await apiFetch<Boletim>(`/documentos/boletim/${usuario.alunoId}${query}`);
        setDados(resultado);
        setPeriodoSelecionado(resultado.periodo?.id);
      } catch (err) {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar o boletim.');
      }
    },
    [usuario?.alunoId],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!dados && !erro) return <Carregando />;
  if (erro && !dados) return <MensagemErro mensagem={erro} aoTentarNovamente={() => carregar(periodoSelecionado)} />;
  if (!dados) return null;

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <Cartao>
        <Text style={styles.nome}>{dados.aluno.nome}</Text>
        <Text style={styles.curso}>
          {dados.curso.nome} · RA {dados.aluno.ra}
        </Text>
      </Cartao>

      {dados.periodosDisponiveis.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorPeriodo}>
          {dados.periodosDisponiveis.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, p.id === periodoSelecionado && styles.chipAtivo]}
              onPress={() => {
                setPeriodoSelecionado(p.id);
                carregar(p.id);
              }}
            >
              <Text style={[styles.chipTexto, p.id === periodoSelecionado && styles.chipTextoAtivo]}>
                {rotuloPeriodo(p)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {dados.disciplinas.length === 0 ? (
        <Cartao>
          <Text style={styles.vazio}>Nenhuma disciplina neste período.</Text>
        </Cartao>
      ) : (
        dados.disciplinas.map((d, i) => (
          <Cartao key={`${d.codigo}-${i}`}>
            <Text style={styles.disciplinaNome}>{d.disciplina}</Text>
            <Text style={styles.disciplinaProfessor}>{d.professor}</Text>
            <View style={styles.linhaNotas}>
              <View>
                <Text style={styles.rotuloMini}>Média</Text>
                <Text style={styles.valorMini}>{d.mediaFinal ?? '—'}</Text>
              </View>
              <View>
                <Text style={styles.rotuloMini}>Frequência</Text>
                <Text style={styles.valorMini}>
                  {d.frequenciaPercentual != null ? `${d.frequenciaPercentual}%` : '—'}
                </Text>
              </View>
              <View>
                <Text style={styles.rotuloMini}>Situação</Text>
                <Text style={[styles.valorMini, { color: corSituacao(d.situacaoResultado) }]}>
                  {d.situacaoResultado ?? d.statusMatricula}
                </Text>
              </View>
            </View>
          </Cartao>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  nome: { fontSize: 16, fontWeight: '700', color: theme.cinza900 },
  curso: { fontSize: 13, color: theme.cinza500, marginTop: 2 },
  seletorPeriodo: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.cinza100,
    marginRight: 8,
  },
  chipAtivo: { backgroundColor: theme.corPrimaria },
  chipTexto: { fontSize: 13, color: theme.cinza700, fontWeight: '600' },
  chipTextoAtivo: { color: theme.branco },
  vazio: { fontSize: 13, color: theme.cinza500 },
  disciplinaNome: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  disciplinaProfessor: { fontSize: 12, color: theme.cinza500, marginTop: 2, marginBottom: 10 },
  linhaNotas: { flexDirection: 'row', justifyContent: 'space-between' },
  rotuloMini: { fontSize: 11, color: theme.cinza500 },
  valorMini: { fontSize: 14, fontWeight: '700', color: theme.cinza900, marginTop: 2 },
});
