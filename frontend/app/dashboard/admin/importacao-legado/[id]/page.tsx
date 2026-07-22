'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiDownload } from '@/lib/api';

interface PeriodoNecessario {
  ano: number;
  semestre: string;
  existeJa: boolean;
  alunosDistintos: number;
  parcelas: number;
  valorTotal: number;
}
interface Resumo {
  porStatus: Record<string, number>;
  contratosPropostos: number;
  alunosDistintosProntaCpf: number;
  valorTotalProntaCpf: number;
  periodosNecessarios: PeriodoNecessario[];
}
interface Lote {
  id: string;
  arquivoNome: string;
  status: 'PROCESSANDO' | 'CONCLUIDA' | 'ERRO';
  totalLinhasArquivo: number;
  totalLinhasDetalhe: number;
  linhasIgnoradasResumo: number;
  resumo: Resumo | null;
  iniciadoEm: string;
  concluidoEm: string | null;
  erro: string | null;
  usuario: { nome: string | null; email: string };
}
interface Linha {
  id: string;
  numeroLinha: number;
  status: string;
  dadosOriginais: Record<string, unknown>;
  alunoEncontradoId: string | null;
  alunoSugeridoId: string | null;
  scoreSugestao: number | null;
  anoInferido: number | null;
  semestreInferido: string | null;
  motivoPendencia: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  PRONTA_CPF: 'Pronta (CPF bateu)',
  SUGESTAO_NOME: 'Sugestão por nome',
  SEM_CORRESPONDENCIA: 'Sem correspondência',
  DADO_INVALIDO: 'Dado inválido',
};
const STATUS_COR: Record<string, string> = {
  PRONTA_CPF: '#16a34a',
  SUGESTAO_NOME: '#d97706',
  SEM_CORRESPONDENCIA: '#6b7280',
  DADO_INVALIDO: '#dc2626',
};

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 };
const TAMANHO_PAGINA = 50;

