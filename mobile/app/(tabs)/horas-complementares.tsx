import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiFileUrl, ApiError } from '../../lib/api';
import { formatarData, getHorasComplementares, HorasComplementares } from '../../lib/discente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro, TelaComRefresh } from '../../lib/ui';

/**
 * Horas Complementares (antiga "Horas AAC", ver Início > "Meu curso") —
 * somente leitura pro aluno: barra de progresso feitas/total (mesmo estilo
 * visual do card "Progresso no período" da tela Início) + lista dos
 * certificados já lançados pelos professores. Lançar/editar é só pelo app
 * do professor (ver mobile-docente/app/(tabs)/horas-complementares.tsx).
 */
export default function HorasComplementaresScreen() {
  const [dados, setDados] = useState<HorasComplementares | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await getHorasComplementares());
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar suas horas complementares.');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aoAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  if (dados === null && !erro) return <Carregando />;

  return (
    <TelaComRefresh atualizando={atualizando} aoAtualizar={aoAtualizar}>
      {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={carregar} /> : null}

      {dados ? (
        <>
          <View style={styles.progressoCard}>
            <View style={styles.progressoTopo}>
              <Text style={styles.progressoPercentual}>{dados.percentual}%</Text>
              <Text style={styles.progressoLabel}>{dados.feitas}h de {dados.total}h exigidas</Text>
            </View>
            <View style={styles.barraFundo}>
              <View style={[styles.barraPreenchida, { width: `${Math.min(100, dados.percentual)}%` }]} />
            </View>
          </View>

          <Text style={styles.secaoTitulo}>Certificados lançados</Text>
          {dados.lancamentos.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma hora complementar lançada ainda. Procure seu professor com o certificado da atividade.</Text>
          ) : (
            dados.lancamentos.map((l) => (
              <View key={l.id} style={styles.lancamentoCard}>
                {l.nomeArquivo.toLowerCase().endsWith('.pdf') ? (
                  <View style={[styles.lancamentoThumb, styles.lancamentoThumbPdf]}>
                    <Feather name="file-text" size={20} color={theme.corPrimaria} />
                  </View>
                ) : (
                  <Image source={{ uri: apiFileUrl(l.url) ?? undefined }} style={styles.lancamentoThumb} resizeMode="cover" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.lancamentoHoras}>{l.horas}h · {formatarData(l.criadoEm)}</Text>
                  <Text style={styles.lancamentoProfessor}>Lançado por {l.professor}</Text>
                  {l.observacoes ? <Text style={styles.lancamentoObs}>{l.observacoes}</Text> : null}
                </View>
              </View>
            ))
          )}
        </>
      ) : null}
    </TelaComRefresh>
  );
}

const styles = StyleSheet.create({
  progressoCard: {
    backgroundColor: theme.branco,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cinza200,
  },
  progressoTopo: { marginBottom: 10 },
  progressoPercentual: { fontSize: 22, fontWeight: '700', color: theme.cinza900 },
  progressoLabel: { fontSize: 13, color: theme.cinza700, marginTop: 2 },
  barraFundo: { height: 8, borderRadius: 4, backgroundColor: theme.cinza100, overflow: 'hidden' },
  barraPreenchida: { height: 8, borderRadius: 4, backgroundColor: theme.corPrimaria },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: theme.cinza900, marginTop: 4 },
  vazio: { fontSize: 13, color: theme.cinza500 },
  lancamentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cinza200,
    padding: 10,
  },
  lancamentoThumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: theme.cinza100 },
  lancamentoThumbPdf: { alignItems: 'center', justifyContent: 'center' },
  lancamentoHoras: { fontSize: 13, fontWeight: '600', color: theme.cinza900 },
  lancamentoProfessor: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  lancamentoObs: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
});
