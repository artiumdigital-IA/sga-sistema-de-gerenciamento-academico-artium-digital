'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Periodo { id: string; ano: number; semestre: string; status: string; }
interface Oferta {
  id: string; turno: string; horario: string | null;
  disciplina: { nome: string; codigo: string; };
}
interface AvaliacaoMapao { tipo: string; nota: string | number; peso: string | number; }
interface AlunoMapao {
  matriculaId: string;
  aluno: { id: string; ra: string; nome: string };
  isDependencia: boolean;
  status: string;
  avaliacoes: AvaliacaoMapao[];
  mediaFinal: string | number | null;
  faltas: number | null;
  frequenciaPercentual: string | number | null;
  situacao: string | null;
}
interface MapaoData {
  oferta: {
    id: string; disciplina: string; codigo: string; cargaHoraria: number;
    periodo: { ano: number; semestre: string }; professor: string | null; turno: string; vagas: number;
  };
  alunos: AlunoMapao[];
  geradoEm: string;
}

const TIPO_ABREV: Record<string, string> = { PROVA: 'PV', TRABALHO: 'TB', EXAME_FINAL: 'EX' };
const SITUACAO_LABEL: Record<string, string> = {
  APROVADO: 'Aprovado', REPROVADO_NOTA: 'Rep. Nota', REPROVADO_FALTA: 'Rep. Falta', PENDENTE_EXAME: 'Exame Final',
};
const STATUS_LABEL: Record<string, string> = {
  MATRICULADO: 'Cursando', APROVADO: 'Aprovado', REPROVADO_NOTA: 'Rep. Nota', REPROVADO_FALTA: 'Rep. Falta',
  DEPENDENCIA: 'DP', TRANCADO: 'Trancado', CANCELADO: 'Cancelado',
};

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1e3a5f', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '7px 16px', borderRadius: 4, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 13, background: '#fff', color: '#374151' };

export default function MapaoPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState('');
  const [data, setData] = useState<MapaoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => { apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPeriodo) { setOfertas([]); setSelectedOferta(''); setData(null); return; }
    apiFetch<Oferta[]>(`/ofertas?periodoLetivoId=${selectedPeriodo}`).then(setOfertas).catch(() => {});
    setSelectedOferta(''); setData(null);
  }, [selectedPeriodo]);

  const carregar = useCallback(async (ofertaId: string) => {
    if (!ofertaId) { setData(null); return; }
    setLoading(true); setErro('');
    try { setData(await apiFetch<MapaoData>(`/matriculas/mapao/${ofertaId}`)); }
    catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(selectedOferta); }, [selectedOferta, carregar]);

  // Colunas de avaliação dinâmicas: união dos tipos usados por qualquer aluno da turma
  const tiposUsados = Array.from(new Set((data?.alunos ?? []).flatMap(a => a.avaliacoes.map(av => av.tipo))));

  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Relatório de Notas / Disciplinas (Mapão)</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Selecione o período e a oferta para gerar o mapa de notas da turma</p>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: 20, background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Período Letivo</label>
          <select style={INPUT} value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}>
            <option value="">Selecione...</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre === 'S1' ? 1 : 2}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Oferta / Disciplina</label>
          <select style={INPUT} value={selectedOferta} onChange={e => setSelectedOferta(e.target.value)} disabled={!selectedPeriodo}>
            <option value="">Selecione o período primeiro...</option>
            {ofertas.map(o => <option key={o.id} value={o.id}>{o.disciplina.nome} — {o.turno}{o.horario ? ` (${o.horario})` : ''}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="no-print" style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {erro && <p className="no-print" style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}

      {data && (
        <>
          <div className="no-print" style={{ marginBottom: 12 }}>
            <button style={BTN_P} onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</button>
          </div>

          <div id="mapao-doc" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #000', paddingBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>FIURJ — FACULDADE INSTITUTO UNIVERSITÁRIO DO RIO DE JANEIRO</div>
              <div style={{ fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Mapa de Notas e Frequência</div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontSize: 12.5, marginBottom: 16 }}>
              <span><strong>Disciplina:</strong> {data.oferta.disciplina} ({data.oferta.codigo})</span>
              <span><strong>Período:</strong> {data.oferta.periodo.ano}/{data.oferta.periodo.semestre === 'S1' ? 1 : 2}</span>
              <span><strong>Professor:</strong> {data.oferta.professor ?? '—'}</span>
              <span><strong>Turno:</strong> {data.oferta.turno}</span>
              <span><strong>C.H.:</strong> {data.oferta.cargaHoraria}h</span>
              <span><strong>Matriculados:</strong> {data.alunos.length}/{data.oferta.vagas}</span>
            </div>

            {data.alunos.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum aluno matriculado nesta oferta.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'left' }}>RA</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Aluno</th>
                    {tiposUsados.map(t => (
                      <th key={t} style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 46 }}>{TIPO_ABREV[t] ?? t}</th>
                    ))}
                    <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 55 }}>Média</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 50 }}>Faltas</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 55 }}>Freq. %</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 110 }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.alunos.map(a => (
                    <tr key={a.matriculaId}>
                      <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 600 }}>{a.aluno.ra}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>
                        {a.aluno.nome}
                        {a.isDependencia && <span style={{ color: '#7c3aed', fontWeight: 600 }}> (DP)</span>}
                      </td>
                      {tiposUsados.map(t => {
                        const av = a.avaliacoes.find(x => x.tipo === t);
                        return (
                          <td key={t} style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                            {av ? Number(av.nota).toFixed(1) : '—'}
                          </td>
                        );
                      })}
                      <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 600 }}>
                        {a.mediaFinal !== null ? Number(a.mediaFinal).toFixed(2) : '—'}
                      </td>
                      <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{a.faltas ?? '—'}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                        {a.frequenciaPercentual !== null ? `${Number(a.frequenciaPercentual).toFixed(0)}%` : '—'}
                      </td>
                      <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                        {a.situacao ? (SITUACAO_LABEL[a.situacao] ?? a.situacao) : (STATUS_LABEL[a.status] ?? a.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p style={{ fontSize: 10.5, color: '#6b7280', marginTop: 16 }}>
              Nota mínima de aprovação: 6,0. Frequência mínima exigida: 75%. Documento gerado eletronicamente em {new Date(data.geradoEm).toLocaleString('pt-BR')} pela plataforma acadêmica FIURJ.
            </p>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body > * { display: none; }
          #mapao-doc { display: block !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
