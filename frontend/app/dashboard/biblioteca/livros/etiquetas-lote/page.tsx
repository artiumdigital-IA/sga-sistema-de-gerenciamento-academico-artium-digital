'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import { Code39Barcode } from '@/lib/barcode';
import { CHAVE_FILA_ETIQUETAS_LIVROS } from '@/lib/etiquetasLote';

type ExemplarEtiqueta = {
  id: string;
  codigoTombamento: string;
  numeroExemplar: number | null;
  livro: { titulo: string; autor: string; cdd: string | null; cutter: string | null; anoPublicacao: number | null };
};

// Folha Pimaco 6082/6182/6282 (Carta, 14 etiquetas: 2 colunas x 7 linhas,
// cada uma 101,6mm x 33,9mm). Margens/espaçamento abaixo são uma estimativa
// (derivada de centralizar a grade na folha Carta 215,9x279,4mm) -- ajustável
// na tela antes de imprimir. IMPORTANTE: sempre testar numa folha de papel
// comum primeiro (sem gastar etiqueta de verdade) e comparar contra a folha
// física antes de imprimir o lote real, ajustando os campos se preciso.
const PAGINA_LARGURA = 215.9;
const PAGINA_ALTURA = 279.4;
const ETIQUETA_LARGURA = 101.6;
const ETIQUETA_ALTURA = 33.9;
const COLUNAS = 2;
const LINHAS = 7;
const POR_FOLHA = COLUNAS * LINHAS;
const MARGEM_TOPO_PADRAO = (PAGINA_ALTURA - LINHAS * ETIQUETA_ALTURA) / 2;
const MARGEM_ESQUERDA_PADRAO = 4.0;
const ESPACO_H_PADRAO = PAGINA_LARGURA - COLUNAS * ETIQUETA_LARGURA - 2 * MARGEM_ESQUERDA_PADRAO;