export default function ImportacaoLegadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [totalLinhas, setTotalLinhas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [carregandoLinhas, setCarregandoLinhas] = useState(false);

  const carregarLote = useCallback(() => {
    apiFetch<Lote>(`/migration/importacao-legado/${id}`)
      .then(setLote)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => { carregarLote(); }, [carregarLote]);

  // Enquanto o lote está processando, esta página se atualiza sozinha —
  // mesmo padrão de polling já usado no Painel do Sistema.
  useEffect(() => {
    if (lote?.status !== 'PROCESSANDO') return;
    const t = setInterval(carregarLote, 4000);
    return () => clearInterval(t);
  }, [lote?.status, carregarLote]);

  const carregarLinhas = useCallback(() => {
    if (!lote || lote.status !== 'CONCLUIDA') return;
    setCarregandoLinhas(true);
    const qs = new URLSearchParams({ page: String(pagina), pageSize: String(TAMANHO_PAGINA) });
    if (filtroStatus) qs.set('status', filtroStatus);
    apiFetch<{ total: number; linhas: Linha[] }>(`/migration/importacao-legado/${id}/linhas?${qs.toString()}`)
      .then((r) => { setLinhas(r.linhas); setTotalLinhas(r.total); })
      .catch(() => {})
      .finally(() => setCarregandoLinhas(false));
  }, [id, lote, filtroStatus, pagina]);

  useEffect(() => { carregarLinhas(); }, [carregarLinhas]);
  useEffect(() => { setPagina(1); }, [filtroStatus]);

  function exportarCsv() {
    const qs = filtroStatus ? `?status=${filtroStatus}` : '';
    apiDownload(
      `/migration/importacao-legado/${id}/export${qs}`,
      `importacao-legado-${id}${filtroStatus ? '-' + filtroStatus : ''}.csv`,
    ).catch(() => {});
  }

  if (carregando) return <div style={{ padding: 28, color: 'var(--gray-500)' }}>Carregando…</div>;
  if (!lote) return <div style={{ padding: 28, color: 'var(--accent-red-text)' }}>Lote não encontrado.</div>;

  const resumo = lote.resumo;
  const totalPaginas = Math.max(1, Math.ceil(totalLinhas / TAMANHO_PAGINA));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--gray-700)' }}>{lote.arquivoNome}</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Enviado por {lote.usuario.nome || lote.usuario.email} em {new Date(lote.iniciadoEm).toLocaleString('pt-BR')}
        </p>
      </div>

      {lote.status === 'PROCESSANDO' && (
        <div style={{ ...CARD, marginBottom: 16, color: '#d97706', fontWeight: 600 }}>
          Processando… esta página atualiza sozinha a cada alguns segundos.
        </div>
      )}
      {lote.status === 'ERRO' && (
        <div style={{ ...CARD, marginBottom: 16, color: 'var(--accent-red-text)' }}>
          <strong>Erro ao processar:</strong> {lote.erro}
        </div>
      )}

      {resumo && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
            <div style={CARD}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Linhas no arquivo</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-700)' }}>{lote.totalLinhasArquivo.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{lote.linhasIgnoradasResumo.toLocaleString('pt-BR')} ignoradas (tabela de resumo do arquivo)</div>
            </div>
            {(['PRONTA_CPF', 'SUGESTAO_NOME', 'SEM_CORRESPONDENCIA', 'DADO_INVALIDO'] as const).map((s) => (
              <div key={s} style={CARD}>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{STATUS_LABEL[s]}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: STATUS_COR[s] }}>{(resumo.porStatus[s] ?? 0).toLocaleString('pt-BR')}</div>
              </div>
            ))}
            <div style={CARD}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Contratos propostos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-700)' }}>{resumo.contratosPropostos.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{resumo.alunosDistintosProntaCpf} alunos distintos</div>
            </div>
            <div style={CARD}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Valor total (prontas por CPF)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-700)' }}>{fmtMoeda(resumo.valorTotalProntaCpf)}</div>
            </div>
          </div>

          {resumo.periodosNecessarios.length > 0 && (
            <div style={{ ...CARD, marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>
                Períodos letivos envolvidos — num commit futuro, os marcados "seria criado" ainda não existem hoje
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      {['Período', 'Situação', 'Alunos', 'Parcelas', 'Valor'].map((h) => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.periodosNecessarios.map((p) => (
                      <tr key={`${p.ano}-${p.semestre}`} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '6px 10px' }}>{p.ano}/{p.semestre}</td>
                        <td style={{ padding: '6px 10px' }}>
                          {p.existeJa
                            ? <span style={{ color: '#16a34a' }}>já existe</span>
                            : <span style={{ color: '#d97706', fontWeight: 600 }}>seria criado</span>}
                        </td>
                        <td style={{ padding: '6px 10px' }}>{p.alunosDistintos}</td>
                        <td style={{ padding: '6px 10px' }}>{p.parcelas}</td>
                        <td style={{ padding: '6px 10px' }}>{fmtMoeda(p.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>Linhas ({totalLinhas.toLocaleString('pt-BR')})</h2>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  style={{ padding: '5px 8px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--gray-700)' }}
                >
                  <option value="">Todos os status</option>
                  {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <button
                  onClick={exportarCsv}
                  style={{ padding: '5px 10px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 4, background: 'transparent', cursor: 'pointer', color: 'var(--gray-700)' }}
                >
                  ↓ Exportar CSV
                </button>
              </div>
            </div>

            {carregandoLinhas && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Carregando linhas…</p>}
            {!carregandoLinhas && linhas.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Nenhuma linha nesse filtro.</p>}
            {linhas.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      {['Linha', 'Status', 'Código Aluno', 'Nome', 'CPF', 'Vencimento', 'Valor', 'Motivo'].map((h) => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 11.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '6px 8px' }}>{l.numeroLinha}</td>
                        <td style={{ padding: '6px 8px', color: STATUS_COR[l.status] ?? 'var(--gray-700)', fontWeight: 600, whiteSpace: 'nowrap' }}>{STATUS_LABEL[l.status] ?? l.status}</td>
                        <td style={{ padding: '6px 8px' }}>{String(l.dadosOriginais.aluno ?? '—')}</td>
                        <td style={{ padding: '6px 8px' }}>{String(l.dadosOriginais.nome ?? '—')}</td>
                        <td style={{ padding: '6px 8px' }}>{String(l.dadosOriginais.cpf ?? '—')}</td>
                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{String(l.dadosOriginais.dataVencimento ?? '—')}</td>
                        <td style={{ padding: '6px 8px' }}>{String(l.dadosOriginais.valorDeFace ?? '—')}</td>
                        <td style={{ padding: '6px 8px', maxWidth: 320, color: 'var(--gray-500)' }}>{l.motivoPendencia ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, alignItems: 'center', fontSize: 12.5 }}>
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  style={{ padding: '4px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'transparent', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', color: 'var(--gray-700)' }}
                >
                  ← Anterior
                </button>
                <span style={{ color: 'var(--gray-500)' }}>Página {pagina} de {totalPaginas}</span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas}
                  style={{ padding: '4px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'transparent', cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer', color: 'var(--gray-700)' }}
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
