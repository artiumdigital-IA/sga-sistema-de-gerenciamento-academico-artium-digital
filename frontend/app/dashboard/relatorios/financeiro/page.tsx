'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { formatarData } from '@/lib/format';
import { StackedBarChart, TrendLineChart, VIZ_GOOD, VIZ_CRITICAL, type BarGroupDatum, type LinePoint } from '@/components/charts/FinanceiroCharts';

interface LinhaInadimplencia {
  parcelaId: string; numero: number; valor: string; dataVencimento: string;
  diasAtraso: number; multa: number; juros: number; mora: number; valorAtualizado: number;
  aluno: { id: string; ra: string; nome: string; email: string; telefone: string | null };
  periodo: { ano: number; semestre: string };
}
interface Inadimplencia { total: number; valorTotalEmAtraso: number; valorTotalMora: number; valorTotalAtualizado: number; linhas: LinhaInadimplencia[]; }
interface LinhaTurma { curso: string; periodo: string; contratos: number; valorTotal: number; valorPago: number; valorPendente: number; }
interface LinhaContabil { curso: string; competencia: string; quantidade: number; valorRecebido: number; }

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const moneyCompacto = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

const DIAS_POR_MES = 30; // mesma convenção "mês comercial de 30 dias" já usada no cálculo de mora do projeto

