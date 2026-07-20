'use client';
import { useState } from 'react';
import FrenteTab from './FrenteTab';
import VersoTab from './VersoTab';

export default function GeradorCertificadoPage() {
  const [tab, setTab] = useState<'frente' | 'verso'>('frente');

  return (
    <div style={{ padding: '24px 28px', maxWidth: tab === 'verso' ? 1500 : 900 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Gerador de Certificado</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Monte a frente (modelo com imagem de fundo) e o verso (disciplinas cursadas) do certificado.
          Ao gerar, o PDF abre em uma nova aba — você escolhe se baixa ou não.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--gray-200)' }}>
        {([
          ['frente', 'Frente'],
          ['verso', 'Verso'],
        ] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              borderBottom: tab === v ? '2px solid var(--accent-blue-text)' : '2px solid transparent',
              color: tab === v ? 'var(--accent-blue-text)' : 'var(--gray-500)',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'frente' ? <FrenteTab /> : <VersoTab />}
    </div>
  );
}
