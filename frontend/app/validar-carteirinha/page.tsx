'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { formatarData } from '@/lib/format';
import { useBranding } from '@/lib/branding';

type ResultadoValidacao = {
  valido: boolean;
  ra?: string;
  nome?: string;
  curso?: string;
  fotoUrl?: string | null;
  validade?: string;
};

function ValidarCarteirinhaConteudo() {
  const branding = useBranding();
  const searchParams = useSearchParams();
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [jaValidou, setJaValidou] = useState(false);

  async function validar(codigoAlvo: string) {
    if (!codigoAlvo.trim()) return;
    setLoading(true);
    setErro('');
    setResultado(null);
    try {
      const r = await apiFetch<ResultadoValidacao>(`/documentos/carteirinha/validar/${encodeURIComponent(codigoAlvo.trim())}`);
      setResultado(r);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao validar código. Tente novamente.');
    } finally {
      setLoading(false);
      setJaValidou(true);
    }
  }

  useEffect(() => {
    const codigoParam = searchParams.get('codigo');
    if (codigoParam) {
      setCodigo(codigoParam);
      validar(codigoParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fotoSrc = apiFileUrl(resultado?.fotoUrl ?? null);
  const validadeFmt = resultado?.validade ? formatarData(resultado.validade) : '';
  const corPrimaria = branding.corPrimaria || '#1C3A6B';
  const logoUrl = apiFileUrl(branding.logoUrl);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', justifyContent: 'center', padding: '48px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {logoUrl && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 44, maxWidth: 180, objectFit: 'contain' }} />
          </div>
        )}

        <h1 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: corPrimaria, marginBottom: 20 }}>
          Carteirinha
        </h1>

        <div style={{ background: '#eaf3fb', border: '1px solid #cfe3f5', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#33475b', marginBottom: 20, lineHeight: 1.5 }}>
          Para validar a carteirinha de estudante, digite no campo abaixo o código de validação impresso no verso da carteirinha.
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Código de Validação:
          </label>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') validar(codigo); }}
            placeholder="0000000000000-00"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
          />
          <button
            onClick={() => validar(codigo)}
            disabled={loading}
            style={{ width: '100%', padding: '10px 0', background: loading ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Validando...' : 'Validar'}
          </button>
        </div>

        {erro && (
          <div style={{ marginTop: 20, textAlign: 'center', color: '#b91c1c', fontSize: 13 }}>{erro}</div>
        )}

        {jaValidou && resultado && (
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${resultado.valido ? '#16a34a' : '#dc2626'}`,
            }}>
              <span style={{ fontSize: 26, color: resultado.valido ? '#16a34a' : '#dc2626' }}>
                {resultado.valido ? '✓' : '✕'}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5, color: resultado.valido ? '#16a34a' : '#dc2626', marginBottom: 16 }}>
              {resultado.valido ? 'CARTEIRINHA VÁLIDA' : 'CARTEIRINHA INVÁLIDA OU EXPIRADA'}
            </div>

            {resultado.ra && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, textAlign: 'left', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, fontSize: 13, lineHeight: 1.9, color: '#111827' }}>
                  <div><strong>RA:</strong> {resultado.ra}</div>
                  <div><strong>Aluno:</strong> {resultado.nome}</div>
                  <div><strong>Curso:</strong> {resultado.curso}</div>
                  {validadeFmt && <div><strong>Validade:</strong> {validadeFmt}</div>}
                </div>
                <div style={{
                  width: 56, height: 70, borderRadius: 4, background: '#f3f4f6', border: '1px solid #e5e7eb',
                  overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {fotoSrc
                    ? <img src={fotoSrc} alt={resultado.nome ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 20, color: '#9ca3af' }}>{resultado.nome?.charAt(0) ?? '?'}</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ValidarCarteirinhaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>}>
      <ValidarCarteirinhaConteudo />
    </Suspense>
  );
}