// Compara em UTC (mesma lógica de lib/format.ts) -- evita o bug já documentado
// no projeto de "data exibida um dia a menos" ao comparar ISO com o fuso local.
function chaveDataUTC(iso: string): string {
  const d = new Date(iso);
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

const FAIXAS_ATRASO = [
  { label: '< 1 mês', min: 0, max: 0 },
  { label: '1 mês', min: 1, max: 1 },
  { label: '2 meses', min: 2, max: 2 },
  { label: '3 meses', min: 3, max: 3 },
  { label: '4+ meses', min: 4, max: Infinity },
];

// Mesmo padrão de export CSV já usado em relatorios/censo/page.tsx e academico/notas/planilha/page.tsx.
function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => {
    const v = String(r[h] ?? '');
    return v.includes(',') || v.includes('"') ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// O ícone substitui o indicador nativo do input[type=date] (some/fica invisível
// em alguns navegadores fora do color-scheme certo) -- ele mesmo é o botão que
// abre o calendário nativo via showPicker(); focus() é o fallback pra navegadores
// sem showPicker (Safari mais antigo).
function abrirCalendario(ref: React.RefObject<HTMLInputElement>) {
  const el = ref.current;
  if (!el) return;
  if (typeof el.showPicker === 'function') {
    try { el.showPicker(); return; } catch { /* cai no fallback abaixo */ }
  }
  el.focus();
}

function ChartCard({ title, subtitle, onVerTabela, onExportar, children }: {
  title: string; subtitle: string; onVerTabela: () => void; onExportar: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '18px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onVerTabela} style={BTN_G}>Ver tabela completa</button>
          <button onClick={onExportar} style={{ ...BTN_G, background: 'var(--viz-good)', borderColor: 'var(--viz-good)', color: '#fff', fontWeight: 600 }}>⬇ Exportar CSV</button>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function RelatoriosFinanceirosPage() {
  const [tab, setTab] = useState<'dashboard' | 'inadimplencia' | 'turma' | 'contabil' | 'filtros'>('dashboard');
  const [inadimplencia, setInadimplencia] = useState<Inadimplencia | null>(null);
  const [turma, setTurma] = useState<LinhaTurma[]>([]);
  const [contabil, setContabil] = useState<LinhaContabil[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroMesesAtraso, setFiltroMesesAtraso] = useState(1);
  const [filtroDataInicial, setFiltroDataInicial] = useState('');
  const [filtroDataFinal, setFiltroDataFinal] = useState('');
  const dataInicialRef = useRef<HTMLInputElement>(null);
  const dataFinalRef = useRef<HTMLInputElement>(null);
  const [filtroPeriodoDash, setFiltroPeriodoDash] = useState('TODOS');
  const [filtroCursoDash, setFiltroCursoDash] = useState('TODOS');

  const carregar = useCallback(async (t: typeof tab) => {
    setLoading(true);
    try {
      // "Filtros" e "Dashboard" reaproveitam os mesmos 3 endpoints -- sem endpoint novo, só agrega/filtra na tela.
      if (t === 'inadimplencia' || t === 'filtros' || t === 'dashboard') setInadimplencia(await apiFetch<Inadimplencia>('/relatorios/financeiro/inadimplencia'));
      if (t === 'turma' || t === 'dashboard') setTurma(await apiFetch<LinhaTurma[]>('/relatorios/financeiro/resumo-turma'));
      if (t === 'contabil' || t === 'dashboard') setContabil(await apiFetch<LinhaContabil[]>('/relatorios/financeiro/resumo-contabil'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(tab); }, [tab, carregar]);

  const linhasFiltradas = (inadimplencia?.linhas ?? []).filter(l => {
    if (Math.floor(l.diasAtraso / DIAS_POR_MES) < filtroMesesAtraso) return false;
    const chave = chaveDataUTC(l.dataVencimento);
    if (filtroDataInicial && chave < filtroDataInicial) return false;
    if (filtroDataFinal && chave > filtroDataFinal) return false;
    return true;
  });
  const totalFiltrado = linhasFiltradas.reduce((s, l) => s + Number(l.valor), 0);
  const moraFiltrada = linhasFiltradas.reduce((s, l) => s + l.mora, 0);
  const atualizadoFiltrado = linhasFiltradas.reduce((s, l) => s + l.valorAtualizado, 0);

  // ---------- Dashboard: dados derivados (filtro só no cliente, sem endpoint novo) ----------
  const periodosDash = useMemo(() => {
    const set = new Set<string>();
    (inadimplencia?.linhas ?? []).forEach(l => set.add(`${l.periodo.ano}/${l.periodo.semestre}`));
    turma.forEach(t => set.add(t.periodo));
    return Array.from(set).sort();
  }, [inadimplencia, turma]);

  const cursosDash = useMemo(() => {
    const set = new Set<string>();
    turma.forEach(t => set.add(t.curso));
    contabil.forEach(c => set.add(c.curso));
    return Array.from(set).sort();
  }, [turma, contabil]);

  const linhasInadimplenciaDash = useMemo(() => {
    const linhas = inadimplencia?.linhas ?? [];
    return filtroPeriodoDash === 'TODOS' ? linhas : linhas.filter(l => `${l.periodo.ano}/${l.periodo.semestre}` === filtroPeriodoDash);
  }, [inadimplencia, filtroPeriodoDash]);

  const dadosInadimplenciaChart: BarGroupDatum[] = useMemo(() => FAIXAS_ATRASO.map(f => {
    const linhas = linhasInadimplenciaDash.filter(l => {
      const m = Math.floor(l.diasAtraso / DIAS_POR_MES);
      return m >= f.min && m <= f.max;
    });
    return { label: f.label, values: { valor: linhas.reduce((s, l) => s + l.valorAtualizado, 0) } };
  }), [linhasInadimplenciaDash]);

  const turmaDashFiltrada = useMemo(() => filtroPeriodoDash === 'TODOS' ? turma : turma.filter(t => t.periodo === filtroPeriodoDash), [turma, filtroPeriodoDash]);

  const dadosTurmaChart: BarGroupDatum[] = useMemo(() => {
    const grupos = new Map<string, { pago: number; pendente: number }>();
    turmaDashFiltrada.forEach(t => {
      const g = grupos.get(t.curso) ?? { pago: 0, pendente: 0 };
      g.pago += t.valorPago; g.pendente += t.valorPendente;
      grupos.set(t.curso, g);
    });
    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([curso, v]) => ({ label: curso, values: { pago: v.pago, pendente: v.pendente } }));
  }, [turmaDashFiltrada]);

  const contabilDashFiltrado = useMemo(() => filtroCursoDash === 'TODOS' ? contabil : contabil.filter(c => c.curso === filtroCursoDash), [contabil, filtroCursoDash]);

  const dadosContabilChart: LinePoint[] = useMemo(() => {
    const grupos = new Map<string, number>();
    contabilDashFiltrado.forEach(c => grupos.set(c.competencia, (grupos.get(c.competencia) ?? 0) + c.valorRecebido));
    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([competencia, valor]) => ({ label: competencia, value: valor }));
  }, [contabilDashFiltrado]);

  const kpiEmAtraso = linhasInadimplenciaDash.reduce((s, l) => s + l.valorAtualizado, 0);
  const kpiPendenteTurma = turmaDashFiltrada.reduce((s, t) => s + t.valorPendente, 0);
  const kpiRecebidoContabil = contabilDashFiltrado.reduce((s, c) => s + c.valorRecebido, 0);

  const exportarInadimplencia = () => downloadCsv(
    linhasInadimplenciaDash.map(l => ({
      RA: l.aluno.ra, Aluno: l.aluno.nome, Periodo: `${l.periodo.ano}/${l.periodo.semestre}`, Parcela: l.numero,
      Valor: Number(l.valor).toFixed(2), Vencimento: formatarData(l.dataVencimento), DiasAtraso: l.diasAtraso,
      Multa: l.multa.toFixed(2), Juros: l.juros.toFixed(2), Mora: l.mora.toFixed(2), ValorAtualizado: l.valorAtualizado.toFixed(2),
    })),
    `inadimplencia_${filtroPeriodoDash}.csv`,
  );
  const exportarTurma = () => downloadCsv(
    turmaDashFiltrada.map(t => ({
      Curso: t.curso, Periodo: t.periodo, Contratos: t.contratos,
      ValorTotal: t.valorTotal.toFixed(2), ValorPago: t.valorPago.toFixed(2), ValorPendente: t.valorPendente.toFixed(2),
    })),
    `resumo_turma_${filtroPeriodoDash}.csv`,
  );
  const exportarContabil = () => downloadCsv(
    contabilDashFiltrado.map(c => ({ Competencia: c.competencia, Curso: c.curso, Quantidade: c.quantidade, ValorRecebido: c.valorRecebido.toFixed(2) })),
    `resumo_contabil_${filtroCursoDash}.csv`,
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Relatórios Financeiros</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Inadimplência, resumo por turma e resumo contábil por competência.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--gray-200)' }}>
        {([
          ['dashboard', 'Dashboard'],
          ['inadimplencia', 'Inadimplência'],
          ['turma', 'Resumo por Turma'],
          ['contabil', 'Resumo Contábil'],
          ['filtros', 'Filtros'],
        ] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: tab === v ? '2px solid #1a56db' : '2px solid transparent', color: tab === v ? '#1a56db' : 'var(--gray-500)' }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>}

      {!loading && tab === 'dashboard' && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Período:</label>
              <select value={filtroPeriodoDash} onChange={e => setFiltroPeriodoDash(e.target.value)} style={{ padding: '5px 8px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' }}>
                <option value="TODOS">Todos os períodos</option>
                {periodosDash.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Curso:</label>
              <select value={filtroCursoDash} onChange={e => setFiltroCursoDash(e.target.value)} style={{ padding: '5px 8px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' }}>
                <option value="TODOS">Todos os cursos</option>
                {cursosDash.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Os filtros afetam os gráficos abaixo e o que é exportado em cada CSV.</span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Em atraso (atualizado): <strong>{money(kpiEmAtraso)}</strong>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Pendente (turmas): <strong>{money(kpiPendenteTurma)}</strong>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Recebido no período: <strong>{money(kpiRecebidoContabil)}</strong>
            </div>
          </div>

          <ChartCard
            title="Inadimplência por faixa de atraso"
            subtitle="Valor atualizado (parcela + mora) das parcelas em aberto, agrupado por tempo de atraso."
            onVerTabela={() => setTab('inadimplencia')}
            onExportar={exportarInadimplencia}
          >
            <StackedBarChart
              data={dadosInadimplenciaChart}
              series={[{ key: 'valor', label: 'Valor atualizado', color: VIZ_CRITICAL }]}
              valueFormatter={moneyCompacto}
            />
          </ChartCard>

          <ChartCard
            title="Resumo por turma — pago x pendente"
            subtitle="Valor total dos contratos por curso, dividido entre já pago e ainda pendente."
            onVerTabela={() => setTab('turma')}
            onExportar={exportarTurma}
          >
            <StackedBarChart
              data={dadosTurmaChart}
              series={[{ key: 'pago', label: 'Pago', color: VIZ_GOOD }, { key: 'pendente', label: 'Pendente', color: VIZ_CRITICAL }]}
              valueFormatter={moneyCompacto}
            />
          </ChartCard>

          <ChartCard
            title="Resumo contábil — recebido por competência"
            subtitle="Valor efetivamente recebido (parcelas pagas), por mês de competência."
            onVerTabela={() => setTab('contabil')}
            onExportar={exportarContabil}
          >
            <TrendLineChart data={dadosContabilChart} valueFormatter={moneyCompacto} />
          </ChartCard>
        </>
      )}

      {!loading && tab === 'inadimplencia' && inadimplencia && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <strong>{inadimplencia.total}</strong> parcelas em atraso
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Total em atraso: <strong>{money(inadimplencia.valorTotalEmAtraso)}</strong>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Multa + juros: <strong>{money(inadimplencia.valorTotalMora)}</strong>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Total atualizado: <strong>{money(inadimplencia.valorTotalAtualizado)}</strong>
            </div>
          </div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['RA', 'Aluno', 'Período', 'Parcela', 'Valor', 'Vencimento', 'Dias em Atraso', 'Multa', 'Juros', 'Mora', 'Valor Atualizado'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {inadimplencia.linhas.length === 0 && <tr><td colSpan={11} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma parcela em atraso.</td></tr>}
                {inadimplencia.linhas.map(l => (
                  <tr key={l.parcelaId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{l.aluno.ra}</td>
                    <td style={{ padding: '8px 14px' }}>{l.aluno.nome}</td>
                    <td style={{ padding: '8px 14px' }}>{l.periodo.ano}/{l.periodo.semestre}</td>
                    <td style={{ padding: '8px 14px' }}>{l.numero}</td>
                    <td style={{ padding: '8px 14px' }}>{money(Number(l.valor))}</td>
                    <td style={{ padding: '8px 14px' }}>{formatarData(l.dataVencimento)}</td>
                    <td style={{ padding: '8px 14px', color: '#dc2626', fontWeight: 600 }}>{l.diasAtraso}</td>
                    <td style={{ padding: '8px 14px' }}>{money(l.multa)}</td>
                    <td style={{ padding: '8px 14px' }}>{money(l.juros)}</td>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{money(l.mora)}</td>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{money(l.valorAtualizado)}</td>
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
      {!loading && tab === 'filtros' && inadimplencia && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Atraso mínimo:</label>
              <select
                value={filtroMesesAtraso}
                onChange={e => setFiltroMesesAtraso(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, background: 'var(--white)', color: 'var(--gray-700)' }}
              >
                {Array.from({ length: 60 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                Mostra parcelas com pelo menos essa quantidade de meses de atraso (mês = {DIAS_POR_MES} dias corridos).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Vencimento entre:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => abrirCalendario(dataInicialRef)}
                  aria-label="Abrir calendário (data inicial)"
                  style={{ position: 'absolute', left: 4, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                >📅</button>
                <input
                  ref={dataInicialRef}
                  type="date"
                  className="fin-date-input"
                  value={filtroDataInicial}
                  onChange={e => setFiltroDataInicial(e.target.value)}
                  style={{ padding: '5px 8px 5px 30px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, background: 'var(--white)', color: 'var(--gray-700)', colorScheme: 'light dark' }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>e</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => abrirCalendario(dataFinalRef)}
                  aria-label="Abrir calendário (data final)"
                  style={{ position: 'absolute', left: 4, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                >📅</button>
                <input
                  ref={dataFinalRef}
                  type="date"
                  className="fin-date-input"
                  value={filtroDataFinal}
                  onChange={e => setFiltroDataFinal(e.target.value)}
                  style={{ padding: '5px 8px 5px 30px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, background: 'var(--white)', color: 'var(--gray-700)', colorScheme: 'light dark' }}
                />
              </div>
              {(filtroDataInicial || filtroDataFinal) && (
                <button onClick={() => { setFiltroDataInicial(''); setFiltroDataFinal(''); }} style={{ ...BTN_G, padding: '5px 10px' }}>
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <strong>{linhasFiltradas.length}</strong> parcela(s) com {filtroMesesAtraso}+ {filtroMesesAtraso === 1 ? 'mês' : 'meses'} de atraso
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Valor: <strong>{money(totalFiltrado)}</strong>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Multa + juros: <strong>{money(moraFiltrada)}</strong>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              Total atualizado: <strong>{money(atualizadoFiltrado)}</strong>
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['RA', 'Aluno', 'Período', 'Parcela', 'Valor', 'Vencimento', 'Dias em Atraso', 'Meses de Atraso', 'Mora', 'Valor Atualizado'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.length === 0 && <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma parcela com esse atraso mínimo.</td></tr>}
                {linhasFiltradas.map(l => (
                  <tr key={l.parcelaId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{l.aluno.ra}</td>
                    <td style={{ padding: '8px 14px' }}>{l.aluno.nome}</td>
                    <td style={{ padding: '8px 14px' }}>{l.periodo.ano}/{l.periodo.semestre}</td>
                    <td style={{ padding: '8px 14px' }}>{l.numero}</td>
                    <td style={{ padding: '8px 14px' }}>{money(Number(l.valor))}</td>
                    <td style={{ padding: '8px 14px' }}>{formatarData(l.dataVencimento)}</td>
                    <td style={{ padding: '8px 14px', color: '#dc2626', fontWeight: 600 }}>{l.diasAtraso}</td>
                    <td style={{ padding: '8px 14px', color: '#dc2626', fontWeight: 600 }}>{Math.floor(l.diasAtraso / DIAS_POR_MES)}</td>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{money(l.mora)}</td>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{money(l.valorAtualizado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
