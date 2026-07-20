'use client';
import { useState } from 'react';
import { INPUT, LBL, BTN_P, BTN_G, BTN_D, CARD } from './ui';

interface AlunoRow { nome: string; cpf: string; numeroRegistro: string; numeroLivro: string; numeroFolha: string; }
interface DisciplinaRow { disciplina: string; ch: string; freq: string; nota: string; professor: string; titulacao: string; }

type TipoRegistroBloco2 = 'SEM_REGISTRO' | 'COM_REGISTRO';

const ALUNO_VAZIO: AlunoRow = { nome: '', cpf: '', numeroRegistro: '', numeroLivro: '', numeroFolha: '' };

function montarBloco2(tipo: TipoRegistroBloco2, bloco2Texto: string, aluno: AlunoRow): string {
  if (tipo !== 'COM_REGISTRO') return bloco2Texto;
  return `Certificado registrado sob o n° ${aluno.numeroRegistro || '_'} no livro n° ${aluno.numeroLivro || '_'} folha n° ${aluno.numeroFolha || '_'} lei nº 9.394 de 20/12/1996, que estabelece as Diretrizes e Bases da Educação Nacional.`;
}

const TH: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 11.5, borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' };
const TD: React.CSSProperties = { padding: '2px 6px', borderBottom: '1px solid var(--gray-100)' };
const CELL_INPUT: React.CSSProperties = { width: '100%', border: 'none', background: 'transparent', color: 'var(--gray-700)', fontSize: 12.5, padding: '5px 2px', fontFamily: 'inherit' };

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LBL}>{label}</label>{children}</div>;
}

