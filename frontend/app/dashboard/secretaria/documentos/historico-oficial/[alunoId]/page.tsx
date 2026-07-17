'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { formatarData } from '@/lib/format';
import { useBranding } from '@/lib/branding';

type DisciplinaHist = {
  nome: string; codigo: string; professor: string; titulacao: string | null;
  creditos: number; cargaHoraria: number;
  mediaFinal: string | number | null; situacao: string | null;
  isDependencia: boolean; statusMatricula: string;
};
type PeriodoHist = {
  periodoLetivoId: string; ano: number; semestre: string;
  disciplinas: DisciplinaHist[]; totalCreditos: number; totalCh: number;
};
type Integralizacao = { chIntegralizada: number; chTotalCurso: number; percentual: number; disciplinasIntegralizadas: number };
type HistoricoOficialData = {
  aluno: {
    id: string; ra: string; nome: string; cpf: string; dataNascimento: string;
    sexo: string; nacionalidade: string; formaIngresso: string; dataIngresso: string; situacaoVinculo: string;
  };
  curso: { nome: string; grau: string; modalidade: string; codigoEmec: string; cargaHorariaTotal: number };
  matriz: { versao: string; anoVigencia: number } | null;
  periodos: PeriodoHist[];
  cr: number;
  integralizacao: Integralizacao;
  geradoEm: string;
};

const SEXO_LABEL: Record<string, string> = { MASCULINO: 'Masculino', FEMININO: 'Feminino', NAO_DECLARADO: 'Não declarado' };
const GRAU_LABEL: Record<string, string> = { BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo', ESPECIALIZACAO: 'Especialização', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado', POS_DOUTORADO: 'Pós-Doutorado' };
const MODALIDADE_LABEL: Record<string, string> = { PRESENCIAL: 'Presencial', EAD: 'EAD', SEMIPRESENCIAL: 'Semipresencial' };
const INGRESSO_LABEL: Record<string, string> = {
  VESTIBULAR: 'Vestibular', ENEM: 'ENEM', TRANSFERENCIA_EXTERNA: 'Transferência externa',
  TRANSFERENCIA_INTERNA: 'Transferência interna', PORTADOR_DIPLOMA: 'Portador de diploma',
  CONVENIO: 'Convênio', OUTRO: 'Outro',
};
const VINCULO_LABEL: Record<string, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado',
  EVADIDO: 'Evadido', TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
};
const TITULACAO_LABEL: Record<string, string> = {
  GRADUADO: 'Graduado', ESPECIALISTA: 'Especializado', MESTRE: 'Mestrado', DOUTOR: 'Doutorado', POS_DOUTOR: 'Pós-doutorado',
};
const SITUACAO_LABEL: Record<string, string> = {
  APROVADO: 'Aprovado por Média', PENDENTE_EXAME: 'Aprovado em Prova Final',
  REPROVADO_NOTA: 'Reprovado por Nota', REPROVADO_FALTA: 'Reprovado por Falta',
};
const STATUS_LABEL: Record<string, string> = {
  MATRICULADO: 'Cursando', DEPENDENCIA: 'Dependência (DP)', TRANCADO: 'Trancado', CANCELADO: 'Cancelado',
};

function fmtData(iso: string) {
  return formatarData(iso);
}

