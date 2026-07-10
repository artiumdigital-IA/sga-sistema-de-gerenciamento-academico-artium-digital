'use client';
import { useEffect, useState } from 'react';
import { apiFetch, apiFileUrl } from '@/lib/api';

interface DocumentoEnviado {
  id: string;
  tipo: string;
  nomeArquivo: string;
  url: string;
  tamanho: number;
  criadoEm: string;
}

interface RespostaDocumentos {
  pendentes: string[];
  enviados: DocumentoEnviado[];
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PendenciasDocumentosPage() {
  const [dados, setDados] = useState<RespostaDocumentos | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<RespostaDocumentos>('/discente/documentos')
      .then(setDados)
      .catch(e => setErro(e.message ?? 'Erro ao carregar documentos.'));
  }, []);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 760 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Pendências de Documentos</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Checklist de documentos costumeiramente exigidos pela secretaria e o que você já enviou.
      </p>

      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!erro && !dados && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>}

      {dados && (
        <>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--gray-700)' }}>Pendências</div>
            {dados.pendentes.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#16a34a' }}>✓ Nenhuma pendência — todos os documentos exigidos foram enviados.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {dados.pendentes.map(p => (
                  <li key={p} style={{ fontSize: 13, color: '#b45309', marginBottom: 4 }}>{p}</li>
                ))}
              </ul>
            )}
            <p style={{ margin: '10px 0 0', fontSize: 11.5, color: 'var(--gray-400)' }}>
              Documentos são enviados/digitalizados pela secretaria — procure-a presencialmente ou pelo Protocolo pra regularizar uma pendência.
            </p>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
              Documentos enviados
            </div>
            {dados.enviados.length === 0 ? (
              <p style={{ margin: 0, padding: 16, fontSize: 13, color: 'var(--gray-400)' }}>Nenhum documento enviado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dados.enviados.map(d => (
                  <a key={d.id} href={apiFileUrl(d.url) ?? '#'} target="_blank" rel="noreferrer" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', textDecoration: 'none', color: 'inherit',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{d.tipo}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{d.nomeArquivo} · {formatarTamanho(d.tamanho)}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(d.criadoEm).toLocaleDateString('pt-BR')}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
