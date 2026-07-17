'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { formatarData } from '@/lib/format';
import { useBranding } from '@/lib/branding';

type Questao = { tipo: 'MULTIPLA_ESCOLHA' | 'DISSERTATIVA'; enunciado: string; valor: number; alternativas?: string[] };
type ProvaGerada = {
  id: string;
  tipoProva: string;
  curso: string;
  disciplina: string;
  turma: string;
  data: string;
  observacoes: string;
  questoes: Questao[];
  criadoEm: string;
  professor: { nome: string };
};

const TIPO_PROVA_LABEL: Record<string, string> = {
  AV1: 'AV1', AV2: 'AV2', AV3: 'AV3', AV4: 'AV4', AV5: 'AV5',
  RECUPERACAO: 'Recuperação', SEGUNDA_CHAMADA: '2ª Chamada',
};

function letra(i: number) {
  return `${String.fromCharCode(97 + i)})`;
}

export default function ProvaGeradaPage() {
  const { id } = useParams<{ id: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<ProvaGerada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<ProvaGerada>(`/provas-geradas/${id}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Prova não encontrada'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  const totalPontos = data.questoes.reduce((s, q) => s + (Number(q.valor) || 0), 0);

  return (
    <>
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

      <div id="documento" style={{ background: '#fff', maxWidth: 760, margin: '0 auto', padding: '48px 56px', fontFamily: 'Times New Roman, serif', fontSize: 13, lineHeight: 1.6, color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 16 }}>
          {logoUrl && (
            <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 48, maxWidth: 220, objectFit: 'contain', margin: '0 auto 10px' }} />
          )}
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>{branding.nomeCompleto}</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, textDecoration: 'underline', textTransform: 'uppercase' }}>
            Avaliação — {TIPO_PROVA_LABEL[data.tipoProva] ?? data.tipoProva}
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: 16, fontSize: 12.5, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 0', width: 100 }}><strong>Prova:</strong></td>
              <td style={{ padding: '3px 0' }}>{TIPO_PROVA_LABEL[data.tipoProva] ?? data.tipoProva}</td>
              <td style={{ padding: '3px 0', width: 50 }}><strong>Data:</strong></td>
              <td style={{ padding: '3px 0' }}>{formatarData(data.data)}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0' }}><strong>Curso:</strong></td>
              <td style={{ padding: '3px 0' }}>{data.curso}</td>
              <td style={{ padding: '3px 0' }}><strong>Turma:</strong></td>
              <td style={{ padding: '3px 0' }}>{data.turma}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0' }}><strong>Disciplina:</strong></td>
              <td style={{ padding: '3px 0' }} colSpan={3}>{data.disciplina}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 0 3px' }}><strong>Aluno:</strong></td>
              <td style={{ padding: '10px 0 3px', borderBottom: '1px solid #000' }} colSpan={3}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div style={{ border: '1px solid #000', padding: '10px 12px', marginBottom: 20, fontSize: 11, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {data.observacoes}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {data.questoes.map((q, i) => (
            <div key={i} className="questao" style={{ breakInside: 'avoid' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
                {i + 1}) <span style={{ fontWeight: 400 }}>({Number(q.valor).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} {Number(q.valor) === 1 ? 'ponto' : 'pontos'})</span>
              </div>
              <div style={{ marginBottom: q.tipo === 'MULTIPLA_ESCOLHA' && q.alternativas?.length ? 8 : 0, whiteSpace: 'pre-wrap' }}>{q.enunciado}</div>
              {q.tipo === 'MULTIPLA_ESCOLHA' && q.alternativas && q.alternativas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 16 }}>
                  {q.alternativas.map((alt, idx) => (
                    <div key={idx}>{letra(idx)} {alt}</div>
                  ))}
                </div>
              )}
              {q.tipo === 'DISSERTATIVA' && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ borderBottom: '1px solid #999', height: 20 }} />
                  <div style={{ borderBottom: '1px solid #999', height: 20 }} />
                  <div style={{ borderBottom: '1px solid #999', height: 20 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#374151', marginTop: 20, textAlign: 'right' }}>
          <strong>Total: {totalPontos.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} pontos</strong>
        </p>

        <div className="assinatura" style={{ marginTop: 40, fontSize: 10.5, color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          Professor(a) responsável: {data.professor.nome} · Documento gerado eletronicamente em {new Date(data.criadoEm).toLocaleString('pt-BR')} pela plataforma acadêmica {branding.nomeInstituicao}.
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
          #documento .questao { break-inside: avoid; page-break-inside: avoid; }
          #documento .assinatura { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
