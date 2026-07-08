import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiFetch, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { theme } from '../../lib/theme';
import { Cartao, Carregando, MensagemErro } from '../../lib/ui';

type DisciplinaHistorico = {
  nome: string;
  codigo: string;
  professor: string;
  creditos: number;
  cargaHoraria: number;
  mediaFinal: number | null;
  situacao: string | null;
  isDependencia: boolean;
  statusMatricula: string;
};

type PeriodoHistorico = {
  periodoLetivoId: string;
  ano: number;
  semestre: string;
  disciplinas: DisciplinaHistorico[];
  totalCreditos: number;
  totalCh: number;
};

type Historico = {
  aluno: { nome: string; ra: string };
  curso: { nome: string; grau: string; cargaHorariaTotal: number };
  periodos: PeriodoHistorico[];
  cr: number;
  integralizacao: {
    chIntegralizada: number;
    chTotalCurso: number;
    percentual: number;
    disciplinasIntegralizadas: number;
  };
};

export default function HistoricoScreen() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<Historico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario?.alunoId) {
      setErro('Esta conta não está vinculada a um aluno.');
      return;
    }
    setErro(null);
    try {
      const resultado = await apiFetch<Historico>(`/documentos/historico-oficial/${usuario.alunoId}`);
      setDados(resultado);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar o histórico.');
    }
  }, [usuario?.alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!dados && !erro) return <Carregando />;
  if (erro && !dados) return <MensagemErro mensagem={erro} aoTentarNovamente={carregar} />;
  if (!dados) return null;

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <Cartao>
        <Text style={styles.nome}>{dados.aluno.nome}</Text>
        <Text style={styles.curso}>
          {dados.curso.nome} · RA {dados.aluno.ra}
        </Text>
        <View style={styles.resumoLinha}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoRotulo}>CR</Text>
            <Text style={styles.resumoValor}>{dados.cr.toFixed(2)}</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoRotulo}>Integralização</Text>
            <Text style={styles.resumoValor}>{dados.integralizacao.percentual}%</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoRotulo}>CH cursada</Text>
            <Text style={styles.resumoValor}>
              {dados.integralizacao.chIntegralizada}/{dados.integralizacao.chTotalCurso}
            </Text>
          </View>
        </View>
      </Cartao>

      {dados.periodos
        .slice()
        .reverse()
        .map((p) => (
          <Cartao key={p.periodoLetivoId} titulo={`${p.ano}/${p.semestre === 'S1' ? '1' : '2'}`}>
            {p.disciplinas.map((d, i) => (
              <View key={`${d.codigo}-${i}`} style={styles.disciplinaLinha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.disciplinaNome}>{d.nome}</Text>
                  <Text style={styles.disciplinaProfessor}>{d.professor}</Text>
                </View>
                <Text style={styles.disciplinaMedia}>{d.mediaFinal ?? '—'}</Text>
              </View>
            ))}
          </Cartao>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  nome: { fontSize: 16, fontWeight: '700', color: theme.cinza900 },
  curso: { fontSize: 13, color: theme.cinza500, marginTop: 2, marginBottom: 12 },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  resumoItem: { alignItems: 'center' },
  resumoRotulo: { fontSize: 11, color: theme.cinza500 },
  resumoValor: { fontSize: 16, fontWeight: '700', color: theme.corPrimaria, marginTop: 2 },
  disciplinaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.cinza100,
  },
  disciplinaNome: { fontSize: 13, fontWeight: '600', color: theme.cinza900 },
  disciplinaProfessor: { fontSize: 11, color: theme.cinza500, marginTop: 1 },
  disciplinaMedia: { fontSize: 14, fontWeight: '700', color: theme.cinza900, marginLeft: 8 },
});