export default function HistoricoOficialPage() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<HistoricoOficialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    apiFetch<HistoricoOficialData>(`/documentos/historico-oficial/${alunoId}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Aluno não encontrado'))
      .finally(() => setLoading(false));
  }, [alunoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  const hoje = new Date();
  const dataExtenso = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Barra de ação (não imprime) */}
      <div className="no-print" style={{ margin: '16px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => window.print()}
          style={{ padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          🖨️ Imprimir / Salvar PDF
        </button>
        <button onClick={() => window.history.back()}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          ← Voltar
        </button>
      </div>

      {/* Documento */}
      <div id="documento" style={{ background: '#fff', maxWidth: 860, margin: '0 auto', padding: '48px 56px', fontFamily: 'Times New Roman, serif', fontSize: 12.5, lineHeight: 1.6, color: '#000' }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: '2px solid #000', paddingBottom: 16 }}>
          {logoUrl && (
            <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 48, maxWidth: 220, objectFit: 'contain', margin: '0 auto 10px' }} />
          )}
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>{branding.nomeCompleto}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Credenciada pelo MEC | Secretaria Acadêmica</div>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, textDecoration: 'underline', textTransform: 'uppercase' }}>
            Histórico Escolar
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#6b7280' }}>Emissão: {fmtData(data.geradoEm)}</div>
        </div>

        {/* Dados do aluno */}
        <table style={{ width: '100%', marginBottom: 10, fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0', width: 90 }}><strong>Matrícula:</strong></td>
              <td style={{ padding: '2px 0' }}>{data.aluno.ra}</td>
              <td style={{ padding: '2px 0', width: 90 }}><strong>Nome:</strong></td>
              <td style={{ padding: '2px 0' }}>{data.aluno.nome}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>Nascimento:</strong></td>
              <td style={{ padding: '2px 0' }}>{fmtData(data.aluno.dataNascimento)}</td>
              <td style={{ padding: '2px 0' }}><strong>Sexo:</strong></td>
              <td style={{ padding: '2px 0' }}>{SEXO_LABEL[data.aluno.sexo] ?? data.aluno.sexo}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>Nacionalidade:</strong></td>
              <td style={{ padding: '2px 0' }}>{data.aluno.nacionalidade}</td>
              <td style={{ padding: '2px 0' }}><strong>C.P.F.:</strong></td>
              <td style={{ padding: '2px 0' }}>{data.aluno.cpf}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>Ingresso:</strong></td>
              <td style={{ padding: '2px 0' }}>{INGRESSO_LABEL[data.aluno.formaIngresso] ?? data.aluno.formaIngresso} em {fmtData(data.aluno.dataIngresso)}</td>
              <td style={{ padding: '2px 0' }}><strong>Situação:</strong></td>
              <td style={{ padding: '2px 0' }}>{VINCULO_LABEL[data.aluno.situacaoVinculo] ?? data.aluno.situacaoVinculo}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, padding: '8px 12px', marginBottom: 20, fontSize: 12 }}>
          <strong>{data.curso.nome}</strong> — {GRAU_LABEL[data.curso.grau] ?? data.curso.grau} · {MODALIDADE_LABEL[data.curso.modalidade] ?? data.curso.modalidade}
          {' · '}e-MEC {data.curso.codigoEmec} · CH total do curso: {data.curso.cargaHorariaTotal}h
          {data.matriz && <> · Matriz {data.matriz.versao} ({data.matriz.anoVigencia})</>}
        </div>

        {data.periodos.length === 0 ? (
          <p style={{ color: '#6b7280', margin: '24px 0' }}>Nenhuma matrícula registrada.</p>
        ) : data.periodos.map((p, idx) => (
          <div key={p.periodoLetivoId} style={{ marginBottom: 18, breakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 12.5 }}>Ano/Semestre: {p.ano}/{p.semestre === 'S1' ? 1 : 2}</span>
              <span style={{ fontSize: 12 }}>Período: {idx + 1}º</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'left' }}>Descrição Disciplina</th>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'left' }}>Professor</th>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'left', width: 90 }}>Titulação</th>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'center', width: 40 }}>Créd.</th>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'center', width: 40 }}>CH</th>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'center', width: 55 }}>Média Final</th>
                  <th style={{ padding: '5px 7px', border: '1px solid #d1d5db', textAlign: 'left', width: 130 }}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {p.disciplinas.map((d, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db' }}>
                      {d.nome}{d.isDependencia && <span style={{ color: '#7c3aed', fontWeight: 600 }}> (DP)</span>}
                    </td>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db' }}>{d.professor}</td>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db' }}>{d.titulacao ? (TITULACAO_LABEL[d.titulacao] ?? d.titulacao) : '—'}</td>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.creditos}</td>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.cargaHoraria}</td>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      {d.mediaFinal !== null ? Number(d.mediaFinal).toFixed(2) : '—'}
                    </td>
                    <td style={{ padding: '4px 7px', border: '1px solid #d1d5db' }}>
                      {d.situacao ? (SITUACAO_LABEL[d.situacao] ?? d.situacao) : (STATUS_LABEL[d.statusMatricula] ?? 'Em andamento')}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                  <td style={{ padding: '4px 7px', border: '1px solid #d1d5db' }} colSpan={3}>Totais período/ano:</td>
                  <td style={{ padding: '4px 7px', border: '1px solid #d1d5db', textAlign: 'center' }}>{p.totalCreditos}</td>
                  <td style={{ padding: '4px 7px', border: '1px solid #d1d5db', textAlign: 'center' }}>{p.totalCh}</td>
                  <td style={{ padding: '4px 7px', border: '1px solid #d1d5db' }} colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Resumo: Média Global (CR) + Integralização */}
        <div style={{ marginTop: 24, marginBottom: 24, borderTop: '2px solid #000', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Média Global (CR) ===&gt; {data.cr > 0 ? data.cr.toFixed(2) : '—'}</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <strong>Integralização do curso:</strong> {data.integralizacao.percentual}%
              {' '}({data.integralizacao.chIntegralizada}h / {data.integralizacao.chTotalCurso}h — {data.integralizacao.disciplinasIntegralizadas} disciplina{data.integralizacao.disciplinasIntegralizadas !== 1 ? 's' : ''} aprovada{data.integralizacao.disciplinasIntegralizadas !== 1 ? 's' : ''})
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#6b7280', marginTop: 8, lineHeight: 1.4 }}>
            Média Global (CR): média das disciplinas aprovadas ponderada por créditos, excluídas as cursadas em
            dependência (DP). Integralização: carga horária das disciplinas distintas já aprovadas (inclusive via
            DP) sobre a carga horária total exigida pelo curso. Ambos os valores são calculados a partir do
            histórico de matrículas no momento da emissão deste documento.
          </p>
        </div>

        {/* Rodapé */}
        <div style={{ textAlign: 'right', marginBottom: 48 }}>
          Rio de Janeiro, {dataExtenso}.
        </div>

        <div className="assinatura" style={{ display: 'flex', justifyContent: 'space-around', marginTop: 48 }}>
          <div style={{ textAlign: 'center', width: 220 }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8, fontSize: 12 }}>
              Secretaria Acadêmica<br />{branding.nomeInstituicao}
            </div>
          </div>
        </div>

        <div className="assinatura" style={{ marginTop: 48, fontSize: 10, color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          Documento gerado eletronicamente em {new Date(data.geradoEm).toLocaleString('pt-BR')} pela plataforma acadêmica {branding.nomeInstituicao}.
          Este documento não dispensa a assinatura/autenticação exigida para fins de registro oficial.
        </div>
      </div>

      <style>{`
        @page {
          size: A4;
          margin: 15mm 14mm;
        }
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          #documento {
            display: block !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          #documento table { border-collapse: collapse; }
          #documento thead { display: table-header-group; }
          #documento tfoot { display: table-footer-group; }
          #documento tr { break-inside: avoid; page-break-inside: avoid; }
          #documento .assinatura { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
