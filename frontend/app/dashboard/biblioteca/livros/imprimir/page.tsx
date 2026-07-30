'use client';
import { useState, useEffect } from 'react';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { getToken, parseJwt } from '@/lib/auth';
import { useBranding } from '@/lib/branding';

type StatusItem = 'DISPONIVEL' | 'EMPRESTADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO';
interface Exemplar { id: string; codigoTombamento: string; localizacao: string | null; status: StatusItem; numeroExemplar: number | null; }
interface Livro {
  id: string; titulo: string; autor: string; editora: string | null; isbn: string | null;
  categoria: string | null; anoPublicacao: number | null; cdd: string | null; cutter: string | null; edicao: string | null;
  exemplares?: Exemplar[];
}

const STATUS_LABEL: Record<StatusItem, string> = {
  DISPONIVEL: 'Disponível', EMPRESTADO: 'Emprestado', MANUTENCAO: 'Manutenção', EXTRAVIADO: 'Extraviado', BAIXADO: 'Baixado',
};

interface Linha {
  titulo: string; autor: string; editora: string; categoria: string; ano: string;
  classificacao: string; edicao: string; numeroExemplar: string; codigoTombamento: string; localizacao: string; status: string;
}

export default function ImprimirAcervoPage() {
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const token = getToken();
  const perfil = token ? parseJwt(token)?.perfil : null;
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (perfil !== 'MASTER') return;
    apiFetch<Livro[]>('/biblioteca/livros')
      .then(livros => {
        const l: Linha[] = [];
        for (const livro of livros) {
          const exemplares = livro.exemplares && livro.exemplares.length > 0 ? livro.exemplares : [null];
          for (const ex of exemplares) {
            l.push({
              titulo: livro.titulo,
              autor: livro.autor,
              editora: livro.editora ?? '—',
              categoria: livro.categoria ?? '—',
              ano: livro.anoPublicacao ? String(livro.anoPublicacao) : '—',
              classificacao: livro.cdd || livro.cutter ? `${livro.cdd ?? ''} ${livro.cutter ?? ''}`.trim() : '—',
              edicao: livro.edicao ?? '—',
              numeroExemplar: ex?.numeroExemplar ? `ex.${ex.numeroExemplar}` : '—',
              codigoTombamento: ex?.codigoTombamento ?? '—',
              localizacao: ex?.localizacao ?? '—',
              status: ex ? STATUS_LABEL[ex.status] : '—',
            });
          }
        }
        setLinhas(l);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar o acervo'));
  }, [perfil]);

  if (perfil !== 'MASTER') {
    return <div style={{ padding: 40, color: '#ef4444' }}>Acesso restrito ao perfil Master.</div>;
  }
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>{error}</div>;
  if (!linhas) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;

  const hoje = new Date();

  return (
    <>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          🖨️ Imprimir / Salvar PDF
        </button>
        <button onClick={() => window.close()}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          ← Fechar
        </button>
      </div>

      <div id="documento" style={{ background: '#fff', margin: '0 auto', padding: '28px 32px', fontFamily: 'Times New Roman, serif', fontSize: 11, lineHeight: 1.4, color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #000', paddingBottom: 12 }}>
          {logoUrl && (
            <img src={logoUrl} alt={branding.nomeInstituicao} style={{ maxHeight: 40, maxWidth: 200, objectFit: 'contain', margin: '0 auto 8px' }} />
          )}
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{branding.nomeCompleto}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>Biblioteca — Acervo Completo</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11 }}>
          <span>{linhas.length} exemplar(es) em {new Set(linhas.map(l => l.titulo + l.autor)).size} título(s)</span>
          <span>Gerado em {hoje.toLocaleString('pt-BR')}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {['Título', 'Autor', 'Editora', 'Categoria', 'Ano', 'Classificação', 'Edição', 'Exemplar', 'Tombamento', 'Localização', 'Status'].map(h => (
                <th key={h} style={{ padding: '4px 6px', border: '1px solid #d1d5db', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.titulo}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.autor}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.editora}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.categoria}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.ano}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{l.classificacao}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.edicao}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.numeroExemplar}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{l.codigoTombamento}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.localizacao}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db' }}>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 16, fontSize: 9, color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
          Documento gerado eletronicamente pela plataforma acadêmica {branding.nomeInstituicao}.
        </div>
      </div>

      <style>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
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
          #documento table { border-collapse: collapse; }
          #documento thead { display: table-header-group; }
          #documento tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
