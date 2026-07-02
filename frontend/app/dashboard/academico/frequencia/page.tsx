'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Periodo { id: string; ano: number; semestre: number; }
interface Oferta {
  id: string; turno: string; horario: string | null;
  disciplina: { nome: string; codigo: string; };
}
interface Matricula { id: string; aluno: { id: string; ra: string; nome: string; }; }
interface RegistroExistente { alunoId: string; ra: string; nome: string; quantidadeAulas: number; faltas: number; observacao: string | null; }
interface ResumoAluno {
  matriculaDisciplinaId: string;
  aluno: { id: string; ra: string; nome: string };
  diasLancados: number;
  totalAulas: number;
  totalFaltas: number;
  frequenciaPercentual: number;
  emAtraso: boolean;
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '6px 14px', borderRadius: 5, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'transparent', color: '#374151' };

export default function FrequenciaPage() {
  const [tab, setTab] = useState<'lancar' | 'resumo'>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'resumo') return 'resumo';
    return 'lancar';
  });
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [quantidadeAulas, setQuantidadeAulas] = useState('2');
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [faltasPorAluno, setFaltasPorAluno] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<{ sucesso: number; erro: number } | null>(null);
  const [resumo, setResumo] = useState<ResumoAluno[]>([]);

  useEffect(() => { apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPeriodo) { setOfertas([]); setSelectedOferta(''); return; }
    apiFetch<Oferta[]>(`/ofertas?periodoLetivoId=${selectedPeriodo}`).then(setOfertas).catch(() => {});
    setSelectedOferta('');
  }, [selectedPeriodo]);

  const carregarLancamento = useCallback(async () => {
    if (!selectedOferta || !data) { setMatriculas([]); return; }
    setLoading(true); setErro(''); setResultado(null);
    try {
      const [ms, existentes] = await Promise.all([
        apiFetch<Matricula[]>(`/matriculas?ofertaId=${selectedOferta}`),
        apiFetch<RegistroExistente[]>(`/frequencia?ofertaId=${selectedOferta}&data=${data}`),
      ]);
      setMatriculas(ms);
      const mapa: Record<string, number> = {};
      ms.forEach(m => { mapa[m.aluno.id] = 0; });
      existentes.forEach(e => { mapa[e.alunoId] = e.faltas; });
      setFaltasPorAluno(mapa);
      if (existentes.length > 0) setQuantidadeAulas(String(existentes[0].quantidadeAulas));
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [selectedOferta, data]);

  const carregarResumo = useCallback(async () => {
    if (!selectedOferta) { setResumo([]); return; }
    setLoading(true); setErro('');
    try { setResumo(await apiFetch<ResumoAluno[]>(`/frequencia/resumo/${selectedOferta}`)); }
    catch (e: any) { setErro(e.message ?? 'Erro ao carregar resumo'); }
    finally { setLoading(false); }
  }, [selectedOferta]);

  useEffect(() => {
    if (tab === 'lancar') carregarLancamento();
    else carregarResumo();
  }, [tab, carregarLancamento, carregarResumo]);

  async function salvar() {
    if (!quantidadeAulas || Number(quantidadeAulas) < 1) { alert('Informe a quantidade de aulas do dia.'); return; }
    setSalvando(true); setErro('');
    try {
      const registros = matriculas.map(m => ({ alunoId: m.aluno.id, faltas: faltasPorAluno[m.aluno.id] ?? 0 }));
      const res = await apiFetch<{ sucesso: number; erro: number }>('/frequencia/lancar', {
        method: 'POST',
        body: JSON.stringify({ ofertaId: selectedOferta, data, quantidadeAulas: Number(quantidadeAulas), registros }),
      });
      setResultado(res);
    } catch (e: any) { setErro(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Frequência</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Lançamento de entrada/faltas por dia de aula, e listagem de alunos em atraso.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setTab('lancar')} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: tab === 'lancar' ? '2px solid #1a56db' : '2px solid transparent', color: tab === 'lancar' ? '#1a56db' : '#6b7280' }}>
          Lançamento Diário
        </button>
        <button onClick={() => setTab('resumo')} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: tab === 'resumo' ? '2px solid #1a56db' : '2px solid transparent', color: tab === 'resumo' ? '#1a56db' : '#6b7280' }}>
          Resumo / Alunos em Atraso
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: tab === 'lancar' ? '200px 1fr 140px 120px' : '200px 1fr', gap: 12, marginBottom: 20, background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', alignItems: 'end' }}>
        <div>
          <label style={LABEL}>Período Letivo</label>
          <select style={INPUT} value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}>
            <option value="">Selecione...</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>Oferta / Disciplina</label>
          <select style={INPUT} value={selectedOferta} onChange={e => setSelectedOferta(e.target.value)} disabled={!selectedPeriodo}>
            <option value="">Selecione o período primeiro...</option>
            {ofertas.map(o => <option key={o.id} value={o.id}>{o.disciplina.nome} — {o.turno}{o.horario ? ` (${o.horario})` : ''}</option>)}
          </select>
        </div>
        {tab === 'lancar' && (
          <>
            <div>
              <label style={LABEL}>Data</label>
              <input style={INPUT} type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Qtd. Aulas</label>
              <input style={INPUT} type="number" min={1} value={quantidadeAulas} onChange={e => setQuantidadeAulas(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}

      {tab === 'lancar' && !loading && selectedOferta && (
        matriculas.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum aluno matriculado nesta oferta.</p>
        ) : (
          <>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['RA', 'Nome', `Faltas nesse dia (máx. ${quantidadeAulas || 0})`].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600 }}>{m.aluno.ra}</td>
                      <td style={{ padding: '8px 14px' }}>{m.aluno.nome}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <input
                          style={{ ...INPUT, width: 90 }}
                          type="number" min={0} max={Number(quantidadeAulas) || 0}
                          value={faltasPorAluno[m.aluno.id] ?? 0}
                          onChange={e => setFaltasPorAluno(f => ({ ...f, [m.aluno.id]: Number(e.target.value) }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button style={BTN_P} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Salvar Frequência do Dia'}</button>
            {resultado && (
              <span style={{ marginLeft: 12, fontSize: 13, color: resultado.erro > 0 ? '#dc2626' : '#16a34a' }}>
                {resultado.sucesso} salvos{resultado.erro > 0 ? `, ${resultado.erro} com erro` : ''}.
              </span>
            )}
          </>
        )
      )}

      {tab === 'resumo' && !loading && selectedOferta && (
        resumo.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum aluno matriculado nesta oferta.</p>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['RA', 'Nome', 'Dias Lançados', 'Total Aulas', 'Total Faltas', 'Frequência', 'Situação'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumo.map(r => (
                  <tr key={r.matriculaDisciplinaId} style={{ borderBottom: '1px solid #f3f4f6', background: r.emAtraso ? '#fef2f2' : undefined }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{r.aluno.ra}</td>
                    <td style={{ padding: '8px 14px' }}>{r.aluno.nome}</td>
                    <td style={{ padding: '8px 14px' }}>{r.diasLancados}</td>
                    <td style={{ padding: '8px 14px' }}>{r.totalAulas}</td>
                    <td style={{ padding: '8px 14px' }}>{r.totalFaltas}</td>
                    <td style={{ padding: '8px 14px' }}>{r.frequenciaPercentual.toFixed(1)}%</td>
                    <td style={{ padding: '8px 14px' }}>
                      {r.emAtraso
                        ? <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>Em atraso</span>
                        : <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
