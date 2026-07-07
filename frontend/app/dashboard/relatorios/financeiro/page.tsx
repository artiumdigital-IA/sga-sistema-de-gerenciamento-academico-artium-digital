'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface LinhaInadimplencia {
  parcelaId: string; numero: number; valor: string; dataVencimento: string; diasAtraso: number;
  aluno: { id: string; ra: string; nome: string; email: string; telefone: string | null };
  periodo: { ano: number; semestre: string };
}
interface Inadimplencia { total: number; valorTotalEmAtraso: number; linhas: LinhaInadimplencia[]; }
interface LinhaTurma { curso: string; periodo: string; contratos: number; valorTotal: number; valorPago: number; valorPendente: number; }
interface LinhaContabil { curso: string; competencia: string; quantidade: number; valorRecebido: number; }

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function RelatoriosFinanceirosPage() {
  const [tab, setTab] = useState<'inadimplencia' | 'turma' | 'contabil'>('inadimplencia');
  const [inadimplencia, setInadimplencia] = useState<Inadimplencia | null>(null);
  const [turma, setTurma] = useState<LinhaTurma[]>([]);
  const [contabil, setContabil] = useState<LinhaContabil[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async (t: typeof tab) => {
    setLoading(true);
    try {
      if (t === 'inadimplencia') setInadimplencia(await apiFetch<Inadimplencia>('/relatorios/financeiro/inadimplencia'));
      if (t === 'turma') setTurma(await apiFetch<LinhaTurma[]>('/relatorios/financeiro/resumo-turma'));
      if (t === 'contabil') setContabil(await apiFetch<LinhaContabil[]>('/relatorios/financeiro/resumo-contabil'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(tab); }, [tab, carregar]);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Relatórios Financeiros</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Inadimplência, resumo por turma e resumo contábil por competência.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--gray-200)' }}>
        {([
          ['inadimplencia', 'Inadimplência'],
          ['turma', 'Resumo por Turma'],
          ['contabil', 'Resumo Contábil'],
        ] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: tab === v ? '2px solid #1a56db' : '2px solid transparent', color: tab === v ? '#1a56db' : 'var(--gray-500)' }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>}

      {!loading && tab === 'inadimplencia' && inadimplencia && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <strong>{inadimplencia.total}</strong> parcelas em atraso
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Total em atraso: <strong>{money(inadimplencia.valorTotalEmAtraso)}</strong>
            </div>
          </div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['RA', 'Aluno', 'Período', 'Parcela', 'Valor', 'Vencimento', 'Dias em Atraso'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {inadimplencia.linhas.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma parcela em atraso.</td></tr>}
                {inadimplencia.linhas.map(l => (
                  <tr key={l.parcelaId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{l.aluno.ra}</td>
                    <td style={{ padding: '8px 14px' }}>{l.aluno.nome}</td>
                    <td style={{ padding: '8px 14px' }}>{l.periodo.ano}/{l.periodo.semestre}</td>
                    <td style={{ padding: '8px 14px' }}>{l.numero}</td>
                    <td style={{ padding: '8px 14px' }}>{money(Number(l.valor))}</td>
                    <td style={{ padding: '8px 14px' }}>{new Date(l.dataVencimento).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '8px 14px', color: '#dc2626', fontWeight: 600 }}>{l.diasAtraso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && tab === 'turma' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Curso', 'Período', 'Contratos', 'Valor Total', 'Valor Pago', 'Valor Pendente'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {turma.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum contrato encontrado.</td></tr>}
              {turma.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 14px' }}>{l.curso}</td>
                  <td style={{ padding: '8px 14px' }}>{l.periodo}</td>
                  <td style={{ padding: '8px 14px' }}>{l.contratos}</td>
                  <td style={{ padding: '8px 14px' }}>{money(l.valorTotal)}</td>
                  <td style={{ padding: '8px 14px', color: '#16a34a' }}>{money(l.valorPago)}</td>
                  <td style={{ padding: '8px 14px', color: '#dc2626' }}>{money(l.valorPendente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'contabil' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Competência', 'Curso', 'Qtd. Parcelas', 'Valor Recebido'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {contabil.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum recebimento encontrado.</td></tr>}
              {contabil.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 14px' }}>{l.competencia}</td>
                  <td style={{ padding: '8px 14px' }}>{l.curso}</td>
                  <td style={{ padding: '8px 14px' }}>{l.quantidade}</td>
                  <td style={{ padding: '8px 14px', color: '#16a34a' }}>{money(l.valorRecebido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
