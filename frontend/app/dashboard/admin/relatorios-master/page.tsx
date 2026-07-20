'use client';
import { useRef, useState } from 'react';
import { apiDownload, apiFetch } from '@/lib/api';

const BTN_P: React.CSSProperties = { padding: '10px 18px', borderRadius: 6, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '10px 18px', borderRadius: 6, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'var(--white)', color: 'var(--gray-700)' };

type Formato = 'sql' | 'sql-schema' | 'xlsx' | 'xml' | 'json' | 'uploads' | 'biblioteca-xlsx';

interface ResultadoImportacaoLivros {
  total: number;
  sucesso: number;
  erro: number;
  detalhes: { linha: number; titulo: string; codigoTombamento: string; status: 'ok' | 'erro'; mensagem?: string }[];
}

const COLUNAS_MODELO_LIVROS = ['Titulo', 'Autor', 'Editora', 'ISBN', 'Categoria', 'AnoPublicacao', 'CDD', 'Cutter', 'Edicao', 'CodigoTombamento', 'Localizacao'];

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const BOTOES_BANCO: { formato: Formato; label: string; rota: string; filename: string; estilo: React.CSSProperties }[] = [
  { formato: 'sql', label: '⭳ SQL completo', rota: '/relatorios-master/dump-sql', filename: 'banco-completo.sql', estilo: BTN_P },
  { formato: 'sql-schema', label: '⭳ SQL (só schema)', rota: '/relatorios-master/dump-sql?apenasSchema=true', filename: 'schema.sql', estilo: BTN_G },
  { formato: 'xlsx', label: '⭳ XLSX', rota: '/relatorios-master/dump-xlsx', filename: 'banco-completo.xlsx', estilo: BTN_G },
  { formato: 'xml', label: '⭳ XML', rota: '/relatorios-master/dump-xml', filename: 'banco-completo.xml', estilo: BTN_G },
  { formato: 'json', label: '⭳ JSON', rota: '/relatorios-master/dump-json', filename: 'banco-completo.json', estilo: BTN_G },
];

