'use client';
import { CARD } from './ui';

interface DisciplinaRow { disciplina: string; ch: string; freq: string; nota: string; professor: string; titulacao: string; }

interface VersoPreviewProps {
  cabecalhoSuperior: string;
  instituicao: string;
  cabecalhoPortaria: string;
  curso: string;
  areaConhecimento: string;
  cargaTotal: string;
  periodoRealizacao: string;
  bloco1Titulo: string; bloco1Texto: string;
  bloco2Titulo: string; bloco2Texto: string;
  bloco3Titulo: string; bloco3Texto: string;
  aluno: { nome: string; cpf: string };
  disciplinas: DisciplinaRow[];
  observacoes: string;
}

// Geometria em % da página (297x210mm, mesma matemática do gerar() em
// VersoTab.tsx — margem/lateralW/boxYs/boxHs etc. convertidos de mm pra %
// de largura/altura da página). Não é pixel-perfect com o PDF (fonte do
// navegador != jsPDF), mas fica bem próximo — o PDF gerado continua sendo
// a versão oficial, isso aqui é só conferência visual antes de gerar.
const MARGEM = 1.78; // %
const LATERAL_W = 20; // %
const CONTEUDO_X = 23.1; // %
const CONTEUDO_W = 75.1; // %

const BOX1_Y = 11.43, BOX1_H = 16.78;
const BOX2_Y = 29.16, BOX2_H = 43.7;
const BOX3_Y = 73.8, BOX3_H = 22.83;

const CAIXA_BASE: React.CSSProperties = {
  position: 'absolute', left: `${MARGEM}%`, width: `${LATERAL_W}%`,
  fontSize: '1.05cqw', lineHeight: 1.25, padding: '0 3%', boxSizing: 'border-box', overflow: 'hidden',
};

function Caixa({ top, height, titulo, texto, borda }: { top: number; height: number; titulo: string; texto: string; borda: boolean }) {
  return (
    <div style={{ ...CAIXA_BASE, top: `${top}%`, height: `${height}%`, border: borda ? '0.5px solid #000' : 'none' }}>
      {titulo && <div style={{ fontWeight: 700, textAlign: 'center', marginTop: '4%', marginBottom: '4%' }}>{titulo}</div>}
      <div>{texto}</div>
    </div>
  );
}

export default function VersoPreview({
  cabecalhoSuperior, instituicao, cabecalhoPortaria, curso, areaConhecimento, cargaTotal, periodoRealizacao,
  bloco1Titulo, bloco1Texto, bloco2Titulo, bloco2Texto, bloco3Titulo, bloco3Texto,
  aluno, disciplinas, observacoes,
}: VersoPreviewProps) {
  const colunasTopo = [
    { rotulo: 'Curso', texto: curso, left: 0 },
    { rotulo: 'Área de Conhecimento', texto: areaConhecimento, left: 36.75 },
    { rotulo: 'Carga horária total', texto: cargaTotal, left: 67.7 },
    { rotulo: 'Período de Realização', texto: periodoRealizacao, left: 86.5 },
  ];

  return (
    <div style={CARD}>
      <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Pré-visualização (verso)</h2>
      <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--gray-400)' }}>Aproximação do layout — o PDF gerado ao clicar em &quot;Gerar Certificados&quot; é a versão oficial.</p>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '297 / 210',
          background: '#fff',
          border: '1px solid #999',
          boxShadow: '0 2px 8px rgba(0,0,0,.12)',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#000',
          overflow: 'hidden',
          containerType: 'inline-size',
        } as React.CSSProperties}
      >
        {/* Cabeçalho */}
        <div style={{ position: 'absolute', top: '2%', left: 0, width: '100%', textAlign: 'center', fontSize: '1.5cqw' }}>
          {cabecalhoSuperior || 'Instituto Universitário do Rio de Janeiro - IURJ'}
        </div>
        <div style={{ position: 'absolute', top: '6%', left: 0, width: '100%', textAlign: 'center', fontSize: '2.6cqw', fontWeight: 700 }}>
          {instituicao || 'FACULDADE INSTITUTO RIO DE JANEIRO'}
        </div>
        <div style={{ position: 'absolute', top: '10.5%', left: 0, width: '100%', textAlign: 'center', fontSize: '1.35cqw', padding: '0 8%', boxSizing: 'border-box' }}>
          {cabecalhoPortaria}
        </div>

        {/* Blocos laterais */}
        <Caixa top={BOX1_Y} height={BOX1_H} titulo={bloco1Titulo} texto={bloco1Texto} borda />
        <Caixa top={BOX2_Y} height={BOX2_H} titulo={bloco2Titulo} texto={bloco2Texto} borda />
        <Caixa top={BOX3_Y} height={BOX3_H} titulo={bloco3Titulo} texto={bloco3Texto} borda={false} />

        {/* Curso / Área / Carga / Período */}
        {colunasTopo.map(c => (
          <div key={c.rotulo} style={{ position: 'absolute', top: '16.5%', left: `${CONTEUDO_X + (c.left * CONTEUDO_W) / 100}%`, width: `${(c.left === 86.5 ? 13.5 : 30) * CONTEUDO_W / 100}%`, fontSize: '1.05cqw' }}>
            <div style={{ fontWeight: 700 }}>{c.rotulo}</div>
            <div>{c.texto}</div>
          </div>
        ))}

        {/* Aluno / CPF */}
        <div style={{ position: 'absolute', top: '23.5%', left: `${CONTEUDO_X}%`, width: `${(74 / 297) * 100}%`, fontSize: '1.05cqw' }}>
          <div style={{ fontWeight: 700 }}>Aluno(a)</div>
          <div>{aluno.nome || '—'}</div>
        </div>
        <div style={{ position: 'absolute', top: '23.5%', left: `${CONTEUDO_X + (74 / 297) * 100}%`, width: `${(40 / 297) * 100}%`, fontSize: '1.05cqw' }}>
          <div style={{ fontWeight: 700 }}>CPF</div>
          <div>{aluno.cpf || '—'}</div>
        </div>

        {/* Disciplinas */}
        <div style={{ position: 'absolute', top: '27.5%', left: `${CONTEUDO_X}%`, width: `${CONTEUDO_W}%`, fontSize: '1cqw' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#cdcdcd' }}>
                {['DISCIPLINA', 'CH', 'FREQ', 'NOTA', 'PROFESSOR', 'TITULAÇÃO'].map(h => (
                  <th key={h} style={{ padding: '0.4cqw', fontWeight: 400, textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disciplinas.filter(d => d.disciplina.trim()).slice(0, 8).map((d, i) => (
                <tr key={i}>
                  <td style={{ padding: '0.3cqw' }}>{d.disciplina}</td>
                  <td style={{ padding: '0.3cqw', textAlign: 'center' }}>{d.ch}</td>
                  <td style={{ padding: '0.3cqw', textAlign: 'center' }}>{d.freq}</td>
                  <td style={{ padding: '0.3cqw', textAlign: 'center' }}>{d.nota}</td>
                  <td style={{ padding: '0.3cqw' }}>{d.professor}</td>
                  <td style={{ padding: '0.3cqw' }}>{d.titulacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Observações */}
        <div style={{ position: 'absolute', top: '88.4%', left: `${CONTEUDO_X}%`, width: `${CONTEUDO_W}%`, height: '9%', border: '0.5px solid #000', fontSize: '1cqw', padding: '0.5%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <span style={{ fontWeight: 700 }}>Observações: </span>{observacoes}
        </div>
      </div>
    </div>
  );
}
