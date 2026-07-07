'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type SituacaoResult = 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'PENDENTE_EXAME';
type AvaliacaoTipo = 'PROVA' | 'TRABALHO' | 'EXAME_FINAL';

interface Periodo { id: string; ano: number; semestre: number; status: string; }
interface Oferta {
  id: string; vagas: number; turno: string; horario: string | null;
  disciplina: { nome: string; codigo: string; cargaHoraria: number; };
  professor: { nome: string; } | null;
}
interface Avaliacao { id: string; tipo: AvaliacaoTipo; nota: number; peso: number; }
interface Resultado { id: string; mediaFinal: number; faltas: number; frequenciaPercentual: number; situacao: SituacaoResult; }
interface Matricula {
  id: string; status: string; isDependencia: boolean;
  aluno: { id: string; ra: string; nome: string; };
  resultado: Resultado | null;
}

const TIPO_LABEL: Record<AvaliacaoTipo, string> = { PROVA: 'Prova', TRABALHO: 'Trabalho', EXAME_FINAL: 'Exame Final' };
const SITUACAO_COLOR: Record<SituacaoResult, string> = {
  APROVADO: '#16a34a', REPROVADO_NOTA: '#dc2626', REPROVADO_FALTA: '#ea580c', PENDENTE_EXAME: '#d97706',
};
const SITUACAO_LABEL: Record<SituacaoResult, string> = {
  APROVADO: 'Aprovado', REPROVADO_NOTA: 'Rep. Nota', REPROVADO_FALTA: 'Rep. Falta', PENDENTE_EXAME: 'Exame Final',
};
const STATUS_BG: Record<string, { bg: string; color: string }> = {
  MATRICULADO: { bg: '#dbeafe', color: '#1e40af' }, APROVADO: { bg: '#d1fae5', color: '#065f46' },
  REPROVADO_NOTA: { bg: '#fee2e2', color: '#991b1b' }, REPROVADO_FALTA: { bg: '#ffedd5', color: '#9a3412' },
  DEPENDENCIA: { bg: '#f3e8ff', color: '#6b21a8' }, TRANCADO: { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
};

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const BTN_P: React.CSSProperties = { padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { ...BTN_P, background: 'transparent', color: 'var(--gray-700)', border: '1px solid var(--gray-300)' };

function SituacaoBadge({ situacao }: { situacao: SituacaoResult }) {
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#fff', background: SITUACAO_COLOR[situacao] }}>{SITUACAO_LABEL[situacao]}</span>;
}

function ModalNotas({ matricula, onClose, onUpdate }: { matricula: Matricula; onClose: () => void; onUpdate: () => void }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<AvaliacaoTipo>('PROVA');
  const [nota, setNota] = useState('');
  const [peso, setPeso] = useState('1');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setAvaliacoes(await apiFetch<Avaliacao[]>(`/avaliacoes?matriculaDisciplinaId=${matricula.id}`)); }
    finally { setLoading(false); }
  }, [matricula.id]);

  useEffect(() => { carregar(); }, [carregar]);

  async function addAv(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSalvando(true);
    try {
      await apiFetch('/avaliacoes', { method: 'POST', body: JSON.stringify({ matriculaDisciplinaId: matricula.id, tipo, nota: Number(nota), peso: Number(peso) }) });
      setNota(''); setPeso('1'); await carregar(); onUpdate();
    } catch (e: any) { setErro(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function delAv(id: string) {
    if (!confirm('Excluir esta avaliacao?')) return;
    try { await apiFetch(`/avaliacoes/${id}`, { method: 'DELETE' }); await carregar(); onUpdate(); }
    catch (e: any) { setErro(e.message ?? 'Erro'); }
  }

  const totalPeso = avaliacoes.reduce((s, a) => s + Number(a.peso), 0);
  const media = totalPeso > 0 ? avaliacoes.reduce((s, a) => s + Number(a.nota) * Number(a.peso), 0) / totalPeso : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 28, width: 580, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }}>Notas — {matricula.aluno.nome}</h2>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--gray-500)' }}>RA {matricula.aluno.ra}</p>

        {loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (<>
          {avaliacoes.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead><tr style={{ background: 'var(--gray-50)' }}>
                {['Tipo', 'Nota', 'Peso', 'Contrib.', ''].map(h => (
                  <th key={h} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--gray-700)', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{avaliacoes.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>{TIPO_LABEL[a.tipo]}</td>
                  <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{Number(a.nota).toFixed(1)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>{a.peso}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--gray-500)' }}>{(Number(a.nota) * Number(a.peso)).toFixed(2)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button onClick={() => delAv(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1 }}>×</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 14 }}>Nenhuma avaliacao lancada.</p>}

          {media !== null && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 13 }}>
              Media ponderada atual: <strong>{media.toFixed(2)}</strong>
              <span style={{ marginLeft: 12, color: media >= 6 ? '#16a34a' : '#dc2626' }}>{media >= 6 ? 'Aprovado na media' : 'Abaixo de 6.0'}</span>
            </div>
          )}

          <form onSubmit={addAv} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 3 }}>Tipo</label>
              <select style={INPUT} value={tipo} onChange={e => setTipo(e.target.value as AvaliacaoTipo)}>
                {(Object.entries(TIPO_LABEL) as [AvaliacaoTipo, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 3 }}>Nota (0-10)</label>
              <input style={INPUT} type="number" min="0" max="10" step="0.1" value={nota} onChange={e => setNota(e.target.value)} required placeholder="0.0" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 3 }}>Peso</label>
              <input style={INPUT} type="number" min="0.1" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} required />
            </div>
            <button type="submit" style={{ ...BTN_P, height: 36, whiteSpace: 'nowrap' }} disabled={salvando}>+ Lançar</button>
          </form>
          {erro && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{erro}</p>}
        </>)}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button style={BTN_G} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function ModalConsolidar({ matricula, onClose, onUpdate }: { matricula: Matricula; onClose: () => void; onUpdate: () => void }) {
  const [totalAulas, setTotalAulas] = useState('');
  const [faltas, setFaltas] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscandoFreq, setBuscandoFreq] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState('');

  const freq = totalAulas && faltas && Number(totalAulas) > 0
    ? (((Number(totalAulas) - Number(faltas)) / Number(totalAulas)) * 100).toFixed(1) : null;

  async function calcularDaFrequenciaLancada() {
    setBuscandoFreq(true); setErro('');
    try {
      const r = await apiFetch<{ totalAulas: number; totalFaltas: number; diasLancados: number }>(`/frequencia/resumo-matricula/${matricula.id}`);
      if (r.diasLancados === 0) { setErro('Nenhum dia de frequência lançado ainda pra essa turma.'); return; }
      setTotalAulas(String(r.totalAulas));
      setFaltas(String(r.totalFaltas));
    } catch (e: any) { setErro(e.message ?? 'Erro ao buscar frequência lançada'); }
    finally { setBuscandoFreq(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSalvando(true);
    try {
      const res = await apiFetch<Resultado>(`/matriculas/${matricula.id}/consolidar`, {
        method: 'POST', body: JSON.stringify({ totalAulas: Number(totalAulas), faltas: Number(faltas) }),
      });
      setResultado(res); onUpdate();
    } catch (e: any) { setErro(e.message ?? 'Erro ao consolidar'); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 28, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }}>Consolidar — {matricula.aluno.nome}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--gray-500)' }}>RA {matricula.aluno.ra}</p>

        {resultado ? (
          <>
            <div style={{ background: resultado.situacao === 'APROVADO' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${resultado.situacao === 'APROVADO' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}><SituacaoBadge situacao={resultado.situacao} /></div>
              <p style={{ margin: '4px 0', fontSize: 13 }}>Media final: <strong>{Number(resultado.mediaFinal).toFixed(2)}</strong></p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>Frequencia: <strong>{Number(resultado.frequenciaPercentual).toFixed(1)}%</strong></p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>Faltas: <strong>{resultado.faltas}</strong></p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={BTN_G} onClick={onClose}>Fechar</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button type="button" style={{ ...BTN_G, alignSelf: 'flex-start', fontSize: 12, padding: '5px 10px' }} disabled={buscandoFreq} onClick={calcularDaFrequenciaLancada}>
              {buscandoFreq ? 'Buscando...' : '↺ Calcular da frequência diária lançada'}
            </button>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Total de aulas ministradas *</label>
              <input style={INPUT} type="number" min="1" value={totalAulas} onChange={e => setTotalAulas(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Faltas do aluno *</label>
              <input style={INPUT} type="number" min="0" value={faltas} onChange={e => setFaltas(e.target.value)} required />
            </div>
            {freq && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
                Frequencia calculada: <strong>{freq}%</strong>
                {Number(freq) < 75 && <span style={{ color: '#dc2626', marginLeft: 8 }}>⚠ Abaixo de 75% — reprovado por falta</span>}
              </div>
            )}
            {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" style={BTN_G} onClick={onClose}>Cancelar</button>
              <button type="submit" style={BTN_P} disabled={salvando}>{salvando ? 'Calculando...' : 'Consolidar'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function NotasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState('');
  const [ofertaInfo, setOfertaInfo] = useState<Oferta | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [modalNotas, setModalNotas] = useState<Matricula | null>(null);
  const [modalConsolidar, setModalConsolidar] = useState<Matricula | null>(null);

  useEffect(() => { apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPeriodo) { setOfertas([]); setSelectedOferta(''); setMatriculas([]); return; }
    apiFetch<Oferta[]>(`/ofertas?periodoLetivoId=${selectedPeriodo}`).then(setOfertas).catch(() => {});
    setSelectedOferta(''); setMatriculas([]);
  }, [selectedPeriodo]);

  const carregarMatriculas = useCallback(async (ofertaId: string) => {
    if (!ofertaId) { setMatriculas([]); setOfertaInfo(null); return; }
    setLoading(true); setErro('');
    try {
      setMatriculas(await apiFetch<Matricula[]>(`/matriculas?ofertaId=${ofertaId}`));
      setOfertaInfo(ofertas.find(o => o.id === ofertaId) ?? null);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [ofertas]);

  useEffect(() => { carregarMatriculas(selectedOferta); }, [selectedOferta, carregarMatriculas]);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Lancamento de Notas</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Selecione o periodo e a oferta para gerenciar notas e frequencia</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: 20, background: 'var(--gray-50)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Periodo Letivo</label>
          <select style={INPUT} value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}>
            <option value="">Selecione...</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Oferta / Disciplina</label>
          <select style={INPUT} value={selectedOferta} onChange={e => setSelectedOferta(e.target.value)} disabled={!selectedPeriodo}>
            <option value="">Selecione o periodo primeiro...</option>
            {ofertas.map(o => <option key={o.id} value={o.id}>{o.disciplina.nome} — {o.turno}{o.horario ? ` (${o.horario})` : ''}</option>)}
          </select>
        </div>
      </div>

      {ofertaInfo && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
          <span><strong>Disciplina:</strong> {ofertaInfo.disciplina.nome} ({ofertaInfo.disciplina.codigo})</span>
          <span><strong>Professor:</strong> {ofertaInfo.professor?.nome ?? '—'}</span>
          <span><strong>Turno:</strong> {ofertaInfo.turno}</span>
          <span><strong>C.H.:</strong> {ofertaInfo.disciplina.cargaHoraria}h</span>
          <span><strong>Vagas:</strong> {ofertaInfo.vagas}</span>
        </div>
      )}

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>}
      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!loading && selectedOferta && matriculas.length === 0 && (
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Nenhum aluno matriculado nesta oferta.</p>
      )}

      {!loading && matriculas.length > 0 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--gray-50)' }}>
              {['RA', 'Nome', 'Situacao', 'Media', 'Freq%', 'Resultado', 'Acoes'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{matriculas.map(m => {
              const st = STATUS_BG[m.status] ?? { bg: 'var(--gray-100)', color: 'var(--gray-700)' };
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{m.aluno.ra}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {m.aluno.nome}
                    {m.isDependencia && <span style={{ marginLeft: 6, fontSize: 10, background: '#f3e8ff', color: '#6b21a8', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>DP</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: st.color, background: st.bg }}>{m.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{m.resultado ? Number(m.resultado.mediaFinal).toFixed(2) : '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{m.resultado ? `${Number(m.resultado.frequenciaPercentual).toFixed(1)}%` : '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{m.resultado ? <SituacaoBadge situacao={m.resultado.situacao} /> : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Pendente</span>}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setModalNotas(m)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>Notas</button>
                      <button onClick={() => setModalConsolidar(m)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 500 }}>Consolidar</button>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {modalNotas && <ModalNotas matricula={modalNotas} onClose={() => setModalNotas(null)} onUpdate={() => carregarMatriculas(selectedOferta)} />}
      {modalConsolidar && <ModalConsolidar matricula={modalConsolidar} onClose={() => setModalConsolidar(null)} onUpdate={() => carregarMatriculas(selectedOferta)} />}
    </div>
  );
}
