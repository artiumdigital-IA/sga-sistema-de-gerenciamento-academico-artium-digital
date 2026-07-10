'use client';
import { useEffect, useState } from 'react';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import QrCode from '@/components/QrCode';

interface Carteirinha {
  aluno: { id: string; nome: string; ra: string; cpf: string; dataNascimento: string; situacaoVinculo: string; fotoUrl: string | null };
  curso: { nome: string; grau: string };
  validaAte: string;
  codigoValidacao: string;
  geradoEm: string;
}

const GRAU_LABEL: Record<string, string> = {
  BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo',
  ESPECIALIZACAO: 'Especialização', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado', POS_DOUTORADO: 'Pós-Doutorado',
};

export default function CarteiraEstudantePage() {
  const branding = useBranding();
  const [dados, setDados] = useState<Carteirinha | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<Carteirinha>('/discente/carteira')
      .then(setDados)
      .catch(e => setErro(e.message ?? 'Erro ao carregar carteira de estudante.'));
  }, []);

  const linkValidacao = dados && typeof window !== 'undefined'
    ? `${window.location.origin}/validar-carteirinha?codigo=${encodeURIComponent(dados.codigoValidacao)}`
    : '';

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Carteira de Estudante</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Sua carteirinha digital — o QR code abaixo pode ser escaneado pra validação em qualquer lugar.
      </p>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !dados && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}

      {dados && (
        <div style={{
          maxWidth: 380, background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 12,
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.08)',
        }}>
          <div style={{ background: branding.corPrimaria || '#1C3A6B', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {apiFileUrl(branding.logoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apiFileUrl(branding.logoUrl) ?? ''} alt="" style={{ height: 28, objectFit: 'contain' }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{branding.nomeInstituicao}</div>
              <div style={{ fontSize: 10.5, opacity: 0.85 }}>Carteira de Estudante</div>
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', gap: 14 }}>
            <div style={{
              width: 66, height: 82, borderRadius: 6, background: 'var(--gray-100)', overflow: 'hidden',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gray-200)',
            }}>
              {dados.aluno.fotoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={apiFileUrl(dados.aluno.fotoUrl) ?? ''} alt={dados.aluno.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 22, color: 'var(--gray-400)' }}>{dados.aluno.nome.charAt(0)}</span>}
            </div>
            <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.9 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{dados.aluno.nome}</div>
              <div><strong>RA:</strong> {dados.aluno.ra}</div>
              <div><strong>Curso:</strong> {dados.curso.nome} ({GRAU_LABEL[dados.curso.grau] ?? dados.curso.grau})</div>
              <div><strong>Validade:</strong> {new Date(dados.validaAte).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'center' }}>
            <QrCode value={linkValidacao} size={110} />
          </div>
          <div style={{ padding: '0 16px 16px', textAlign: 'center', fontSize: 10.5, color: 'var(--gray-400)', fontFamily: 'monospace' }}>
            {dados.codigoValidacao}
          </div>
        </div>
      )}
    </div>
  );
}
