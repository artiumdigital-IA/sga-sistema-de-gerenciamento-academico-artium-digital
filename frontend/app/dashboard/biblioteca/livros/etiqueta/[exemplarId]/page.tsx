'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import { Code39Barcode } from '@/lib/barcode';

type ExemplarEtiqueta = {
  id: string;
  codigoTombamento: string;
  numeroExemplar: number | null;
  livro: { titulo: string; autor: string; cdd: string | null; cutter: string | null; anoPublicacao: number | null };
};

export default function EtiquetaLivroPage() {
  const { exemplarId } = useParams<{ exemplarId: string }>();
  const branding = useBranding();
  const [data, setData] = useState<ExemplarEtiqueta | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<ExemplarEtiqueta>(`/biblioteca/livros/exemplares/${exemplarId}`)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Exemplar não encontrado'));
  }, [exemplarId]);

  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!data) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;

  return (
    <>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          🖨️ Imprimir Etiqueta
        </button>
        <button onClick={() => window.close()}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          Fechar
        </button>
      </div>
      <p className="no-print" style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
        {data.livro.titulo} — {data.livro.autor}
      </p>

      <div id="documento" style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <div className="etiqueta" style={{
          width: 260, height: 100, border: '1px solid #000', display: 'flex',
          fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', background: '#fff',
        }}>
          <div style={{
            flex: 1, padding: 8, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', gap: 3, borderRight: '1px dashed #999',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#000', lineHeight: 1.1 }}>{data.livro.cdd ?? '—'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#000', lineHeight: 1.1 }}>{data.livro.cutter ?? '—'}</div>
            <div style={{ fontSize: 11, color: '#000' }}>
              ex.{data.numeroExemplar ?? '—'} {data.livro.anoPublicacao ?? ''}
            </div>
          </div>
          <div style={{
            flex: 1, padding: 8, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>{branding.nomeInstituicao}</div>
            <div style={{ fontSize: 11, color: '#000' }}>LIV</div>
            <Code39Barcode value={data.codigoTombamento} height={26} narrowWidth={1.1} />
          </div>
        </div>
      </div>

      <style>{`
        @page { size: A4; margin: 15mm 14mm; }
        @media print {
          .no-print { display: none !important; }
          #documento { display: flex !important; padding: 0 !important; }
          .etiqueta { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
