'use client';
import { useEffect, useMemo, useState } from 'react';
import { apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

const INTERVALO_MS = 6000;

/**
 * Galeria de imagens de publicidade — substitui os 3 boxes de estatísticas
 * (Cursos/Alunos/Professores) no /dashboard do perfil ALUNO. Imagens são
 * geridas em /dashboard/admin/visual (seção "Galeria de Publicidade"),
 * guardadas em ConfiguracaoVisual.galeriaPublicidade.
 */
export function GaleriaPublicidade() {
  const branding = useBranding();
  const imagens = useMemo(
    () => (branding.galeriaPublicidade ?? []).filter(i => i.ativa).sort((a, b) => a.ordem - b.ordem),
    [branding.galeriaPublicidade],
  );
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice(0);
  }, [imagens.length]);

  useEffect(() => {
    if (imagens.length <= 1) return;
    const id = setInterval(() => setIndice(i => (i + 1) % imagens.length), INTERVALO_MS);
    return () => clearInterval(id);
  }, [imagens.length]);

  if (imagens.length === 0) {
    return (
      <div style={{
        margin: '14px 14px 0', padding: '28px 14px', textAlign: 'center',
        background: 'var(--gray-50)', border: '1px dashed var(--gray-300)', borderRadius: 8,
        fontSize: 12.5, color: 'var(--gray-400)',
      }}>
        Nenhuma imagem cadastrada na galeria de publicidade. Administre em Identidade Visual.
      </div>
    );
  }

  const atual = imagens[indice];
  const conteudo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={apiFileUrl(atual.url) ?? ''} alt="Publicidade" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  );

  return (
    <div style={{ margin: '14px 14px 0', position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--gray-200)', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ width: '100%', aspectRatio: '16 / 5', background: 'var(--gray-100)' }}>
        {atual.link ? (
          <a href={atual.link} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>{conteudo}</a>
        ) : conteudo}
      </div>

      {imagens.length > 1 && (
        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {imagens.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndice(i)}
              aria-label={`Imagem ${i + 1}`}
              style={{
                width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                background: i === indice ? '#fff' : 'rgba(255,255,255,.5)',
                boxShadow: '0 0 0 1px rgba(0,0,0,.15)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
