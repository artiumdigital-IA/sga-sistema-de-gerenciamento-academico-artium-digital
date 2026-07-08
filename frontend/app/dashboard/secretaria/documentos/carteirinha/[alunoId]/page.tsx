'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

type CarteirinhaData = {
  aluno: { id: string; nome: string; ra: string; cpf: string; dataNascimento: string; situacaoVinculo: string; fotoUrl: string | null };
  curso: { nome: string; grau: string };
  validaAte: string;
  geradoEm: string;
};

const GRAU: Record<string, string> = { BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo' };

export default function CarteirinhaPage() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const [data, setData] = useState<CarteirinhaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const validaAte = new Date(data.validaAte).toLocaleDateString('pt-BR');

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

      <div id="documento" style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        {/* Carteirinha estilo cartão de crédito (85.6mm x 54mm ~ proporção CR80) */}
        <div style={{
          width: 340, height: 214, borderRadius: 14, overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)',
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
                <div style={{ fontSize: 8, opacity: 0.8, maxWidth: 170 }}>{branding.nomeCompleto.replace(`${branding.nomeInstituicao} — `, '')}</div>
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
            <span>Válida até {validaAte}</span>
            <span>{branding.nomeInstituicao}</span>
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
            print-color-adjust: exact !important