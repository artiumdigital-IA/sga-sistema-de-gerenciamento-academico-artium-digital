import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError } from '../../lib/api';
import { getOfertas, getPauta, LinhaPauta, Oferta, salvarPauta, SalvarPautaDto } from '../../lib/docente';
import { theme } from '../../lib/theme';
import { Carregando, MensagemErro, SeletorOferta } from '../../lib/ui';

/**
 * Pauta — AV1-AV5, 2ª Chamada, Recuperação e Faltas por aluno, regra
 * semestral confirmada com o usuário (ver backend/src/academic/nota-pauta/).
 * Tocar numa linha expande um formulário de edição inline (sem navegar pra
 * outra tela) — mais rápido no celular do que abrir um modal por aluno.
 */
type FormEdicao = {
  av1: string;
  av2: string;
  av3: string;
  av4: string;
  av5: string;
  segundaChamada: string;
  recuperacao: string;
  faltas: string;
};

function linhaParaForm(l: LinhaPauta): FormEdicao {
  return {
    av1: l.av1 !== null ? String(l.av1) : '',
    av2: l.av2 !== null ? String(l.av2) : '',
    av3: l.av3 !== null ? String(l.av3) : '',
    av4: l.av4 !== null ? String(l.av4) : '',
    av5: l.av5 !== null ? String(l.av5) : '',
    segundaChamada: l.segundaChamada !== null ? String(l.segundaChamada) : '',
    recuperacao: l.recuperacao !== null ? String(l.recuperacao) : '',
    faltas: String(l.faltas ?? 0),
  };
}

function numOuNull(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function CampoNumero({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoRotulo}>{rotulo}</Text>
      <TextInput
        style={styles.campoInput}
        value={valor}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={theme.cinza400}
      />
    </View>
  );
}

function corMedia(media: number | null): string {
  if (media === null) return theme.cinza400;
  return media >= 6 ? theme.sucesso : theme.erro;
}

export default function PautaScreen() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaPauta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoLinhas, setCarregandoLinhas] = useState(false);

  const [expandida, setExpandida] = useState<string | null>(null);
  const [form, setForm] = useState<FormEdicao | null>(null);
  const [salvando, setSalvando] = useState(false);

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

  const carregarPauta = useCallback(async (id: string) => {
    setErro(null);
    setCarregandoLinhas(true);
    try {
      const pauta = await getPauta(id);
      setLinhas(pauta.linhas);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar a pauta.');
    } finally {
      setCarregandoLinhas(false);
    }
  }, []);

  useEffect(() => {
    if (ofertaId) {
      setExpandida(null);
      carregarPauta(ofertaId);
    }
  }, [ofertaId, carregarPauta]);

  function abrirLinha(l: LinhaPauta) {
    if (expandida === l.matriculaDisciplinaId) {
      setExpandida(null);
      setForm(null);
      return;
    }
    setExpandida(l.matriculaDisciplinaId);
    setForm(linhaParaForm(l));
  }

  async function salvarLinha(matriculaDisciplinaId: string) {
    if (!form) return;
    setSalvando(true);
    try {
      const dto: SalvarPautaDto = {
        av1: numOuNull(form.av1),
        av2: numOuNull(form.av2),
        av3: numOuNull(form.av3),
        av4: numOuNull(form.av4),
        av5: numOuNull(form.av5),
        segundaChamada: numOuNull(form.segundaChamada),
        recuperacao: numOuNull(form.recuperacao),
        faltas: Number(form.faltas.trim()) || 0,
      };
      const atualizada = await salvarPauta(matriculaDisciplinaId, dto);
      setLinhas((prev) => (prev ? prev.map((l) => (l.matriculaDisciplinaId === matriculaDisciplinaId ? { ...l, ...atualizada } : l)) : prev));
      setExpandida(null);
      setForm(null);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a pauta.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <SeletorOferta ofertas={ofertas} selecionada={ofertaId} aoSelecionar={setOfertaId} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        {erro ? <MensagemErro mensagem={erro} aoTentarNovamente={() => ofertaId && carregarPauta(ofertaId)} /> : null}

        {carregandoLinhas ? (
          <Carregando />
        ) : (
          linhas?.map((l) => {
            const aberta = expandida === l.matriculaDisciplinaId;
            return (
              <View key={l.matriculaDisciplinaId} style={styles.linhaCard}>
                <TouchableOpacity style={styles.linhaTopo} onPress={() => abrirLinha(l)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linhaNome}>{l.numero}. {l.aluno.nome}</Text>
                    <Text style={styles.linhaRa}>RA {l.aluno.ra} · {l.faltas} falta(s)</Text>
                  </View>
                  <Text style={[styles.linhaMedia, { color: corMedia(l.media) }]}>{l.media !== null ? l.media.toFixed(2) : '—'}</Text>
                  <Feather name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color={theme.cinza400} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {aberta && form ? (
                  <View style={styles.formEdicao}>
                    <View style={styles.formGrade}>
                      <CampoNumero rotulo="AV1" valor={form.av1} onChange={(v) => setForm({ ...form, av1: v })} />
                      <CampoNumero rotulo="AV2" valor={form.av2} onChange={(v) => setForm({ ...form, av2: v })} />
                      <CampoNumero rotulo="AV3" valor={form.av3} onChange={(v) => setForm({ ...form, av3: v })} />
                      <CampoNumero rotulo="AV4" valor={form.av4} onChange={(v) => setForm({ ...form, av4: v })} />
                      <CampoNumero rotulo="AV5" valor={form.av5} onChange={(v) => setForm({ ...form, av5: v })} />
                      <CampoNumero rotulo="2ª Cham." valor={form.segundaChamada} onChange={(v) => setForm({ ...form, segundaChamada: v })} />
                      <CampoNumero rotulo="Recup." valor={form.recuperacao} onChange={(v) => setForm({ ...form, recuperacao: v })} />
                      <CampoNumero rotulo="Faltas" valor={form.faltas} onChange={(v) => setForm({ ...form, faltas: v })} />
                    </View>
                    <TouchableOpacity
                      style={[styles.botaoSalvar, salvando && { opacity: 0.6 }]}
                      onPress={() => salvarLinha(l.matriculaDisciplinaId)}
                      disabled={salvando}
                    >
                      <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {!carregandoLinhas && linhas && linhas.length === 0 ? (
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
  linhaCard: { backgroundColor: theme.branco, borderRadius: 12, borderWidth: 1, borderColor: theme.cinza200, overflow: 'hidden' },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  linhaNome: { fontSize: 13, fontWeight: '700', color: theme.cinza900 },
  linhaRa: { fontSize: 11, color: theme.cinza500, marginTop: 2 },
  linhaMedia: { fontSize: 16, fontWeight: '700' },
  formEdicao: { borderTopWidth: 1, borderTopColor: theme.cinza100, padding: 14, backgroundColor: theme.cinza50 },
  formGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  campo: { width: '22.5%' },
  campoRotulo: { fontSize: 10, color: theme.cinza500, marginBottom: 4, fontWeight: '600' },
  campoInput: {
    borderWidth: 1,
    borderColor: theme.cinza200,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.cinza900,
    backgroundColor: theme.branco,
    textAlign: 'center',
  },
  botaoSalvar: { backgroundColor: theme.corPrimaria, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  botaoSalvarTexto: { color: theme.branco, fontSize: 13, fontWeight: '700' },
});
