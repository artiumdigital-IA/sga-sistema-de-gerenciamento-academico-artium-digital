'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

interface Periodo { id: string; ano: number; semestre: number; }
interface Oferta {
  id: string; turno: string; horario: string | null;
  disciplina: { nome: string; codigo: string; };
}
interface Matricula { id: string; aluno: { ra: string; nome: string; }; }
interface ResultadoImportacao {
  total: number; sucesso: number; erro: number;
  detalhes: { ra: string; status: 'ok' | 'erro'; mensagem?: string }[];
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { ...BTN_P, background: 'transparent', color: 'var(--gray-700)', border: '1px solid var(--gray-300)', fontWeight: 500 };

const TIPOS_VALIDOS = ['PROVA', 'TRABALHO', 'EXAME_FINAL'];

export default function PlanilhaNotasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState('');
  const [gerando, setGerando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {}); }, []);
  useEffect(() => {
    if (!selectedPeriodo) { setOfertas([]); setSelectedOferta(''); return; }
    apiFetch<Oferta[]>(`/ofertas?periodoLetivoId=${selectedPeriodo}`).then(setOfertas).catch(() => {});
    setSelectedOferta('');
  }, [selectedPeriodo]);

  function csvEscape(v: string) {
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  async function gerarPlanilha() {
    if (!selectedOferta) return;
    setGerando(true); setErro('');
    try {
      const matriculas = await apiFetch<Matricula[]>(`/matriculas?ofertaId=${selectedOferta}`);
      const linhas = ['RA,Nome,Tipo,Nota,Peso'];
      for (const m of matriculas) {
        linhas.push([csvEscape(m.aluno.ra), csvEscape(m.aluno.nome), 'PROVA', '', '1'].join(','));
      }
      const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planilha-notas-${selectedOferta}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setErro(e.message ?? 'Erro ao gerar planilha'); }
    finally { setGerando(false); }
  }

  async function importarPlanilha(file: File) {
    setImportando(true); setErro(''); setResultado(null);
    try {
      const texto = await file.text();
      const linhasTexto = texto.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
      if (linhasTexto.length < 2) throw new Error('Planilha vazia ou sem linhas de dados.');

      const header = linhasTexto[0].split(',').map(h => h.trim().toLowerCase());
      const idxRa = header.indexOf('ra');
      const idxTipo = header.indexOf('tipo');
      const idxNota = header.indexOf('nota');
      const idxPeso = header.indexOf('peso');
      if (idxRa === -1 || idxTipo === -1 || idxNota === -1 || idxPeso === -1) {
        throw new Error('Cabeçalho inválido. Esperado: RA,Nome,Tipo,Nota,Peso');
      }

      const linhas: { ra: string; tipo: string; nota: number; peso: number }[] = [];
      for (const linha of linhasTexto.slice(1)) {
        const cols = linha.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const nota = cols[idxNota];
        if (!nota) continue; // pula linhas sem nota preenchida
        const tipo = (cols[idxTipo] || 'PROVA').toUpperCase();
        linhas.push({
          ra: cols[idxRa],
          tipo: TIPOS_VALIDOS.includes(tipo) ? tipo : 'PROVA',
          nota: Number(nota.replace(',', '.')),
          peso: Number((cols[idxPeso] || '1').replace(',', '.')),
        });
      }
      if (linhas.length === 0) throw new Error('Nenhuma linha com nota preenchida encontrada.');

      const res = await apiFetch<ResultadoImportacao>('/avaliacoes/importar', {
        method: 'POST',
        body: JSON.stringify({ ofertaId: selectedOferta, linhas }),
      });
      setResultado(res);
    } catch (e: any) { setErro(e.message ?? 'Erro ao importar planilha'); }
    finally { setImportando(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Planilha de Notas</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Gere uma planilha CSV para preenchimento offline, ou importe uma planilha já preenchida.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: 20, background: 'var(--gray-50)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
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
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>1. Gerar planilha</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--gray-500)' }}>
            Baixa um CSV com os alunos matriculados na oferta selecionada (colunas RA, Nome, Tipo, Nota, Peso — Nota em branco pra preencher).
          </p>
          <button style={BTN_P} disabled={!selectedOferta || gerando} onClick={gerarPlanilha}>
            {gerando ? 'Gerando...' : '↓ Gerar Planilha (CSV)'}
          </button>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>2. Importar planilha preenchida</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--gray-500)' }}>
            Envie o CSV preenchido (mesmo formato). Cada linha com Nota preenchida vira uma avaliação lançada.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            disabled={!selectedOferta || importando}
            onChange={e => { const f = e.target.files?.[0]; if (f) importarPlanilha(f); }}
            style={{ fontSize: 12 }}
          />
          {importando && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Importando...</p>}
        </div>
      </div>

      {resultado && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <strong>{resultado.sucesso}</strong> lançadas com sucesso
            </div>
            {resultado.erro > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
                <strong>{resultado.erro}</strong> com erro
              </div>
            )}
          </div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['RA', 'Status', 'Mensagem'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultado.detalhes.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 14px' }}>{d.ra}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: d.status === 'ok' ? '#d1fae5' : '#fee2e2', color: d.status === 'ok' ? '#065f46' : '#991b1b' }}>
                        {d.status === 'ok' ? 'OK' : 'Erro'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 14px', color: 'var(--gray-500)' }}>{d.mensagem ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