export default function RelatoriosMasterPage() {
  const [baixando, setBaixando] = useState<Formato | null>(null);
  const [erro, setErro] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState<ResultadoImportacaoLivros | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function baixar(formato: Formato, rota: string, filename: string) {
    setErro('');
    setBaixando(formato);
    try {
      await apiDownload(rota, filename);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao gerar o arquivo.');
    } finally {
      setBaixando(null);
    }
  }

  function baixarModeloLivros() {
    const linhas = [
      COLUNAS_MODELO_LIVROS.join(','),
      ['Direito Constitucional Esquematizado', 'Pedro Lenza', 'Saraiva', '', 'Direito', '2024', '342.8106', 'L575d', '28.ed', 'BIB-000001', 'Estante A3'].map(csvEscape).join(','),
    ];
    const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-acervo-biblioteca.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importarLivros(file: File) {
    setImportando(true);
    setErro('');
    setResultadoImportacao(null);
    try {
      const texto = await file.text();
      const linhasTexto = texto.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
      if (linhasTexto.length < 2) throw new Error('Planilha vazia ou sem linhas de dados.');

      const header = linhasTexto[0].split(',').map(h => h.trim().toLowerCase());
      const idx = (nome: string) => header.indexOf(nome.toLowerCase());
      const idxTitulo = idx('Titulo');
      const idxAutor = idx('Autor');
      const idxTombamento = idx('CodigoTombamento');
      if (idxTitulo === -1 || idxAutor === -1 || idxTombamento === -1) {
        throw new Error('Cabeçalho inválido. Esperado ao menos: Titulo,Autor,CodigoTombamento (ver modelo).');
      }
      const idxEditora = idx('Editora');
      const idxIsbn = idx('ISBN');
      const idxCategoria = idx('Categoria');
      const idxAno = idx('AnoPublicacao');
      const idxCdd = idx('CDD');
      const idxCutter = idx('Cutter');
      const idxEdicao = idx('Edicao');
      const idxLocalizacao = idx('Localizacao');

      const linhas = [];
      for (const linha of linhasTexto.slice(1)) {
        const cols = linha.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (!cols[idxTitulo] || !cols[idxAutor] || !cols[idxTombamento]) continue;
        linhas.push({
          titulo: cols[idxTitulo],
          autor: cols[idxAutor],
          codigoTombamento: cols[idxTombamento],
          editora: idxEditora >= 0 ? cols[idxEditora] || undefined : undefined,
          isbn: idxIsbn >= 0 ? cols[idxIsbn] || undefined : undefined,
          categoria: idxCategoria >= 0 ? cols[idxCategoria] || undefined : undefined,
          anoPublicacao: idxAno >= 0 && cols[idxAno] ? Number(cols[idxAno]) : undefined,
          cdd: idxCdd >= 0 ? cols[idxCdd] || undefined : undefined,
          cutter: idxCutter >= 0 ? cols[idxCutter] || undefined : undefined,
          edicao: idxEdicao >= 0 ? cols[idxEdicao] || undefined : undefined,
          localizacao: idxLocalizacao >= 0 ? cols[idxLocalizacao] || undefined : undefined,
        });
      }
      if (linhas.length === 0) throw new Error('Nenhuma linha válida encontrada (Título, Autor e Código de Tombamento são obrigatórios).');

      const res = await apiFetch<ResultadoImportacaoLivros>('/relatorios-master/biblioteca/importar-livros', {
        method: 'POST',
        body: JSON.stringify({ linhas }),
      });
      setResultadoImportacao(res);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao importar planilha.');
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Relatórios Master</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>
          Exportação completa do sistema — só o perfil Master enxerga esta tela.
        </p>
      </div>

      {erro && (
        <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
          {erro}
        </div>
      )}

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Banco de Dados</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--gray-500)' }}>
          Contém dados pessoais (LGPD) e financeiros de toda a instituição. O SQL completo traz o banco
          restaurável de verdade (schema + dados); XLSX, XML e JSON são pra leitura/análise e nunca trazem
          senha nem segredo de MFA. Cada download fica registrado no Log de Auditoria.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {BOTOES_BANCO.map(b => (
            <button
              key={b.formato}
              style={{ ...b.estilo, opacity: baixando && baixando !== b.formato ? 0.5 : 1 }}
              disabled={baixando !== null}
              onClick={() => baixar(b.formato, b.rota, b.filename)}
            >
              {baixando === b.formato ? 'Gerando...' : b.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Arquivos Enviados</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--gray-500)' }}>
          Fotos de perfil, documentos de aluno, capturas de prova e imagens de identidade visual — arquivos
          físicos que ficam em disco, fora do banco de dados.
        </p>
        <button
          style={{ ...BTN_G, opacity: baixando && baixando !== 'uploads' ? 0.5 : 1 }}
          disabled={baixando !== null}
          onClick={() => baixar('uploads', '/relatorios-master/uploads-zip', 'uploads.zip')}
        >
          {baixando === 'uploads' ? 'Compactando...' : '⭳ ZIP de uploads'}
        </button>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginTop: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Módulo Biblioteca</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--gray-500)' }}>
          Controle de downloads (acervo completo) e uploads (importação em lote do catálogo) do módulo de
          Biblioteca. Cada operação fica registrada no Log de Auditoria.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>Download do acervo</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--gray-500)' }}>
              XLSX com 3 abas: Livros (1 linha por exemplar físico), Equipamentos e Empréstimos.
            </p>
            <button
              style={{ ...BTN_G, opacity: baixando && baixando !== 'biblioteca-xlsx' ? 0.5 : 1 }}
              disabled={baixando !== null}
              onClick={() => baixar('biblioteca-xlsx', '/relatorios-master/biblioteca/dump-xlsx', 'biblioteca.xlsx')}
            >
              {baixando === 'biblioteca-xlsx' ? 'Gerando...' : '⭳ XLSX do acervo'}
            </button>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>Upload em lote de livros</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--gray-500)' }}>
              CSV com 1 linha por exemplar (Título/Autor iguais viram o mesmo título, exemplares diferentes).
              Código de tombamento duplicado é reportado como erro, sem travar o restante do lote.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={BTN_G} onClick={baixarModeloLivros}>⭳ Baixar modelo CSV</button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                disabled={importando}
                onChange={e => { const f = e.target.files?.[0]; if (f) importarLivros(f); }}
                style={{ fontSize: 12 }}
              />
            </div>
            {importando && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Importando...</p>}
          </div>
        </div>

        {resultadoImportacao && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
                <strong>{resultadoImportacao.sucesso}</strong> exemplares importados
              </div>
              {resultadoImportacao.erro > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
                  <strong>{resultadoImportacao.erro}</strong> com erro
                </div>
              )}
            </div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                    {['Linha', 'Título', 'Tombamento', 'Status', 'Mensagem'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultadoImportacao.detalhes.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '8px 14px' }}>{d.linha}</td>
                      <td style={{ padding: '8px 14px' }}>{d.titulo}</td>
                      <td style={{ padding: '8px 14px' }}>{d.codigoTombamento}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: d.status === 'ok' ? '#d1fae5' : '#fee2e2', color: d.status === 'ok' ? '#065f46' : '#991b1b' }}>
                          {d.status === 'ok' ? 'OK' : 'Erro'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', color: 'var(--gray-500)' }}>{d.mensagem ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
