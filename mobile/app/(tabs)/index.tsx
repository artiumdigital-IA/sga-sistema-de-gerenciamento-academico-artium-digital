import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { theme } from '../../lib/theme';
import { Cartao, Carregando, MensagemErro, TelaComRefresh } from '../../lib/ui';

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  tag?: string | null;
  criadoEm: string;
};

export default function InicioScreen() {
  const { usuario, logout } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const dados = await apiFetch<Aviso[]>('/avisos');
      setAvisos(dados.slice(0, 5));
    } catch {
      setErro('Não foi possível carregar os avisos.');
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

  if (avisos === null && !erro) return <Carregando />;

  return (
    <TelaComRefresh atualizando={atualizando} aoAtualizar={aoAtualizar}>
      <Cartao>
        <Text style={styles.saudacao}>Olá!</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <TouchableOpacity onPress={logout} style={styles.sair}>
          <Text style={styles.sairTexto}>Sair</Text>
        </TouchableOpacity>
      </Cartao>

      <Cartao titulo="Últimos avisos">
        {erro ? (
          <MensagemErro mensagem={erro} aoTentarNovamente={carregar} />
        ) : avisos && avisos.length > 0 ? (
          avisos.map((a) => (
            <View key={a.id} style={styles.avisoItem}>
              <Text style={styles.avisoTitulo}>{a.titulo}</Text>
              <Text style={styles.avisoMensagem} numberOfLines={2}>
                {a.mensagem}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.vazio}>Nenhum aviso no momento.</Text>
        )}
      </Cartao>
    </TelaComRefresh>
  );
}

const styles = StyleSheet.create({
  saudacao: { fontSize: 18, fontWeight: '700', color: theme.cinza900 },
  email: { fontSize: 13, color: theme.cinza500, marginTop: 2, marginBottom: 12 },
  sair: { alignSelf: 'flex-start' },
  sairTexto: { color: theme.erro, fontSize: 13, fontWeight: '600' },
  avisoItem: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cinza100 },
  avisoTitulo: { fontSize: 14, fontWeight: '600', color: theme.cinza900 },
  avisoMensagem: { fontSize: 13, color: theme.cinza500, marginTop: 2 },
  vazio: { fontSize: 13, color: theme.cinza500 },
});
