import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch, apiFileUrl, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatarData } from '../../lib/format';
import { theme } from '../../lib/theme';
import { Cartao, Carregando, LinhaDado, MensagemErro } from '../../lib/ui';

type Declaracao = {
  aluno: { nome: string; ra: string; situacaoVinculo: string; dataIngresso: string };
  curso: { nome: string; grau: string; modalidade: string };
  periodoAtual: { ano: number; semestre: string } | null;
};

type Carteirinha = {
  aluno: { nome: string; ra: string; situacaoVinculo: string; fotoUrl: string | null };
  curso: { nome: string; grau: string };
  validaAte: string;
  codigoValidacao: string;
};

type DocumentoOficial = { titulo: string; icone: keyof typeof Feather.glyphMap; path: string };

/**
 * Mostra os dados "crus" (carteirinha/declaração) num resumo rápido, e
 * abaixo os 4 documentos oficiais com layout de impressão de verdade
 * (papel timbrado, branding), abertos numa WebView autenticada apontando
 * pra tela de impressão do frontend web — ver ADR no README e
 * app/documento-webview.tsx. Antes desta tela, o app só mostrava JSON cru
 * sem nenhum layout imprimível (gap identificado no teste E2E, Jul/2026).
 */
export default function DocumentosScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [declaracao, setDeclaracao] = useState<Declaracao | null>(null);
  const [carteirinha, setCarteirinha] = useState<Carteirinha | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario?.alunoId) {
      setErro('Esta conta não está vinculada a um aluno.');
      return;
    }
    setErro(null);
    try {
      const [d, c] = await Promise.all([
        apiFetch<Declaracao>(`/documentos/declaracao-matricula/${usuario.alunoId}`),
        apiFetch<Carteirinha>(`/documentos/carteirinha/${usuario.alunoId}`),
      ]);
      setDeclaracao(d);
      setCarteirinha(c);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os documentos.');
    }
  }, [usuario?.alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!declaracao && !carteirinha && !erro) return <Carregando />;
  if (erro && !declaracao) return <MensagemErro mensagem={erro} aoTentarNovamente={carregar} />;

  const alunoId = usuario?.alunoId;
  const documentosOficiais: DocumentoOficial[] = alunoId
    ? [
        { titulo: 'Declaração de Matrícula', icone: 'file-text', path: `/dashboard/secretaria/documentos/declaracao/${alunoId}` },
        { titulo: 'Boletim', icone: 'bar-chart-2', path: `/dashboard/secretaria/documentos/boletim/${alunoId}` },
        { titulo: 'Carteirinha Estudantil', icone: 'credit-card', path: `/dashboard/secretaria/documentos/carteirinha/${alunoId}` },
        { titulo: 'Histórico Escolar Oficial', icone: 'book', path: `/dashboard/secretaria/documentos/historico-oficial/${alunoId}` },
      ]
    : [];

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      {carteirinha && (
        <Cartao titulo="Carteirinha Estudantil">
          <View style={styles.carteirinhaLinha}>
            {carteirinha.aluno.fotoUrl ? (
              <Image source={{ uri: apiFileUrl(carteirinha.aluno.fotoUrl) ?? undefined }} style={styles.foto} />
            ) : (
              <View style={[styles.foto, styles.fotoVazia]}>
                <Text style={styles.fotoIniciais}>{carteirinha.aluno.nome.charAt(0)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeCarteirinha}>{carteirinha.aluno.nome}</Text>
              <Text style={styles.subCarteirinha}>{carteirinha.curso.nome}</Text>
              <Text style={styles.subCarteirinha}>RA {carteirinha.aluno.ra}</Text>
            </View>
          </View>
          <LinhaDado rotulo="Válida até" valor={formatarData(carteirinha.validaAte)} />
          <LinhaDado rotulo="Código de validação" valor={carteirinha.codigoValidacao} />
        </Cartao>
      )}

      {declaracao && (
        <Cartao titulo="Declaração de Matrícula">
          <LinhaDado rotulo="Curso" valor={declaracao.curso.nome} />
          <LinhaDado rotulo="Grau" valor={declaracao.curso.grau} />
          <LinhaDado rotulo="Situação" valor={declaracao.aluno.situacaoVinculo} />
          <LinhaDado rotulo="Ingresso" valor={formatarData(declaracao.aluno.dataIngresso)} />
          {declaracao.periodoAtual && (
            <LinhaDado
              rotulo="Período atual"
              valor={`${declaracao.periodoAtual.ano}/${declaracao.periodoAtual.semestre === 'S1' ? '1' : '2'}`}
            />
          )}
        </Cartao>
      )}

      {documentosOficiais.length > 0 && (
        <Cartao titulo="Ver / Imprimir documento oficial">
          <Text style={styles.dica}>
            Abre o layout oficial (papel timbrado) direto do sistema, com botão de imprimir/salvar em PDF.
          </Text>
          {documentosOficiais.map((doc, i) => (
            <TouchableOpacity
              key={doc.path}
              style={[styles.linhaDoc, i === documentosOficiais.length - 1 && styles.linhaDocUltima]}
              onPress={() => router.push({ pathname: '/documento-webview', params: { path: doc.path, titulo: doc.titulo } })}
            >
              <Feather name={doc.icone} size={18} color={theme.corPrimaria} />
              <Text style={styles.linhaDocTexto}>{doc.titulo}</Text>
              <Feather name="chevron-right" size={18} color={theme.cinza400} />
            </TouchableOpacity>
          ))}
        </Cartao>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  carteirinhaLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  foto: { width: 56, height: 56, borderRadius: 8 },
  fotoVazia: { backgroundColor: theme.corPrimaria, alignItems: 'center', justifyContent: 'center' },
  fotoIniciais: { color: theme.branco, fontSize: 22, fontWeight: '700' },
  nomeCarteirinha: { fontSize: 14, fontWeight: '700', color: theme.cinza900 },
  subCarteirinha: { fontSize: 12, color: theme.cinza500 },
  dica: { fontSize: 12, color: theme.cinza500, marginBottom: 8 },
  linhaDoc: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.cinza200,
  },
  linhaDocUltima: { borderBottomWidth: 0 },
  linhaDocTexto: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.cinza900 },
});
