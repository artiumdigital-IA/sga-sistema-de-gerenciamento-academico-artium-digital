import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch, ApiError } from '../../lib/api';
import { theme } from '../../lib/theme';
import { Cartao, MensagemErro, TelaComRefresh } from '../../lib/ui';

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  tag?: string | null;
  criadoEm: string;
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function AvisosScreen() {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const dados = await apiFetch<Aviso[]>('/avisos');
      setAvisos(dados);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os avisos.');
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

  if (erro && !avisos) return <MensagemErro mensagem={erro} aoTentarNovamente={carregar} />;

  return (
    <TelaComRefresh atualizando={atualizando} aoAtualizar={aoAtualizar}>
      {avisos && avisos.length > 0 ? (
        avisos.map((a) => (
          <Cartao key={a.id}>
            <View style={styles.cabecalho}>
              <Text style={styles.titulo}>{a.titulo}</Text>
              <Text style={styles.data}>{formatarData(a.criadoEm)}</Text>
            </View>
            {a.tag ? <Text style={styles.tag}>{a.tag}</Text> : null}
            <Text style={styles.mensagem}>{a.mensagem}</Text>
          </Cartao>
        ))
      ) : (
        <Cartao>
          <Text style={styles.vazio}>Nenhum aviso no momento.</Text>
        </Cartao>
      )}
    </TelaComRefresh>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titulo: { fontSize: 14, fontWeight: '700', color: theme.cinza900, flex: 1, marginRight: 8 },
  data: { fontSize: 11, color: theme.cinza500 },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    color: theme.corSecundaria,
    backgroundColor: '#FCE8EC',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  mensagem: { fontSize: 13, color: theme.cinza700, marginTop: 6, lineHeight: 18 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