// Desenha uma caixa lateral com título (negrito) + texto — mesma lógica do
// gerador original; mexer nos números aqui desalinha as 3 caixas da lateral.
function textoCaixa(doc: any, titulo: string, texto: string, x: number, y: number, largura: number, altura: number, mostrarBorda = true) {
  if (mostrarBorda) doc.rect(x, y, largura, altura);
  doc.setFont('times', 'bold');
  doc.setFontSize(7);
  if (titulo) doc.text(titulo, x + largura / 2, y + 5, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  const linhas = doc.splitTextToSize(texto || '', largura - 7);
  doc.text(linhas, x + 4, y + (titulo ? 12 : 6));
}

export default function VersoTab() {
  const [cabecalhoSuperior, setCabecalhoSuperior] = useState('Instituto Universitário do Rio de Janeiro - IURJ');
  const [instituicao, setInstituicao] = useState('FACULDADE INSTITUTO RIO DE JANEIRO');
  const [cabecalhoPortaria, setCabecalhoPortaria] = useState('Portaria MEC de Credenciamento Nº. 501, de 08/07/2021, D.O.U. de 09/07/2021.');
  const [curso, setCurso] = useState('');
  const [areaConhecimento, setAreaConhecimento] = useState('');
  const [cargaTotal, setCargaTotal] = useState('');
  const [periodoRealizacao, setPeriodoRealizacao] = useState('');

  const [bloco1Titulo, setBloco1Titulo] = useState('Título');
  const [bloco1Texto, setBloco1Texto] = useState('Texto');
  const [bloco2Titulo, setBloco2Titulo] = useState('Título');
  const [bloco2Texto, setBloco2Texto] = useState('Texto');
  const [bloco3Titulo, setBloco3Titulo] = useState('');
  const [bloco3Texto, setBloco3Texto] = useState('');
  const [tipoRegistroBloco2, setTipoRegistroBloco2] = useState<TipoRegistroBloco2>('SEM_REGISTRO');
  const comRegistro = tipoRegistroBloco2 === 'COM_REGISTRO';

  const [alunos, setAlunos] = useState<AlunoRow[]>([{ nome: '', cpf: '', numeroRegistro: '', numeroLivro: '', numeroFolha: '' }]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([{ disciplina: '', ch: '', freq: '100%', nota: '10', professor: '', titulacao: '' }]);
  const [observacoes, setObservacoes] = useState('Texto');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');

  function atualizarAluno(i: number, campo: keyof AlunoRow, v: string) {
    setAlunos(rows => rows.map((r, idx) => (idx === i ? { ...r, [campo]: v } : r)));
  }
  function atualizarDisciplina(i: number, campo: keyof DisciplinaRow, v: string) {
    setDisciplinas(rows => rows.map((r, idx) => (idx === i ? { ...r, [campo]: v } : r)));
  }

  async function gerar() {
    setErro('');
    const alunosValidos = alunos.filter(a => a.nome.trim());
    if (alunosValidos.length === 0) { setErro('Adicione pelo menos um aluno.'); return; }
    const disciplinasValidas = disciplinas.filter(d => d.disciplina.trim());

    // Abre a aba já aqui, ainda dentro do clique síncrono do usuário — se
    // esperar o PDF terminar de ser montado (import dinâmico do jsPDF/
    // autoTable) pra só então chamar window.open(), o navegador pode tratar
    // como popup não solicitado e bloquear silenciosamente.
    const novaAba = window.open('', '_blank');

    setGerando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const pxParaMm = 25.4 / 96;
      const bordaMm = 20 * pxParaMm;
      const margem = bordaMm;
      const lateralW = 62 - 10 * pxParaMm;
      const gap = 4;
      const conteudoX = margem + lateralW + gap;
      const conteudoW = w - conteudoX - margem;

      alunosValidos.forEach((aluno, idx) => {
        if (idx > 0) doc.addPage();
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);

        const boxGap = 2;
        const box1Y = 24;
        const box1H = 22 + 50 * pxParaMm;
        const box2Y = box1Y + box1H + boxGap;
        const box2H = 105 - 50 * pxParaMm;
        const box3Y = box2Y + box2H + boxGap;
        const box3H = 40 + 30 * pxParaMm;

        textoCaixa(doc, bloco1Titulo, bloco1Texto, margem, box1Y, lateralW, box1H);
        textoCaixa(doc, bloco2Titulo, montarBloco2(tipoRegistroBloco2, bloco2Texto, aluno), margem, box2Y, lateralW, box2H);
        textoCaixa(doc, bloco3Titulo, bloco3Texto, margem, box3Y, lateralW, box3H, false);

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(cabecalhoSuperior || 'Instituto Universitário do Rio de Janeiro - IURJ', w / 2, 10, { align: 'center' });

        doc.setFont('times', 'bold');
        doc.setFontSize(17);
        doc.text(instituicao || 'FACULDADE INSTITUTO RIO DE JANEIRO', w / 2, 18, { align: 'center' });

        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.text(cabecalhoPortaria, w / 2, 26, { align: 'center' });

        doc.setFontSize(7);
        const topY = 35;
        const colunasTopo = [
          { rotulo: 'Curso', texto: curso, x: conteudoX },
          { rotulo: 'Área de Conhecimento', texto: areaConhecimento, x: conteudoX + 82 },
          { rotulo: 'Carga horária total', texto: cargaTotal, x: conteudoX + 151 },
          { rotulo: 'Período de Realização', texto: periodoRealizacao, x: conteudoX + 193 },
        ];
        colunasTopo.forEach(coluna => {
          doc.setFont('times', 'bold');
          doc.text(coluna.rotulo, coluna.x, topY);
          doc.setFont('times', 'normal');
          doc.text(doc.splitTextToSize(coluna.texto || '', 58), coluna.x, topY + 5);
        });

        const alunoShiftY = 100 * pxParaMm;
        const alunoY = 76 - alunoShiftY;
        doc.setFont('times', 'bold');
        doc.text('Aluno(a)', conteudoX, alunoY);
        doc.text('CPF', conteudoX + 74, alunoY);
        doc.setFont('times', 'normal');
        doc.text(doc.splitTextToSize(aluno.nome, 68), conteudoX, alunoY + 5);
        doc.text(aluno.cpf || '', conteudoX + 74, alunoY + 5);

        autoTable(doc, {
          startY: 84 - alunoShiftY,
          margin: { left: conteudoX, right: margem },
          tableWidth: conteudoW,
          head: [['DISCIPLINA', 'CH (H/A)', 'FREQ', 'NOTA', 'PROFESSOR', 'TITULAÇÃO']],
          body: disciplinasValidas.map(d => [d.disciplina, d.ch, d.freq, d.nota, d.professor, d.titulacao]),
          theme: 'plain',
          styles: { font: 'times', fontSize: 6.7, cellPadding: { top: 1, right: 1.3, bottom: 1, left: 1.3 }, textColor: [0, 0, 0], lineColor: [255, 255, 255], lineWidth: 0 },
          headStyles: { fillColor: [205, 205, 205], textColor: [0, 0, 0], fontStyle: 'normal', halign: 'center' },
          columnStyles: {
            0: { cellWidth: 75 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 62 },
            5: { cellWidth: conteudoW - 193 },
          },
        });

        const obsH = 19;
        const obsBottomMargin = 20 * pxParaMm;
        const obsY = h - obsBottomMargin - obsH;
        doc.rect(conteudoX, obsY, conteudoW, obsH);
        doc.setFont('times', 'bold');
        doc.setFontSize(7);
        doc.text('Observações:', conteudoX + 3, obsY + 5);
        doc.setFont('times', 'normal');
        doc.text(doc.splitTextToSize(observacoes, conteudoW - 7), conteudoX + 3, obsY + 10);
      });

      const blobUrl = URL.createObjectURL(doc.output('blob'));
      if (novaAba) novaAba.location.href = blobUrl;
      else window.open(blobUrl); // navegador bloqueou a 1ª tentativa (aba em branco) — tenta de novo mesmo assim
    } catch (e: any) {
      novaAba?.close();
      setErro(e?.message ?? 'Erro ao gerar os certificados.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Cabeçalho e Dados do Curso</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <F label="Texto superior"><input style={INPUT} value={cabecalhoSuperior} onChange={e => setCabecalhoSuperior(e.target.value)} /></F>
          <F label="Instituição"><input style={INPUT} value={instituicao} onChange={e => setInstituicao(e.target.value)} /></F>
          <div style={{ gridColumn: '1 / -1' }}>
            <F label="Portaria"><input style={INPUT} value={cabecalhoPortaria} onChange={e => setCabecalhoPortaria(e.target.value)} /></F>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <F label="Curso"><input style={INPUT} value={curso} onChange={e => setCurso(e.target.value)} placeholder="Ex.: PÓS-GRADUAÇÃO LATO SENSU - ..." /></F>
          </div>
          <F label="Área de Conhecimento"><input style={INPUT} value={areaConhecimento} onChange={e => setAreaConhecimento(e.target.value)} /></F>
          <F label="Carga horária total"><input style={INPUT} value={cargaTotal} onChange={e => setCargaTotal(e.target.value)} placeholder="Ex.: 360 H/A" /></F>
          <F label="Período de Realização"><input style={INPUT} value={periodoRealizacao} onChange={e => setPeriodoRealizacao(e.target.value)} placeholder="Ex.: 2023 a 2024" /></F>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Blocos Laterais</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { titulo: bloco1Titulo, setTitulo: setBloco1Titulo, texto: bloco1Texto, setTexto: setBloco1Texto, n: 1 },
            { titulo: bloco2Titulo, setTitulo: setBloco2Titulo, texto: bloco2Texto, setTexto: setBloco2Texto, n: 2 },
            { titulo: bloco3Titulo, setTitulo: setBloco3Titulo, texto: bloco3Texto, setTexto: setBloco3Texto, n: 3 },
          ].map(b => (
            <div key={b.n}>
              <F label={`Título do bloco ${b.n}`}><input style={{ ...INPUT, marginBottom: 8 }} value={b.titulo} onChange={e => b.setTitulo(e.target.value)} /></F>
              {b.n === 2 ? (
                <div>
                  <label style={LBL}>Texto do bloco 2</label>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gray-700)', cursor: 'pointer' }}>
                      <input type="radio" name="tipoRegistroBloco2" checked={!comRegistro} onChange={() => setTipoRegistroBloco2('SEM_REGISTRO')} />
                      Sem registro
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gray-700)', cursor: 'pointer' }}>
                      <input type="radio" name="tipoRegistroBloco2" checked={comRegistro} onChange={() => setTipoRegistroBloco2('COM_REGISTRO')} />
                      Com registro
                    </label>
                  </div>
                  {comRegistro ? (
                    <>
                      <textarea style={{ ...INPUT, minHeight: 72, resize: 'vertical', fontFamily: 'inherit', background: 'var(--gray-50)', color: 'var(--gray-500)' }} value={montarBloco2('COM_REGISTRO', bloco2Texto, alunos[0] ?? ALUNO_VAZIO)} readOnly />
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--gray-400)' }}>Pré-visualização com os dados do 1º aluno da tabela abaixo — cada aluno usa os próprios números (colunas Nº / Nº do Livro / Nº da Folha) na hora de gerar.</p>
                    </>
                  ) : (
                    <textarea style={{ ...INPUT, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }} value={bloco2Texto} onChange={e => setBloco2Texto(e.target.value)} />
                  )}
                </div>
              ) : (
                <F label={`Texto do bloco ${b.n}`}><textarea style={{ ...INPUT, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }} value={b.texto} onChange={e => b.setTexto(e.target.value)} /></F>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Alunos</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Aluno(a)</th>
                <th style={TH}>CPF</th>
                {comRegistro && <th style={TH}>Nº</th>}
                {comRegistro && <th style={TH}>Nº do Livro</th>}
                {comRegistro && <th style={TH}>Nº da Folha</th>}
                <th style={{ ...TH, width: 46 }}></th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((a, i) => (
                <tr key={i}>
                  <td style={TD}><input style={CELL_INPUT} value={a.nome} placeholder="Nome do aluno" onChange={e => atualizarAluno(i, 'nome', e.target.value)} /></td>
                  <td style={TD}><input style={CELL_INPUT} value={a.cpf} placeholder="000.000.000-00" onChange={e => atualizarAluno(i, 'cpf', e.target.value)} /></td>
                  {comRegistro && <td style={TD}><input style={{ ...CELL_INPUT, width: 70 }} value={a.numeroRegistro} placeholder="nº" onChange={e => atualizarAluno(i, 'numeroRegistro', e.target.value)} /></td>}
                  {comRegistro && <td style={TD}><input style={{ ...CELL_INPUT, width: 70 }} value={a.numeroLivro} placeholder="nº do livro" onChange={e => atualizarAluno(i, 'numeroLivro', e.target.value)} /></td>}
                  {comRegistro && <td style={TD}><input style={{ ...CELL_INPUT, width: 70 }} value={a.numeroFolha} placeholder="nº da folha" onChange={e => atualizarAluno(i, 'numeroFolha', e.target.value)} /></td>}
                  <td style={TD}><button style={BTN_D} onClick={() => setAlunos(rows => rows.filter((_, idx) => idx !== i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={{ ...BTN_G, marginTop: 10 }} onClick={() => setAlunos(rows => [...rows, { nome: '', cpf: '', numeroRegistro: '', numeroLivro: '', numeroFolha: '' }])}>+ Adicionar aluno</button>
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Disciplinas</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Disciplina', 'CH (H/A)', 'Freq.', 'Nota', 'Professor', 'Titulação', ''].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((d, i) => (
                <tr key={i}>
                  <td style={TD}><input style={CELL_INPUT} value={d.disciplina} placeholder="Disciplina" onChange={e => atualizarDisciplina(i, 'disciplina', e.target.value)} /></td>
                  <td style={TD}><input style={{ ...CELL_INPUT, width: 60 }} value={d.ch} placeholder="60" onChange={e => atualizarDisciplina(i, 'ch', e.target.value)} /></td>
                  <td style={TD}><input style={{ ...CELL_INPUT, width: 54 }} value={d.freq} placeholder="100%" onChange={e => atualizarDisciplina(i, 'freq', e.target.value)} /></td>
                  <td style={TD}><input style={{ ...CELL_INPUT, width: 46 }} value={d.nota} placeholder="10" onChange={e => atualizarDisciplina(i, 'nota', e.target.value)} /></td>
                  <td style={TD}><input style={CELL_INPUT} value={d.professor} placeholder="Professor" onChange={e => atualizarDisciplina(i, 'professor', e.target.value)} /></td>
                  <td style={TD}><input style={CELL_INPUT} value={d.titulacao} placeholder="Titulação" onChange={e => atualizarDisciplina(i, 'titulacao', e.target.value)} /></td>
                  <td style={TD}><button style={BTN_D} onClick={() => setDisciplinas(rows => rows.filter((_, idx) => idx !== i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={{ ...BTN_G, marginTop: 10 }} onClick={() => setDisciplinas(rows => [...rows, { disciplina: '', ch: '', freq: '100%', nota: '10', professor: '', titulacao: '' }])}>+ Adicionar disciplina</button>
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Observações</h2>
        <textarea style={{ ...INPUT, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 12.5, margin: 0 }}>{erro}</p>}
      <button style={{ ...BTN_P, alignSelf: 'flex-start', opacity: gerando ? 0.6 : 1 }} disabled={gerando} onClick={gerar}>
        {gerando ? 'Gerando...' : 'Gerar Certificados (PDF)'}
      </button>
      <p style={{ fontSize: 11.5, color: 'var(--gray-400)', margin: 0 }}>Será gerado um PDF com uma página de verso por aluno cadastrado.</p>
    </div>
  );
}
