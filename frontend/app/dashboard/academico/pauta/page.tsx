'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
interface PeriodoLetivo { id: string; ano: number; semestre: 'S1' | 'S2'; }
interface Curso { id: string; nome: string; }
interface Matriz { id: string; cursoId: string; }
interface Disciplina { id: string; codigo: string; nome: string; matrizCurricularId: string; }
interface Oferta {
  id: string; periodoLetivoId: string; disciplinaId: string; turno: string;
  disciplina?: { codigo: string; nome: string };
}
interface LinhaPauta {
  matriculaDisciplinaId: string;
  numero: number;
  aluno: { id: string; ra: string; nome: string };
  av1: number | null; av2: number | null; av3: number | null; av4: number | null; av5: number | null;
  segundaChamada: number | null; recuperacao: number | null;
  faltas: number;
  media: number | null;
}
interface PautaResponse {
  oferta: { id: string; disciplina: string; codigo: string; periodo: { ano: number; semestre: string }; professor: string | null; turno: string };
  linhas: LinhaPauta[];
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };

function formatNota(v: number | null): string {
  if (v === null || v === undefined) return '<SN>';
  if (Number(v) === 10) return 'Dez';
  return Number(v).toFixed(2).replace('.', ',');
}

type CampoNota = 'av1' | 'av2' | 'av3' | 'av4' | 'av5' | 'segundaChamada' | 'recuperacao';

function CelaNota({ valor, salvando, onSave }: { valor: number | null; salvando: boolean; onSave: (v: number | null) => void }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');

  function iniciar() {
    if (salvando) return;
    setTexto(valor !== null && valor !== undefined ? String(valor).replace('.', ',') : '');
    setEditando(true);
  }

  function commit() {
    const limpo = texto.trim().replace(',', '.');
    if (limpo === '') { onSave(null); setEditando(false); return; }
    const novo = Number(limpo);
    if (isNaN(novo) || novo < 0 || novo > 10) {
      alert('A nota deve ser um número entre 0 e 10.');
      return;
    }
    onSave(novo);
    setEditando(false);
  }

  if (editando) {
    return (
      <input
        autoFocus
        style={{ width: 54, padding: '3px 4px', fontSize: 12, textAlign: 'center', border: '1px solid #2563eb', borderRadius: 3 }}
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditando(false);
        }}
      />
    );
  }

  return (
    <span
      onClick={iniciar}
      title="Clique para editar"
      style={{
        display: 'inline-block', width: 54, padding: '3px 4px', fontSize: 12, textAlign: 'center',
        cursor: salvando ? 'wait' : 'pointer', borderRadius: 3,
        color: valor === null || valor === undefined ? '#93c5fd' : (Number(valor) < 6 ? '#dc2626' : 'var(--gray-700)'),
        fontWeight: valor === null || valor === undefined ? 400 : 600,
        opacity: salvando ? 0.5 : 1,
      }}
    >
      {formatNota(valor)}
    </span>
  );
}

function CelaFaltas({ valor, salvando, onSave }: { valor: number; salvando: boolean; onSave: (v: number) => void }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');

  function iniciar() {
    if (salvando) return;
    setTexto(String(valor));
    setEditando(true);
  }

  function commit() {
    const novo = Number(texto.trim() || '0');
    if (isNaN(novo) || novo < 0) { alert('Faltas deve ser um número ≥ 0.'); return; }
    onSave(novo);
    setEditando(false);
  }

  if (editando) {
    return (
      <input
        autoFocus
        style={{ width: 44, padding: '3px 4px', fontSize: 12, textAlign: 'center', border: '1px solid #2563eb', borderRadius: 3 }}
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditando(false); }}
      />
    );
  }

  return (
    <span onClick={iniciar} title="Clique para editar" style={{ display: 'inline-block', width: 44, padding: '3px 4px', fontSize: 12, textAlign: 'center', cursor: salvando ? 'wait' : 'pointer', opacity: salvando ? 0.5 : 1 }}>
      {valor}
    </span>
  );
}

