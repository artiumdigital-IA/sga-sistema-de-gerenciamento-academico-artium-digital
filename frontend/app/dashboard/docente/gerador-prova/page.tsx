'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type TipoQuestao = 'MULTIPLA_ESCOLHA' | 'DISSERTATIVA';
type Questao = { id: number; tipo: TipoQuestao; enunciado: string; valor: number; alternativas: string[] };

const TIPOS_PROVA = ['AV1', 'AV2', 'AV3', 'AV4', 'AV5', 'RECUPERACAO', 'SEGUNDA_CHAMADA'] as const;
const TIPO_PROVA_LABEL: Record<string, string> = {
  AV1: 'AV1', AV2: 'AV2', AV3: 'AV3', AV4: 'AV4', AV5: 'AV5',
  RECUPERACAO: 'Recuperação', SEGUNDA_CHAMADA: '2ª Chamada',
};

const OBSERVACOES_PADRAO = `Leia com atenção as questões antes de respondê-las. Não é permitido nenhum tipo de consulta e as questões devem ser respondidas somente à caneta azul ou preta. O uso de qualquer tipo de corretivo é proibido e implicará na anulação da questão. Revise suas respostas antes de entregar a prova e não esqueça de identificar a sua prova.

Será observada uma tolerância máxima de 40 minutos para a entrada dos alunos. Neste intervalo nenhum aluno poderá deixar a sala. Após o tempo de tolerância, o aluno que terminar a prova, deverá entregá-la ao professor responsável.`;

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LBL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 18px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '7px 14px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: 'var(--white)', color: 'var(--gray-700)' };
const BTN_D: React.CSSProperties = { padding: '4px 10px', borderRadius: 5, border: '1px solid #dc2626', background: 'transparent', cursor: 'pointer', fontSize: 11.5, color: '#dc2626', fontWeight: 500 };
const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 };

function letra(i: number) {
  return `${String.fromCharCode(97 + i)})`;
}

/**
 * Gerador de Prova (Menu Docente) — monta cabeçalho + questões (múltipla
 * escolha ou dissertativa) e gera um documento imprimível em
 * /dashboard/provas-geradas/:id (mesma página usada pela Secretaria pra
 * reimprimir qualquer prova gerada por qualquer professor).
 */
