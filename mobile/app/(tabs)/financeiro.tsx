import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ContratoFinanceiro, getFinanceiro } from '../../lib/discente';
import { emBreve } from '../../lib/em-breve';
import { theme } from '../../lib/theme';
import { Cartao, CartaoIcone, Carregando, GradeCartoes, MensagemErro } from '../../lib/ui';

/** Financeiro — grade igual à do app de referência ("Informações
 * financeiras"). Só "Minhas mensalidades" tem dado real (via
 * /discente/financeiro, que devolve os contratos/parcelas do aluno
 * logado); os outros 3 cartões são "Em breve" (não existe portal de
 * negociação nem programa de indicação no backend da FIURJ). */
function rotuloPeriodo(p: { ano: number; semestre: string }) {
  return `${p.ano}/${p.semestre === 'S1' ? '1' : '2'}`;
}

function formatarMoeda(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinanceiroScreen() {
  const [contratos, setContratos] = useState<ContratoFinanceiro[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensalidadesAbertas, setMensalidadesAbertas] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setContratos(await getFinanceiro());
    } catch {
      setErro('Não foi possível carregar suas informações financeiras.');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function aoTocarMensalidades() {
    setMensalidadesAbertas((v) => !v);
  }

  return (
    <View style={styles.tela}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Informações financeiras</Text>
      </View>
      <ScrollView contentContainerStyle={styles.corpo}>
        <GradeCartoes>
          <CartaoIcone icone="calendar" titulo="Minhas mensalidades" aoPressionar={aoTocarMensalidades} />
          <CartaoIcone icone="refresh-cw" titulo="Minha renovação" aoPressionar={() => emBreve('Minha renovação')} />
          <CartaoIcone
            icone="credit-card"
            titulo="Portal de negociação"
            aoPressionar={() => emBreve('Portal de negociação')}
          />
          <CartaoIcone icone="gift" titulo="Indique e ganhe" badge="Novo!" aoPressionar={() => emBreve('Indique e ganhe')} />
        </GradeCartoes>

        {mensalidadesAbertas ? (
          contratos === null && !erro ? (
            <Carregando />
          ) : erro ? (
            <MensagemErro mensagem={erro} aoTentarNovamente={carregar} />
          ) : contratos && contratos.length > 0 ? (
            contratos.map((c) => (
              <Cartao key={c.id} titulo={`Contrato ${rotuloPeriodo(c.periodoLetivo)}`}>
                <Text style={styles.contratoStatus}>{c.status}</Text>
                {c.parcelas.map((p) => (
                  <View key={p.numero} style={styles.parcelaLinha}>
                    <Text style={styles.parcelaTexto}>Parcela {p.numero}</Text>
                    <Text style={styles.parcelaTexto}>{formatarMoeda(p.valor)}</Text>
                    <Text style={styles.parcelaStatus}>{p.status ?? '—'}</Text>
                  </View>
                ))}
              </Cartao>
            ))
          ) : (
            <Cartao>
              <Text style={styles.vazio}>Nenhuma mensalidade encontrada.</Text>
            </Cartao>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: theme.cinza50 },
  header: { backgroundColor: theme.corPrimaria, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 },
  titulo: { fontSize: 18, fontWeight: '700', color: theme.branco, textAlign: 'center' },
  corpo: { padding: 16, gap: 12 },
  vazio: { fontSize: 13, color: theme.cinza500 },
  contratoStatus: { fontSize: 12, color: theme.corPrimaria, fontWeight: '700', marginBottom: 8 },
  parcelaLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.cinza100,
  },
  parcelaTexto: { fontSize: 13, color: theme.cinza900 },
  parcelaStatus: { fontSize: 12, color: theme.cinza500 },
});
