'use client';
import { useEffect, useRef, useState } from 'react';
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

/* ─── Cards móveis: ordem + coluna persistem em localStorage, o conteúdo
 * (JSX) é recalculado a cada render a partir do estado da página — só a
 * posição é guardada. Se o conjunto de ids mudar numa versão futura (card
 * novo/removido), cai de volta pro layout padrão em vez de quebrar. ─── */
interface CardPos { id: string; colIdx: number }
const IDS_CARDS = ['banco', 'uploads', 'bib-download', 'bib-upload'] as const;
type CardId = typeof IDS_CARDS[number];
const ORDEM_PADRAO: CardPos[] = [
  { id: 'banco', colIdx: 0 },
  { id: 'uploads', colIdx: 1 },
  { id: 'bib-download', colIdx: 1 },
  { id: 'bib-upload', colIdx: 2 },
];
const ORDEM_KEY = 'fiurj_relatorios_master_ordem';

function IconBanco() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>;
}
function IconUploads() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconBiblioteca() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}

/* ─── Card arrastável — mesmo padrão visual/drag do Painel (dashboard/page.tsx) ─── */
function RMCard({
  id, title, icon, children, dragging, onDragStart, onDragEnd,
}: {
  id: string; title: string; icon: React.ReactNode; children: React.ReactNode;
  dragging: boolean; onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void;
}) {
  return (
    <div
      id={id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: 'var(--white)',
        borderRadius: 8,
        border: '1px solid var(--gray-200)',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        marginBottom: 16,
        opacity: dragging ? 0.4 : 1,
        transition: 'opacity .15s',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)',
      }}>
        <span style={{ cursor: 'grab', color: 'var(--gray-300)', display: 'flex', userSelect: 'none' }} title="Arraste para reordenar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="6" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="19" cy="6" r="1.5"/>
            <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            <circle cx="5" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="19" cy="18" r="1.5"/>
          </svg>
        </span>
        <span style={{ color: 'var(--accent-blue-text)' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export default function RelatoriosMasterPage() {
  const [baixando, setBaixando] = useState<Formato | null>(null);
  const [erro, setErro] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState<ResultadoImportacaoLivros | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [ordem, setOrdem] = useState<CardPos[]>(ORDEM_PADRAO);
  const dragId = useRef<CardId | null>(null);
  const [draggingId, setDraggingId] = useState<CardId | null>(null);
  // Guarda a 1ª rodada do efeito de "salvar" abaixo — sem isso, ele roda no
  // mount com `ordem` ainda no valor padrão (o `setOrdem` do efeito de carga
  // logo abaixo é assíncrono) e sobrescreve o localStorage antes mesmo da
  // ordem salva ser aplicada. Confirmado na prática: sem esse guard, a
  // ordem arrastada nunca sobrevivia a um F5.
  const primeiraExecucaoSalvar = useRef(true);

  // Lê a ordem salva só no client (evita mismatch de SSR) e se auto-cura
  // se o conjunto de ids salvo não bater mais com os cards atuais.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORDEM_KEY);
      if (!raw) return;
      const salvo: CardPos[] = JSON.parse(raw);
      const idsSalvos = salvo.map(c => c.id).sort().join(',');
      const idsAtuais = [...IDS_CARDS].sort().join(',');
      if (idsSalvos === idsAtuais) setOrdem(salvo);
    } catch { /* localStorage indisponível ou JSON corrompido — mantém o padrão */ }
  }, []);

  useEffect(() => {
    if (primeiraExecucaoSalvar.current) {
      primeiraExecucaoSalvar.current = false;
      return;
    }
    try { localStorage.setItem(ORDEM_KEY, JSON.stringify(ordem)); } catch { /* modo privado etc. — sem persistência, sem problema */ }
  }, [ordem]);

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

  /* Drag & drop — mesmo padrão do Painel (dashboard/page.tsx) */
  function onDragStart(e: React.DragEvent, id: CardId) {
    dragId.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragEnd() {
    dragId.current = null;
    setDraggingId(null);
  }
  function onDrop(e: React.DragEvent, targetColIdx: number, targetId?: CardId) {
    e.preventDefault();
    const src = dragId.current;
    if (!src || src === targetId) return;
    setOrdem(prev => {
      const list = [...prev];
      const srcIdx = list.findIndex(c => c.id === src);
      if (srcIdx === -1) return prev;
      const [moved] = list.splice(srcIdx, 1);
      moved.colIdx = targetColIdx;
      if (targetId) {
        const tgtIdx = list.findIndex(c => c.id === targetId);
        list.splice(tgtIdx, 0, moved);
      } else {
        list.push(moved);
      }
      return list;
    });
    dragId.current = null;
    setDraggingId(null);
  }

  const conteudoCards: Record<CardId, { title: string; icon: React.ReactNode; content: React.ReactNode }> = {
    banco: {
      title: 'Banco de Dados',
      icon: <IconBanco />,
      content: (
        <>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--gray-500)' }}>
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
        </>
      ),
    },
    uploads: {
      title: 'Arquivos Enviados',
      icon: <IconUploads />,
      content: (
        <>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--gray-500)' }}>
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
        </>
      ),
    },
    'bib-download': {
      title: 'Biblioteca — Download do Acervo',
      icon: <IconBiblioteca />,
      content: (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--gray-500)' }}>
            XLSX com 3 abas: Livros (1 linha por exemplar físico), Equipamentos e Empréstimos. Fica registrado
            no Log de Auditoria.
          </p>
          <button
            style={{ ...BTN_G, opacity: baixando && baixando !== 'biblioteca-xlsx' ? 0.5 : 1 }}
            disabled={baixando !== null}
            onClick={() => baixar('biblioteca-xlsx', '/relatorios-master/biblioteca/dump-xlsx', 'biblioteca.xlsx')}
          >
            {baixando === 'biblioteca-xlsx' ? 'Gerando...' : '⭳ XLSX do acervo'}
          </button>
        </>
      ),
    },
    'bib-upload': {
      title: 'Biblioteca — Upload em Lote de Livros',
      icon: <IconBiblioteca />,
      content: (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--gray-500)' }}>
            CSV com 1 linha por exemplar (Título/Autor iguais viram o mesmo título, exemplares diferentes).
            Código de tombamento duplicado é reportado como erro, sem travar o restante do lote.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
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
          {importando && <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Importando...</p>}

          {resultadoImportacao && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <strong>{resultadoImportacao.sucesso}</strong> exemplares importados
                </div>
                {resultadoImportacao.erro > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <strong>{resultadoImportacao.erro}</strong> com erro
                  </div>
                )}
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      {['Linha', 'Título', 'Tombamento', 'Status', 'Mensagem'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoImportacao.detalhes.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '6px 10px' }}>{d.linha}</td>
                        <td style={{ padding: '6px 10px' }}>{d.titulo}</td>
                        <td style={{ padding: '6px 10px' }}>{d.codigoTombamento}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: d.status === 'ok' ? '#d1fae5' : '#fee2e2', color: d.status === 'ok' ? '#065f46' : '#991b1b' }}>
                            {d.status === 'ok' ? 'OK' : 'Erro'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--gray-500)' }}>{d.mensagem ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ),
    },
  };

  const cards = ordem.map(pos => ({ ...pos, ...conteudoCards[pos.id as CardId] }));
  const colunas = [0, 1, 2].map(i => cards.filter(c => c.colIdx === i));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1240 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Relatórios Master</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>
          Exportação completa do sistema — só o perfil Master enxerga esta tela. Arraste os cards pelo ícone
          de pontos pra reordenar ou mudar de coluna.
        </p>
      </div>

      {erro && (
        <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
          {erro}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {colunas.map((coluna, colIdx) => (
          <div
            key={colIdx}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, colIdx)}
            style={{ minHeight: 120 }}
          >
            {coluna.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-300)', fontSize: 12, border: '2px dashed var(--gray-200)', borderRadius: 8 }}>
                Arraste um card para esta coluna
              </div>
            )}
            {coluna.map(card => (
              <RMCard
                key={card.id}
                id={card.id}
                title={card.title}
                icon={card.icon}
                dragging={draggingId === card.id}
                onDragStart={e => onDragStart(e, card.id as CardId)}
                onDragEnd={onDragEnd}
              >
                {card.content}
              </RMCard>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