function EtiquetaCell({ dado, branding }: { dado: ExemplarEtiqueta; branding: ReturnType<typeof useBranding> }) {
  return (
    <div
      style={{
        width: `${ETIQUETA_LARGURA}mm`, height: `${ETIQUETA_ALTURA}mm`, boxSizing: 'border-box',
        display: 'flex', overflow: 'hidden', fontFamily: 'Arial, sans-serif', background: '#fff',
        border: '1px dotted #ccc', // só de referência na tela/rascunho -- não some no print real da etiqueta adesiva
      }}
    >
      <div style={{ flex: 1, padding: '1mm 2mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, borderRight: '1px dashed #999', minWidth: 0 }}>
        <div style={{ fontSize: '9pt', fontWeight: 700, color: '#000', lineHeight: 1.1 }}>{dado.livro.cdd ?? '—'}</div>
        <div style={{ fontSize: '9pt', fontWeight: 700, color: '#000', lineHeight: 1.1 }}>{dado.livro.cutter ?? '—'}</div>
        <div style={{ fontSize: '7pt', color: '#000' }}>ex.{dado.numeroExemplar ?? '—'} {dado.livro.anoPublicacao ?? ''}</div>
      </div>
      <div style={{ flex: 1, padding: '1mm 2mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, minWidth: 0 }}>
        <div style={{ fontSize: '7pt', fontWeight: 700, color: '#000', textAlign: 'center' }}>{branding.nomeInstituicao}</div>
        <div style={{ fontSize: '6pt', color: '#000' }}>LIV</div>
        <Code39Barcode value={dado.codigoTombamento} height={20} narrowWidth={0.9} />
      </div>
    </div>
  );
}

export default function EtiquetasLoteLivrosPage() {
  const branding = useBranding();
  const [itens, setItens] = useState<ExemplarEtiqueta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [margemTopo, setMargemTopo] = useState(MARGEM_TOPO_PADRAO);
  const [margemEsquerda, setMargemEsquerda] = useState(MARGEM_ESQUERDA_PADRAO);
  const [espacoH, setEspacoH] = useState(ESPACO_H_PADRAO);
  const [espacoV, setEspacoV] = useState(0);

  useEffect(() => {
    const bruto = sessionStorage.getItem(CHAVE_FILA_ETIQUETAS_LIVROS);
    const ids: string[] = bruto ? JSON.parse(bruto) : [];
    if (ids.length === 0) { setErro('Nenhum exemplar selecionado. Volte pra tela de Livros e marque os exemplares antes de gerar as etiquetas.'); setCarregando(false); return; }
    Promise.all(ids.map(id => apiFetch<ExemplarEtiqueta>(`/biblioteca/livros/exemplares/${id}`)))
      .then(setItens)
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar exemplares selecionados'))
      .finally(() => setCarregando(false));
  }, []);

  const folhas: ExemplarEtiqueta[][] = [];
  for (let i = 0; i < itens.length; i += POR_FOLHA) folhas.push(itens.slice(i, i + POR_FOLHA));

  const numero = (v: number, set: (n: number) => void) => (
    <input type="number" step="0.1" value={v} onChange={e => set(Number(e.target.value))}
      style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }} />
  );

  return (
    <>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <button onClick={() => window.print()} disabled={itens.length === 0}
          style={{ padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          🖨️ Imprimir {itens.length > 0 ? `(${itens.length} etiqueta${itens.length > 1 ? 's' : ''}, ${folhas.length} folha${folhas.length > 1 ? 's' : ''})` : ''}
        </button>
        <button onClick={() => window.close()} style={{ padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Fechar</button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', fontSize: 12, color: '#374151' }}>
          <label>Margem topo (mm)<br />{numero(margemTopo, setMargemTopo)}</label>
          <label>Margem esquerda (mm)<br />{numero(margemEsquerda, setMargemEsquerda)}</label>
          <label>Espaço entre colunas (mm)<br />{numero(espacoH, setEspacoH)}</label>
          <label>Espaço entre linhas (mm)<br />{numero(espacoV, setEspacoV)}</label>
        </div>
      </div>
      <p className="no-print" style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 12, maxWidth: 700 }}>
        Folha Pimaco 6082/6182/6282 (Carta, {POR_FOLHA} etiquetas de {ETIQUETA_LARGURA}×{ETIQUETA_ALTURA}mm). Os valores
        acima são uma estimativa — <strong>imprima antes numa folha de papel comum</strong> e compare contra a folha de
        etiquetas de verdade na luz; ajuste os campos até bater certinho, só depois imprima na folha adesiva real.
      </p>

      {erro && <p className="no-print" style={{ color: '#ef4444' }}>{erro}</p>}
      {carregando && <p className="no-print" style={{ color: '#6b7280' }}>Carregando...</p>}

      {folhas.map((folha, fi) => (
        <div key={fi} className="folha-etiquetas" style={{
          width: `${PAGINA_LARGURA}mm`, minHeight: `${PAGINA_ALTURA}mm`, boxSizing: 'border-box',
          paddingTop: `${margemTopo}mm`, paddingLeft: `${margemEsquerda}mm`,
          display: 'grid', gridTemplateColumns: `repeat(${COLUNAS}, ${ETIQUETA_LARGURA}mm)`,
          gridTemplateRows: `repeat(${LINHAS}, ${ETIQUETA_ALTURA}mm)`,
          columnGap: `${espacoH}mm`, rowGap: `${espacoV}mm`,
          margin: fi > 0 ? '20px auto 0' : '0 auto',
        }}>
          {folha.map(item => <EtiquetaCell key={item.id} dado={item} branding={branding} />)}
        </div>
      ))}

      <style>{`
        @page { size: 215.9mm 279.4mm; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .folha-etiquetas { page-break-after: always; margin: 0 !important; }
          .folha-etiquetas:last-child { page-break-after: auto; }
        }
      `}</style>
    </>
  );
}
