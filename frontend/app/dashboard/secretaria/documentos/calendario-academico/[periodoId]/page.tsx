'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

type EventoCalendario = {
  id: string;
  grupo: string | null;
  titulo: string;
  dataInicio: string;
  dataFim: string | null;
  observacoes: string | null;
  ordem: number;
};

type CalendarioAcademicoData = {
  periodo: {
    id: string;
    ano: number;
    semestre: 'S1' | 'S2';
    dataInicio: string;
    dataFim: string;
    status: string;
    semanasLetivas: number | null;
    diasLetivos: number | null;
  };
  eventos: EventoCalendario[];
  geradoEm: string;
};

const STATUS_LABEL: Record<string, string> = {
  PLANEJADO: 'Planejado', EM_ANDAMENTO: 'Em andamento', ENCERRADO: 'Encerrado',
};

function fmtData(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function fmtIntervalo(inicio: string, fim: string | null) {
  const i = fmtData(inicio);
  const f = fmtData(fim);
  if (!f || f === i) return i;
  return `${i} a ${f}`;
}

export default function CalendarioAcademicoDocumentoPage() {
  const { periodoId } = useParams<{ periodoId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<CalendarioAcademicoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    apiFetch<CalendarioAcademicoData>(`/documentos/calendario-academico/${periodoId}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Período não encontrado'))
      .finally(() => setLoading(false));
  }, [periodoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  const hoje = new Date();
  const dataExtenso = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const { periodo, eventos } = data;

  let ultimoGrupo: string | null = null;

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
            Calendário Acadêmico {periodo.ano}/{periodo.semestre === 'S1' ? '1' : '2'}
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#6b7280' }}>Emissão: {fmtData(data.geradoEm) ?? new Date(data.geradoEm).toLocaleDateString('pt-BR')}</div>
        </div>

        {/* Faixa de dados do período */}
        <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, padding: '8px 12px', marginBottom: 20, fontSize: 12 }}>
          <strong>Período letivo:</strong> {periodo.ano}/{periodo.semestre === 'S1' ? '1' : '2'}
          {' · '}{fmtIntervalo(periodo.dataInicio, periodo.dataFim)}
          {' · '}Situação: {STATUS_LABEL[periodo.status] ?? periodo.status}
          {(periodo.semanasLetivas || periodo.diasLetivos) && (
            <>
              {' · '}
              {periodo.semanasLetivas ? `${periodo.semanasLetivas} semanas letivas` : ''}
              {periodo.semanasLetivas && periodo.diasLetivos ? ' e ' : ''}
              {periodo.diasLetivos ? `${periodo.diasLetivos} dias letivos` : ''}
            </>
          )}
        </div>

        {eventos.length === 0 ? (
          <p style={{ color: '#6b7280', margin: '24px 0' }}>Nenhum item cadastrado para este período.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'left', width: '34%' }}>Etapa</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Período</th>
                <th style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e, i) => {
                const mostraGrupo = e.grupo !== ultimoGrupo;
                ultimoGrupo = e.grupo;
                return (
                  <tr key={e.id} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>
                      {e.grupo && mostraGrupo && (
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{e.grupo}</div>
                      )}
                      <span style={{ paddingLeft: e.grupo ? 12 : 0, fontWeight: e.grupo ? 400 : 700 }}>{e.titulo}</span>
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>{fmtIntervalo(e.dataInicio, e.dataFim)}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', color: '#4b5563' }}>{e.observacoes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Rodapé */}
        <div style={{ textAlign: 'right', marginTop: 40, marginBottom: 48 }}>
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
          body > * { display: none; }
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
