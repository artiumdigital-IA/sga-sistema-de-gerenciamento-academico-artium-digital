'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { HBarChart, StackedHBar, LineTrendChart, CATEGORICAL_VARS } from '@/components/dashboard/MiniCharts';

interface Dashboard {
  alunos: { total: number; porSituacao: { situacao: string; quantidade: number }[]; novosUltimaSemana: number };
  cursos: { total: number; lista: { id: string; nome: string; status: string; alunos: number }[] };
  turmas: { totalOfertas: number; periodoAtual: string | null };
  inadimplentes: { totalParcelas: number; totalAlunos: number; valorTotalEmAtraso: number; valorTotalMora: number };
  acordos: { total: number; porStatus: Record<string, number>; valorTotal: number; valorPago: number };
  contratos: { total: number; valorTotal: number; valorPago: number; valorPendente: number };
  inadimplenciaPorMes: { mes: string; valor: number; quantidade: number }[];
  ofertasPorPeriodo: { periodo: string; ano: number; semestre: string; quantidade: number }[];
}

const SITUACAO_LABEL: Record<string, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado', EVADIDO: 'Evadido',
  TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
};
// Ordem fixa (não vem do backend) — nunca ciclada, casa com a ordem dos slots categóricos.
const SITUACAO_ORDEM = ['CURSANDO', 'TRANCADO', 'FORMADO', 'EVADIDO', 'TRANSFERIDO_OUT', 'FALECIDO'];
const ACORDO_STATUS_LABEL: Record<string, string> = { ATIVO: 'Ativo', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
const ACORDO_STATUS_ORDEM = ['ATIVO', 'CONCLUIDO', 'CANCELADO'];

const MES_LABEL = (chave: string) => {
  const [ano, mes] = chave.split('-');
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
};

const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 };
const CARD_WIDE: React.CSSProperties = { ...CARD, gridColumn: '1 / -1' };
const TITULO_CARD: React.CSSProperties = { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: 0.5 };
const NUMERO_GRANDE: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: 'var(--gray-700)', lineHeight: 1 };
const LINHA: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--gray-500)' };

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function RelatoriosMasterDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await apiFetch<Dashboard>('/relatorios-master/dashboard')); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar métricas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const situacaoOrdenada = data
    ? SITUACAO_ORDEM.map(s => data.alunos.porSituacao.find(x => x.situacao === s)).filter((x): x is { situacao: string; quantidade: number } => !!x && x.quantidade > 0)
    : [];
  const acordosOrdenados = data
    ? ACORDO_STATUS_ORDEM.filter(s => (data.acordos.porStatus[s] ?? 0) > 0).map(s => ({ situacao: s, quantidade: data.acordos.porStatus[s] }))
    : [];
  const cursosOrdenados = data ? [...data.cursos.lista].sort((a, b) => b.alunos - a.alunos).slice(0, 12) : [];

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Relatórios Master</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Dashboards com métricas de alunos, turmas, cursos, inadimplentes, acordos e contratos.</p>
        </div>
        <button onClick={carregar} disabled={loading}
          style={{ padding: '7px 16px', borderRadius: 5, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-700)', cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Atualizando...' : '↻ Atualizar'}
        </button>
      </div>

      {loading && !data && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={CARD}>
            <h3 style={TITULO_CARD}>Alunos</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <div style={NUMERO_GRANDE}>{data.alunos.total.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                <strong style={{ color: 'var(--gray-700)', fontSize: 15 }}>+{data.alunos.novosUltimaSemana}</strong> novo(s) na última semana
              </div>
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
              <HBarChart
                data={situacaoOrdenada.map(s => ({ label: SITUACAO_LABEL[s.situacao] ?? s.situacao, value: s.quantidade }))}
                palette={CATEGORICAL_VARS}
              />
            </div>
          </div>

          <div style={CARD}>
            <h3 style={TITULO_CARD}>Turmas (Ofertas)</h3>
            <div style={NUMERO_GRANDE}>{data.turmas.totalOfertas.toLocaleString('pt-BR')}</div>
            <div style={{ marginTop: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 8 }}>
              <div style={LINHA}><span>Período em andamento</span><strong>{data.turmas.periodoAtual ?? '—'}</strong></div>
            </div>
            {data.ofertasPorPeriodo.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--gray-400)' }}>Ofertas por período letivo (cronológico)</p>
                <HBarChart data={data.ofertasPorPeriodo.map(o => ({ label: o.periodo, value: o.quantidade }))} />
              </div>
            )}
          </div>

          <div style={CARD}>
            <h3 style={TITULO_CARD}>Cursos</h3>
            <div style={NUMERO_GRANDE}>{data.cursos.total.toLocaleString('pt-BR')}</div>
            <div style={{ marginTop: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 10, maxHeight: 260, overflowY: 'auto' }}>
              <HBarChart data={cursosOrdenados.map(c => ({ label: c.nome, value: c.alunos }))} />
            </div>
          </div>

          <div style={{ ...CARD, borderColor: data.inadimplentes.totalParcelas > 0 ? '#fecaca' : 'var(--gray-200)', background: data.inadimplentes.totalParcelas > 0 ? '#fef2f2' : 'var(--white)' }}>
            <h3 style={TITULO_CARD}>Inadimplentes</h3>
            <div style={{ ...NUMERO_GRANDE, color: data.inadimplentes.totalParcelas > 0 ? '#dc2626' : 'var(--gray-700)' }}>{data.inadimplentes.totalAlunos.toLocaleString('pt-BR')}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>aluno(s) com parcela em atraso</div>
            <div style={{ marginTop: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 8 }}>
              <div style={LINHA}><span>Parcelas em atraso</span><strong>{data.inadimplentes.totalParcelas}</strong></div>
              <div style={LINHA}><span>Valor em atraso</span><strong>{money(data.inadimplentes.valorTotalEmAtraso)}</strong></div>
              <div style={LINHA}><span>Multa + juros</span><strong>{money(data.inadimplentes.valorTotalMora)}</strong></div>
            </div>
          </div>

          <div style={CARD}>
            <h3 style={TITULO_CARD}>Acordos (CPagar)</h3>
            <div style={NUMERO_GRANDE}>{data.acordos.total.toLocaleString('pt-BR')}</div>
            <div style={{ marginTop: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
              <HBarChart
                data={acordosOrdenados.map(s => ({ label: ACORDO_STATUS_LABEL[s.situacao] ?? s.situacao, value: s.quantidade }))}
                palette={CATEGORICAL_VARS}
              />
            </div>
            <div style={{ marginTop: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 8 }}>
              <div style={LINHA}><span>Valor total</span><strong>{money(data.acordos.valorTotal)}</strong></div>
              <div style={LINHA}><span>Valor pago</span><strong>{money(data.acordos.valorPago)}</strong></div>
            </div>
          </div>

          <div style={CARD}>
            <h3 style={TITULO_CARD}>Contratos</h3>
            <div style={NUMERO_GRANDE}>{data.contratos.total.toLocaleString('pt-BR')}</div>
            <div style={{ marginTop: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
              <StackedHBar
                segments={[
                  { label: 'Pago', value: data.contratos.valorPago, colorVar: CATEGORICAL_VARS[0] },
                  { label: 'Pendente', value: data.contratos.valorPendente, colorVar: CATEGORICAL_VARS[1] },
                ]}
                formatValue={money}
              />
            </div>
            <div style={{ marginTop: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 8 }}>
              <div style={LINHA}><span>Valor total</span><strong>{money(data.contratos.valorTotal)}</strong></div>
            </div>
          </div>

          <div style={CARD_WIDE}>
            <h3 style={TITULO_CARD}>Inadimplência por mês de vencimento (últimos 12 meses)</h3>
            <LineTrendChart
              data={data.inadimplenciaPorMes.map(m => ({ label: MES_LABEL(m.mes), value: m.valor }))}
              formatValue={money}
              width={900}
            />
          </div>
        </div>
      )}
    </div>
  );
}