export default function GeradorProvaPage() {
  const router = useRouter();
  const proximoId = useRef(1);

  const [tipoProva, setTipoProva] = useState<string>('AV1');
  const [curso, setCurso] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [turma, setTurma] = useState('');
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState(OBSERVACOES_PADRAO);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');

  function adicionarQuestao(tipo: TipoQuestao) {
    const nova: Questao = {
      id: proximoId.current++,
      tipo,
      enunciado: '',
      valor: tipo === 'MULTIPLA_ESCOLHA' ? 0.5 : 1,
      alternativas: tipo === 'MULTIPLA_ESCOLHA' ? ['', '', '', '', ''] : [],
    };
    setQuestoes(qs => [...qs, nova]);
    setModalAberto(false);
  }

  function atualizarQuestao(id: number, patch: Partial<Questao>) {
    setQuestoes(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removerQuestao(id: number) {
    setQuestoes(qs => qs.filter(q => q.id !== id));
  }

  function adicionarAlternativa(id: number) {
    setQuestoes(qs => qs.map(q => (q.id === id ? { ...q, alternativas: [...q.alternativas, ''] } : q)));
  }

  function removerAlternativa(id: number, idx: number) {
    setQuestoes(qs => qs.map(q => (q.id === id ? { ...q, alternativas: q.alternativas.filter((_, i) => i !== idx) } : q)));
  }

  function atualizarAlternativa(id: number, idx: number, texto: string) {
    setQuestoes(qs => qs.map(q => (q.id === id ? { ...q, alternativas: q.alternativas.map((a, i) => (i === idx ? texto : a)) } : q)));
  }

  const totalPontos = questoes.reduce((s, q) => s + (Number(q.valor) || 0), 0);

  async function gerar() {
    setErro('');
    if (!curso.trim() || !disciplina.trim() || !turma.trim() || !data) {
      setErro('Preencha curso, disciplina, turma e data.');
      return;
    }
    if (questoes.length === 0) {
      setErro('Adicione pelo menos uma questão.');
      return;
    }
    for (const q of questoes) {
      if (!q.enunciado.trim()) {
        setErro('Toda questão precisa de um enunciado.');
        return;
      }
    }
    setGerando(true);
    try {
      const prova = await apiFetch<{ id: string }>('/provas-geradas', {
        method: 'POST',
        body: JSON.stringify({
          tipoProva,
          curso: curso.trim(),
          disciplina: disciplina.trim(),
          turma: turma.trim(),
          data,
          observacoes,
          questoes: questoes.map(q => ({
            tipo: q.tipo,
            enunciado: q.enunciado.trim(),
            valor: Number(q.valor) || 0,
            alternativas: q.tipo === 'MULTIPLA_ESCOLHA' ? q.alternativas.map(a => a.trim()).filter(Boolean) : undefined,
          })),
        }),
      });
      router.push(`/dashboard/provas-geradas/${prova.id}`);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao gerar a prova.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Gerador de Prova</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Monte o cabeçalho e as questões — ao gerar, o documento fica pronto pra imprimir.</p>
      </div>

      {/* Cabeçalho */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Cabeçalho</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>Prova</label>
            <select style={INPUT} value={tipoProva} onChange={e => setTipoProva(e.target.value)}>
              {TIPOS_PROVA.map(t => <option key={t} value={t}>{TIPO_PROVA_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Data</label>
            <input style={INPUT} type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
          <div>
            <label style={LBL}>Curso</label>
            <input style={INPUT} value={curso} onChange={e => setCurso(e.target.value)} placeholder="Ex.: DIREITO" />
          </div>
          <div>
            <label style={LBL}>Turma</label>
            <input style={INPUT} value={turma} onChange={e => setTurma(e.target.value)} placeholder="Ex.: DRN-02" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LBL}>Disciplina</label>
            <input style={INPUT} value={disciplina} onChange={e => setDisciplina(e.target.value)} placeholder="Ex.: Direito Constitucional I" />
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--gray-400)', margin: '0 0 12px' }}>
          O campo &quot;Aluno&quot; sai em branco no documento impresso, pra o aluno preencher à mão.
        </p>
        <div>
          <label style={LBL}>Observações (impressas no cabeçalho da prova)</label>
          <textarea style={{ ...INPUT, minHeight: 110, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
        </div>
      </div>

      {/* Questões */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Questões</h2>
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Total: <strong>{totalPontos.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} pontos</strong></span>
        </div>

        {questoes.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', padding: '20px 0' }}>Nenhuma questão adicionada ainda.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questoes.map((q, i) => (
            <div key={q.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 6, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Questão {i + 1} <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 11.5 }}>({q.tipo === 'MULTIPLA_ESCOLHA' ? 'Múltipla escolha' : 'Dissertativa'})</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>Vale até</label>
                  <input
                    type="number" step="0.5" min="0" style={{ ...INPUT, width: 70 }}
                    value={q.valor}
                    onChange={e => atualizarQuestao(q.id, { valor: Number(e.target.value) })}
                  />
                  <button style={BTN_D} onClick={() => removerQuestao(q.id)}>Remover</button>
                </div>
              </div>
              <textarea
                style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit', marginBottom: q.tipo === 'MULTIPLA_ESCOLHA' ? 10 : 0 }}
                placeholder="Enunciado da questão"
                value={q.enunciado}
                onChange={e => atualizarQuestao(q.id, { enunciado: e.target.value })}
              />
              {q.tipo === 'MULTIPLA_ESCOLHA' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.alternativas.map((alt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, width: 20, color: 'var(--gray-500)' }}>{letra(idx)}</span>
                      <input style={{ ...INPUT }} value={alt} onChange={e => atualizarAlternativa(q.id, idx, e.target.value)} placeholder={`Alternativa ${letra(idx)}`} />
                      <button style={{ ...BTN_D, whiteSpace: 'nowrap' }} onClick={() => removerAlternativa(q.id, idx)}>×</button>
                    </div>
                  ))}
                  <button style={{ ...BTN_G, alignSelf: 'flex-start', marginTop: 4 }} onClick={() => adicionarAlternativa(q.id)}>+ opção de resposta</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button style={{ ...BTN_G, marginTop: 14 }} onClick={() => setModalAberto(true)}>+ Adicionar questão</button>
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 12.5, margin: '0 0 12px' }}>{erro}</p>}
      <button style={BTN_P} disabled={gerando} onClick={gerar}>{gerando ? 'Gerando...' : 'Gerar Prova'}</button>

      {modalAberto && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setModalAberto(false); }}
        >
          <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 360, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Essa questão é...</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button style={{ ...BTN_P, background: '#1a56db' }} onClick={() => adicionarQuestao('MULTIPLA_ESCOLHA')}>Múltipla escolha</button>
              <button style={{ ...BTN_P, background: '#374151' }} onClick={() => adicionarQuestao('DISSERTATIVA')}>Dissertativa</button>
              <button style={{ ...BTN_G, marginTop: 4 }} onClick={() => setModalAberto(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
