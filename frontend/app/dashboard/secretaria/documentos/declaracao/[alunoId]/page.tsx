'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

type DeclaracaoData = {
  aluno: { id: string; nome: string; ra: string; cpf: string; email: string; situacaoVinculo: string; dataIngresso: string };
  curso: { nome: string; grau: string; modalidade: string; cargaHorariaTotal: number };
  periodoAtual: { ano: number; semestre: string } | null;
  disciplinasMatriculadas: { disciplina: string; cargaHoraria: number; turno: string }[];
  geradoEm: string;
};

const GRAU: Record<string, string> = { BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo' };
const TURNO: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral' };
const SEMESTRE: Record<string, string> = { S1: '1º semestre', S2: '2º semestre' };

export default function DeclaracaoPage() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<DeclaracaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<DeclaracaoData>(`/documentos/declaracao-matricula/${alunoId}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Aluno não encontrado'))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  const hoje = new Date();
  const dataExtenso = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Barra de ação (não imprime) */}
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
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
      <div id="documento" style={{ background: '#fff', maxWidth: 720, margin: '0 auto', padding: '48px 56px', fontFamily: 'Times New Roman, serif', fontSize: 13, lineHeight: 1.8, color: '#000' }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #000', paddingBottom: 16 }}>
          {logoUrl && (
            <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 48, maxWidth: 220, objectFit: 'contain', margin: '0 auto 10px' }} />
          )}
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>{branding.nomeCompleto}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Credenciada pelo MEC | Secretaria Acadêmica</div>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, textDecoration: 'underline', textTransform: 'uppercase' }}>
            Declaração de Matrícula
          </div>
        </div>

        {/* Corpo */}
        <p style={{ textAlign: 'justify', marginBottom: 16 }}>
          Declaramos, para os devidos fins, que <strong>{data.aluno.nome}</strong>, portador(a) do CPF nº{' '}
          <strong>{data.aluno.cpf}</strong>, Registro Acadêmico (RA) nº <strong>{data.aluno.ra}</strong>, encontra-se
          regularmente matriculado(a) no curso de{' '}
          <strong>{GRAU[data.curso.grau] ?? data.curso.grau} em {data.curso.nome}</strong>,
          na modalidade <strong>{data.curso.modalidade}</strong>,
          {data.periodoAtual ? (
            <> no <strong>{SEMESTRE[data.periodoAtual.semestre] ?? data.periodoAtual.semestre}</strong> de <strong>{data.periodoAtual.ano}</strong>,</>
          ) : <> no período letivo vigente,</>}
          com carga horária total do curso de <strong>{data.curso.cargaHorariaTotal} horas</strong>.
        </p>

        {data.disciplinasMatriculadas.length > 0 && (
          <>
            <p style={{ marginBottom: 8 }}>O(A) discente está matriculado(a) nas seguintes disciplinas no período atual:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '6px 10px', border: '1px solid #d1d5db', textAlign: 'left' }}>Disciplina</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #d1d5db', textAlign: 'center', width: 80 }}>C.H.</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #d1d5db', textAlign: 'center', width: 80 }}>Turno</th>
                </tr>
              </thead>
              <tbody>
                {data.disciplinasMatriculadas.map((d, i) => (
                  <tr key={i}>
                    <td style={{ padding: '5px 10px', border: '1px solid #d1d5db' }}>{d.disciplina}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.cargaHoraria}h</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{TURNO[d.turno] ?? d.turno}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p style={{ textAlign: 'justify', marginBottom: 32 }}>
          Por ser expressão da verdade, firmamos a presente declaração.
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
          <div style={{ textAlign: 'center', width: 200 }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8, fontSize: 12 }}>
              Coordenação do Curso<br />{data.curso.nome}
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