export default function PautaPage() {
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);

  const [periodoId, setPeriodoId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [ofertaId, setOfertaId] = useState('');

  const [pauta, setPauta] = useState<PautaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<PeriodoLetivo[]>('/periodos-letivos'),
      apiFetch<Curso[]>('/cursos'),
      apiFetch<Matriz[]>('/matrizes'),
      apiFetch<Disciplina[]>('/disciplinas'),
      apiFetch<Oferta[]>('/ofertas'),
    ]).then(([per, cur, mat, dis, ofe]) => {
      setPeriodos(per); setCursos(cur); setMatrizes(mat); setDisciplinas(dis); setOfertas(ofe);
    }).catch(() => {});
  }, []);

  const disciplinaCursoMap = useMemo(() => {
    const matrizCurso = new Map(matrizes.map(m => [m.id, m.cursoId]));
    const map = new Map<string, string>();
    for (const d of disciplinas) {
      const cId = matrizCurso.get(d.matrizCurricularId);
      if (cId) map.set(d.id, cId);
    }
    return map;
  }, [matrizes, disciplinas]);

  const ofertasFiltradas = useMemo(() => {
    return ofertas.filter(o => {
      if (periodoId && o.periodoLetivoId !== periodoId) return false;
      if (cursoId && disciplinaCursoMap.get(o.disciplinaId) !== cursoId) return false;
      return true;
    });
  }, [ofertas, periodoId, cursoId, disciplinaCursoMap]);

  const periodoLabel = (p: PeriodoLetivo) => `${p.ano}/${p.semestre === 'S1' ? '1' : '2'}`;

  const carregarPauta = useCallback(async (ofId: string) => {
    if (!ofId) { setPauta(null); return; }
    setLoading(true); setErro('');
    try {
      setPauta(await apiFetch<PautaResponse>(`/notas-pauta?ofertaId=${ofId}`));
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar a pauta');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarPauta(ofertaId); }, [ofertaId, carregarPauta]);

  async function salvarCampo(matriculaDisciplinaId: string, campo: CampoNota, valor: number | null) {
    if (!pauta) return;
    const linha = pauta.linhas.find(l => l.matriculaDisciplinaId === matriculaDisciplinaId);
    if (!linha) return;
    setSalvandoId(matriculaDisciplinaId);
    try {
      const body = {
        av1: linha.av1, av2: linha.av2, av3: linha.av3, av4: linha.av4, av5: linha.av5,
        segundaChamada: linha.segundaChamada, recuperacao: linha.recuperacao, faltas: linha.faltas,
        [campo]: valor,
      };
      const atualizado = await apiFetch<LinhaPauta>(`/notas-pauta/${matriculaDisciplinaId}`, {
        method: 'PUT', body: JSON.stringify(body),
      });
      setPauta(p => p ? {
        ...p,
        linhas: p.linhas.map(l => l.matriculaDisciplinaId === matriculaDisciplinaId ? { ...l, ...atualizado } : l),
      } : p);
    } catch (e: any) {
      alert(e.message ?? 'Erro ao salvar a nota');
    } finally {
      setSalvandoId(null);
    }
  }

  async function salvarFaltas(matriculaDisciplinaId: string, valor: number) {
    if (!pauta) return;
    const linha = pauta.linhas.find(l => l.matriculaDisciplinaId === matriculaDisciplinaId);
    if (!linha) return;
    setSalvandoId(matriculaDisciplinaId);
    try {
      const body = {
        av1: linha.av1, av2: linha.av2, av3: linha.av3, av4: linha.av4, av5: linha.av5,
        segundaChamada: linha.segundaChamada, recuperacao: linha.recuperacao, faltas: valor,
      };
      const atualizado = await apiFetch<LinhaPauta>(`/notas-pauta/${matriculaDisciplinaId}`, {
        method: 'PUT', body: JSON.stringify(body),
      });
      setPauta(p => p ? {
        ...p,
        linhas: p.linhas.map(l => l.matriculaDisciplinaId === matriculaDisciplinaId ? { ...l, ...atualizado } : l),
      } : p);
    } catch (e: any) {
      alert(e.message ?? 'Erro ao salvar as faltas');
    } finally {
      setSalvandoId(null);
    }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Lançamento de Notas &amp; Frequência por Pauta</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Selecione o período, o curso e a turma/matéria pra lançar as notas do semestre</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 16, background: 'var(--gray-50)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Ano / Período Letivo</label>
          <select style={INPUT} value={periodoId} onChange={e => { setPeriodoId(e.target.value); setOfertaId(''); }}>
            <option value="">Todos</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{periodoLabel(p)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Curso</label>
          <select style={INPUT} value={cursoId} onChange={e => { setCursoId(e.target.value); setOfertaId(''); }}>
            <option value="">Todos</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Turma / Matéria</label>
          <select style={INPUT} value={ofertaId} onChange={e => setOfertaId(e.target.value)}>
            <option value="">Selecione a turma/matéria...</option>
            {ofertasFiltradas.map(o => <option key={o.id} value={o.id}>{o.disciplina?.codigo} — {o.disciplina?.nome} ({o.turno})</option>)}
          </select>
        </div>
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>}
      {!loading && !ofertaId && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Selecione uma turma/matéria pra ver a pauta.</p>}
      {!loading && ofertaId && pauta && pauta.linhas.length === 0 && (
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Nenhum aluno matriculado nesta turma.</p>
      )}

      {!loading && pauta && pauta.linhas.length > 0 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Matrícula', 'Nome', 'Nº', 'AV1', 'AV2', 'AV3', 'AV4', 'AV5', '2°', 'Recup.', 'Média', 'Faltas'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--gray-700)', textAlign: h === 'Nome' ? 'left' : 'center', borderBottom: '1px solid var(--gray-200)', borderRight: '1px solid var(--gray-100)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pauta.linhas.map((l, i) => (
                <tr key={l.matriculaDisciplinaId} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600, borderRight: '1px solid var(--gray-100)' }}>{l.aluno.ra}</td>
                  <td style={{ padding: '6px 10px', borderRight: '1px solid var(--gray-100)' }}>{l.aluno.nome}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid var(--gray-100)' }}>{l.numero}</td>
                  {(['av1', 'av2', 'av3', 'av4', 'av5', 'segundaChamada', 'recuperacao'] as CampoNota[]).map(campo => (
                    <td key={campo} style={{ padding: '2px', textAlign: 'center', borderRight: '1px solid var(--gray-100)' }}>
                      <CelaNota valor={l[campo]} salvando={salvandoId === l.matriculaDisciplinaId} onSave={v => salvarCampo(l.matriculaDisciplinaId, campo, v)} />
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid var(--gray-100)' }}>{formatNota(l.media)}</td>
                  <td style={{ padding: '2px', textAlign: 'center' }}>
                    <CelaFaltas valor={l.faltas} salvando={salvandoId === l.matriculaDisciplinaId} onSave={v => salvarFaltas(l.matriculaDisciplinaId, v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pauta && pauta.linhas.length > 0 && (
        <p style={{ marginTop: 10, fontSize: 11, color: 'var(--gray-400)' }}>
          &lt;SN&gt; = sem nota lançada ainda. Clique numa célula pra editar. Fórmula: Média = (AV1+AV2+AV3+AV4 + (2°&gt;0 ? 2° : AV5)×6) ÷ 10, substituída pela Recuperação se a média ficar abaixo de 6 e a recuperação for maior.
        </p>
      )}
    </div>
  );
}
