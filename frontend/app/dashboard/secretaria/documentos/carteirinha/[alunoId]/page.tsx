'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import QrCode from '@/components/QrCode';

type CarteirinhaData = {
  aluno: { id: string; nome: string; ra: string; cpf: string; dataNascimento: string; situacaoVinculo: string; fotoUrl: string | null };
  curso: { nome: string; grau: string };
  validaAte: string;
  codigoValidacao: string;
  geradoEm: string;
};

const GRAU: Record<string, string> = { BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo', ESPECIALIZACAO: 'Especialização', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado', POS_DOUTORADO: 'Pós-Doutorado' };

export default function CarteirinhaPage() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<CarteirinhaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    apiFetch<CarteirinhaData>(`/documentos/carteirinha/${alunoId}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Aluno não encontrado'))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return null;

  const fotoSrc = apiFileUrl(data.aluno.fotoUrl);
  const validaAteCurta = new Date(data.validaAte).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  const validaAteCompleta = new Date(data.validaAte).toLocaleDateString('pt-BR');
  const urlValidacao = origin ? `${origin}/validar-carteirinha?codigo=${data.codigoValidacao}` : '';
  const corPrimaria = branding.corPrimaria || '#1e3a5f';
  const corSecundaria = branding.corSecundaria || '#0f2340';
  const nomeReduzido = branding.nomeCompleto.replace(`${branding.nomeInstituicao} — `, '').replace(`${branding.nomeInstituicao} - `, '');

  return (
    <>
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

      <div id="documento" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, padding: '20px 0' }}>

        {/* ── Frente ─────────────────────────────────────────────── */}
        <div className="carteirinha-face" style={{
          width: 340, height: 214, borderRadius: 14, overflow: 'hidden',
          background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
          color: '#fff', fontFamily: 'Arial, sans-serif', position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,.25)', padding: 16, boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {logoUrl && (
                <img src={logoUrl} alt={branding.nomeInstituicao} style={{ height: 20, maxWidth: 40, objectFit: 'contain' }} />
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5 }}>{branding.nomeInstituicao}</div>
                <div style={{ fontSize: 8, opacity: 0.8, maxWidth: 170 }}>{nomeReduzido}</div>
              </div>
            </div>
            <div style={{ fontSize: 8, textAlign: 'right', opacity: 0.85 }}>
              Carteira de<br />Identificação Estudantil
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 78, borderRadius: 6, background: 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.3)', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {fotoSrc
                ? <img src={fotoSrc} alt={data.aluno.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.6 }}>{data.aluno.nome.charAt(0)}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, marginBottom: 6 }}>{data.aluno.nome}</div>
              <div style={{ fontSize: 9, opacity: 0.85, marginBottom: 2 }}>RA: <strong>{data.aluno.ra}</strong></div>
              <div style={{ fontSize: 9, opacity: 0.85, marginBottom: 2 }}>CPF: {data.aluno.cpf}</div>
              <div style={{ fontSize: 9, opacity: 0.85 }}>{GRAU[data.curso.grau] ?? data.curso.grau} em {data.curso.nome}</div>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 10, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            fontSize: 8, opacity: 0.8, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 6,
          }}>
            <span>Válida até {validaAteCurta}</span>
            <span>{branding.nomeInstituicao}</span>
          </div>
        </div>

        {/* ── Verso ──────────────────────────────────────────────── */}
        <div className="carteirinha-face" style={{
          width: 340, height: 214, borderRadius: 14, overflow: 'hidden',
          background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
          color: '#fff', fontFamily: 'Arial, sans-serif', position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,.25)', padding: 16, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>
              Validação de autenticidade
            </div>
            <div style={{ fontSize: 8.5, opacity: 0.85, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {origin ? `${origin}/validar-carteirinha` : 'validação online'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 6, padding: 6, flexShrink: 0, lineHeight: 0 }}>
              {urlValidacao && <QrCode value={urlValidacao} size={78} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8, opacity: 0.8, marginBottom: 3 }}>Código de validação:</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, wordBreak: 'break-all' }}>
                {data.codigoValidacao}
              </div>
              <div style={{ fontSize: 8, opacity: 0.7, marginTop: 8 }}>Válida até {validaAteCompleta}</div>
            </div>
          </div>

          <div style={{ fontSize: 7.5, opacity: 0.65, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 6 }}>
            Este documento é meramente ilustrativo da condição de estudante. Em caso de dúvida sobre sua
            autenticidade, valide o código acima em {origin ? `${origin}/validar-carteirinha` : 'nossa plataforma'}.
          </div>
        </div>
      </div>

      <p className="no-print" style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
        Documento gerado eletronicamente em {new Date(data.geradoEm).toLocaleString('pt-BR')}.
      </p>

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
            display: flex !important;
            padding: 0 !important;
          }
          #documento * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .carteirinha-face { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
