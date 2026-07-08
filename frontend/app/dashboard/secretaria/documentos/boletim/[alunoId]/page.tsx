'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

type PeriodoRef = { id: string; ano: number; semestre: string };
type DisciplinaBoletim = {
  disciplina: string;
  codigo: string;
  cargaHoraria: number;
  creditos: number;
  professor: string;
  isDependencia: boolean;
  statusMatricula: string;
  mediaFinal: string | number | null;
  faltas: number | null;
  frequenciaPercentual: string | number | null;
  situacaoResultado: string | null;
};
type BoletimData = {
  aluno: { id: string; nome: string; ra: string; cpf: string };
  curso: { nome: string; grau: string };
  periodo: PeriodoRef | null;
  periodosDisponiveis: PeriodoRef[];
  disciplinas: DisciplinaBoletim[];
  geradoEm: string;
};

const SEMESTRE: Record<string, string> = { S1: '1º semestre', S2: '2º semestre' };
const SITUACAO_LABEL: Record<string, string> = {
  APROVADO: 'Aprovado',
  REPROVADO_NOTA: 'Reprovado por nota',
  REPROVADO_FALTA: 'Reprovado por falta',
  REPROVADO_NOTA_E_FALTA: 'Reprovado por nota e falta',
};
const STATUS_LABEL: Record<string, string> = {
  MATRICULADO: 'Cursando',
  PENDENTE_EXAME: 'Pendente de exame final',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  DEPENDENCIA: 'Dependência (DP)',
  TRANCADO: 'Trancado',
  CANCELADO: 'Cancelado',
};

export default function BoletimPage() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<BoletimData | null>(null);
  const [periodoId, setPeriodoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((periodo?: string) => {
    setLoading(true);
    setError('');
    const qs = periodo ? `?periodoLetivoId=${periodo}` : '';
    apiFetch<BoletimData>(`/documentos/boletim/${alunoId}${qs}`)
      .then(d => {
        setData(d);
        if (d.periodo) setPeriodoId(d.periodo.id);
      })
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
        {data.periodosDisponiveis.length > 1 && (
          <select
            value={periodoId}
            onChange={e => { setPeriodoId(e.target.value); load(e.target.value); }}
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, marginLeft: 8 }}>
            {data.periodosDisponiveis.map(p => (
              <option key={p.id} value={p.id}>{p.ano}/{p.semestre === 'S1' ? 1 : 2}</option>
            ))}
          </select>
        )}
      </div>

      {/* Documento */}
      <div id="documento" style={{ background: '#fff', maxWidth: 760, margin: '0 auto', padding: '48px 56px', fontFamily: 'Times New Roman, serif', fontSize: 13, lineHeight: 1.7, color: '#000' }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #000', paddingBottom: 16 }}>
          {logoUrl && (
            <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 48, maxWidth: 220, objectFit: 'contain', margin: '0 auto 10px' }} />
          )}
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>{branding.nomeCompleto}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Credenciada pelo MEC | Secretaria Acadêmica</div>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, textDecoration: 'underline', textTransform: 'uppercase' }}>
            Boletim Escolar
          </div>
          {data.periodo && (
            <div style={{ fontSize: 12.5, marginTop: 4 }}>
              {SEMESTRE[data.periodo.semestre] ?? data.periodo.semestre} de {data.periodo.ano}
            </div>
          )}
        </div>

        {/* Dados do aluno */}
        <table style={{ width: '100%', marginBottom: 24, fontSize: 12.5 }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0', width: 90 }}><strong>Aluno:</strong></td>
              <td style={{ padding: '2px 0' }}>{data.aluno.nome}</td>
              <td style={{ padding: '2px 0', width: 40 }}><strong>RA:</strong></td>
              <td style={{ padding: '2px 0', width: 100 }}>{data.aluno.ra}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>CPF:</strong></td>
              <td style={{ padding: '2px 0' }}>{data.aluno.cpf}</td>
              <td style={{ padding: '2px 0' }} colSpan={2}></td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>Curso:</strong></td>
              <td style={{ padding: '2px 0' }} colSpan={3}>{data.curso.nome}</td>
            </tr>
          </tbody>
        </table>

        {data.disciplinas.length === 0 ? (
          <p style={{ color: '#6b7280', margin: '24px 0' }}>Nenhuma matrícula encontrada neste período letivo.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Disciplina</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 60 }}>C.H.</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 50 }}>Média</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 50 }}>Faltas</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 55 }}>Freq. %</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: 110 }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {data.disciplinas.map((d, i) => (
                <tr key={i}>
                  <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>
                    {d.disciplina}{d.isDependencia && <span style={{ color: '#b91c1c' }}> (DP)</span>}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.cargaHoraria}h</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                    {d.mediaFinal !== null ? Number(d.mediaFinal).toFixed(1) : '-'}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                    {d.faltas ?? '-'}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                    {d.frequenciaPercentual !== null ? `${Number(d.frequenciaPercentual).toFixed(0)}%` : '-'}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                    {d.situacaoResultado ? (SITUACAO_LABEL[d.situacaoResultado] ?? d.situacaoResultado)
                      : (STATUS_LABEL[d.statusMatricula] ?? d.statusMatricula)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{ fontSize: 10.5, color: '#6b7280', marginBottom: 32 }}>
          Nota mínima de aprovação: 6,0. Frequência mínima exigida: 75%.
        </p>

        {/* Rodapé */}
        <div style={{ textAlign: 'right', marginBottom: 48 }}>
          Rio de Janeiro, {dataExtenso}.
        </div>

        <div className="assinatura" style={{ display: 'flex', justifyContent: 'space-around', marginTop: 48 }}>
          <div style={{ textAlign: 'center', width: 200 }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8, fontSize: 12 }}>
              Secretaria Acadêmica<br />{branding.nomeInstituicao}
            </div>
          </div>
        </div>

        <div className="assinatura" style={{ marginTop: 48, fontSize: 10, color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          Documento gerado eletronicamente em {new Date(data.geradoEm).toLocaleString('pt-BR')} pela plataforma acadêmica {branding.nomeInstituicao}.
          Este documento não dispensa a assinatura manual quando exigido.
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
            print-color-adjust: