'use client';
import { useEffect, useState } from 'react';
import { INPUT, LBL, BTN_P, CARD, CHECK_LABEL } from './ui';
import FrentePreview from './FrentePreview';

type TextOption = '1' | '2' | '3';
type Modalidade = 'Presencial' | 'Online' | 'Híbrido';
type Cargo = 'Secretária Geral' | 'Coordenador(a)';

const REITORA = 'Dra. Carla Dolezel Trindade';

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LBL}>{label}</label>{children}</div>;
}

// Quebra texto centralizado em várias linhas respeitando a largura máxima —
// mesma lógica do gerador original, portada 1:1 (mexer na matemática aqui
// desalinha o texto dentro do template de fundo).
function wrapText(doc: any, text: string, cx: number, startY: number, lineHeight: number, maxWidth: number): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (doc.getTextWidth(test) > maxWidth) {
      doc.text(line, cx, y, { align: 'center' });
      y += lineHeight;
      line = word;
    } else {
      line = test;
    }
  });
  if (line) {
    doc.text(line, cx, y, { align: 'center' });
    y += lineHeight;
  }
  return y;
}

export default function FrenteTab() {
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [textOption, setTextOption] = useState<TextOption>('1');
  const [mainSubject, setMainSubject] = useState('');
  const [timeData, setTimeData] = useState('');
  const [semPeriodo, setSemPeriodo] = useState(false);
  const [hours, setHours] = useState('');
  const [semCargaHoraria, setSemCargaHoraria] = useState(false);
  const [modality, setModality] = useState<Modalidade>('Presencial');
  const [certDate, setCertDate] = useState('');
  const [studentList, setStudentList] = useState('');
  const [cargoAssinatura, setCargoAssinatura] = useState<Cargo>('Secretária Geral');
  const [secGeralName, setSecGeralName] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);

  // object URL só pra pré-visualização — criado/revogado a cada troca de
  // arquivo pra não vazar memória (blob URL fica vivo até revogar).
  useEffect(() => {
    if (!bgFile) { setBgPreviewUrl(null); return; }
    const url = URL.createObjectURL(bgFile);
    setBgPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bgFile]);

  const lblSubject = textOption === '2' ? 'Nome do Evento' : 'Nome do Curso';
  const lblTime = textOption === '2' ? 'Data do Evento' : 'Período (Início e Fim)';

  async function gerar() {
    setErro('');
    if (!bgFile) { setErro('Selecione a imagem de fundo (template do certificado).'); return; }
    const names = studentList.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) { setErro('Digite pelo menos um nome na lista.'); return; }

    // Abre a aba já aqui, ainda dentro do clique síncrono do usuário — se
    // esperar o PDF terminar de ser montado (import dinâmico + leitura do
    // arquivo de imagem) pra só então chamar window.open(), o navegador
    // pode tratar como popup não solicitado e bloquear silenciosamente.
    const novaAba = window.open('', '_blank');

    setGerando(true);
    try {
      // Import dinâmico — jsPDF só existe no browser, importar no topo do
      // arquivo quebraria a renderização no servidor (Next.js SSR).
      const { jsPDF } = await import('jspdf');
      const bgData = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = reject;
        fr.readAsDataURL(bgFile);
      });
      const formatoImagem = bgFile.type.includes('png') ? 'PNG' : 'JPEG';

      const doc = new jsPDF('l', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const cx = w / 2;
      const margin = 50 * 0.264583; // 50px → mm
      const maxWidth = w - 2 * margin;
      const introLineHeight = 13;
      const compactLineHeight = 9;

      names.forEach((name, i) => {
        if (i > 0) doc.addPage();
        doc.addImage(bgData, formatoImagem, 0, 0, w, h);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(18);
        let y = textOption === '3'
          ? wrapText(doc, 'A Faculdade Instituto Rio de Janeiro, certifica que o Professor', cx, 80, introLineHeight, maxWidth)
          : wrapText(doc, 'A Faculdade Instituto Rio de Janeiro, certifica que', cx, 80, introLineHeight, maxWidth);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(19.6);
        doc.text(name, cx, y + 5, { align: 'center' });
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12.6);

        if (textOption === '1') {
          y = wrapText(doc, `concluiu com êxito o ${mainSubject},`, cx, y, compactLineHeight, maxWidth);
          if (semPeriodo && semCargaHoraria) y = wrapText(doc, `na modalidade ${modality}.`, cx, y, compactLineHeight, maxWidth);
          else if (semPeriodo) y = wrapText(doc, `na modalidade ${modality}, com carga horária de ${hours}.`, cx, y, compactLineHeight, maxWidth);
          else if (semCargaHoraria) y = wrapText(doc, `na modalidade ${modality}, no período ${timeData}.`, cx, y, compactLineHeight, maxWidth);
          else y = wrapText(doc, `na modalidade ${modality}, no período ${timeData}, com carga horária de ${hours}.`, cx, y, compactLineHeight, maxWidth);
        } else if (textOption === '2') {
          if (semPeriodo && semCargaHoraria) {
            y = wrapText(doc, `participou do ${mainSubject}.`, cx, y, compactLineHeight, maxWidth);
          } else if (semPeriodo) {
            y = wrapText(doc, `participou do ${mainSubject}, com carga horária de ${hours}.`, cx, y, compactLineHeight, maxWidth);
          } else if (semCargaHoraria) {
            y = wrapText(doc, `participou do ${mainSubject},`, cx, y, compactLineHeight, maxWidth);
            y = wrapText(doc, `realizado em ${timeData}.`, cx, y, compactLineHeight, maxWidth);
          } else {
            y = wrapText(doc, `participou do ${mainSubject}, com carga horária de ${hours},`, cx, y, compactLineHeight, maxWidth);
            y = wrapText(doc, `realizado em ${timeData}.`, cx, y, compactLineHeight, maxWidth);
          }
        } else {
          y = wrapText(doc, `ministrou ${mainSubject},`, cx, y, compactLineHeight, maxWidth);
          if (semPeriodo && semCargaHoraria) y = wrapText(doc, `na modalidade ${modality}.`, cx, y, compactLineHeight, maxWidth);
          else if (semPeriodo) y = wrapText(doc, `na modalidade ${modality}, com carga horária de ${hours}.`, cx, y, compactLineHeight, maxWidth);
          else if (semCargaHoraria) y = wrapText(doc, `na modalidade ${modality}, no período ${timeData}.`, cx, y, compactLineHeight, maxWidth);
          else {
            y = wrapText(doc, `na modalidade ${modality}, no período ${timeData},`, cx, y, compactLineHeight, maxWidth);
            y = wrapText(doc, `com carga horária de ${hours}.`, cx, y, compactLineHeight, maxWidth);
          }
        }

        doc.setFontSize(12);
        doc.text(`Rio de Janeiro, ${certDate}`, cx, y + 10, { align: 'center' });

        const sigY = 178;
        const lw = 65;
        const sL = cx - 105;
        const sC = cx;
        const sR = cx + 105;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(sL - lw / 2, sigY, sL + lw / 2, sigY);
        doc.line(sC - lw / 2, sigY, sC + lw / 2, sigY);
        doc.line(sR - lw / 2, sigY, sR + lw / 2, sigY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(REITORA, sL, sigY + 6, { align: 'center' });
        doc.text(name, sC, sigY + 6, { align: 'center' });
        doc.text(secGeralName.trim() || 'Coordenador', sR, sigY + 6, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text('Reitora', sL, sigY + 13, { align: 'center' });
        doc.text('Discente', sC, sigY + 13, { align: 'center' });
        doc.text(cargoAssinatura, sR, sigY + 13, { align: 'center' });
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
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
    <div style={{ flex: '1 1 480px', minWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>1. Configuração Básica</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <F label="Template (imagem de fundo) *">
            <input type="file" accept="image/*" onChange={e => setBgFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12 }} />
            {bgFile && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--gray-500)' }}>{bgFile.name}</p>}
          </F>
          <F label="Modelo de Texto">
            <select style={INPUT} value={textOption} onChange={e => setTextOption(e.target.value as TextOption)}>
              <option value="1">Conclusão de Curso (Aluno)</option>
              <option value="2">Participação em Evento</option>
              <option value="3">Certificado do Professor</option>
            </select>
          </F>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>2. Dados do Certificado</h2>
        <div style={{ marginBottom: 12 }}>
          <F label={lblSubject}>
            <input style={INPUT} value={mainSubject} onChange={e => setMainSubject(e.target.value)} />
          </F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <F label={lblTime}>
              <input style={{ ...INPUT, opacity: semPeriodo ? 0.5 : 1 }} value={timeData} disabled={semPeriodo} onChange={e => setTimeData(e.target.value)} />
            </F>
            <label style={CHECK_LABEL}>
              <input type="checkbox" checked={semPeriodo} onChange={e => setSemPeriodo(e.target.checked)} />
              Sem período
            </label>
          </div>
          <div>
            <F label="Carga Horária">
              <input style={{ ...INPUT, opacity: semCargaHoraria ? 0.5 : 1 }} value={hours} disabled={semCargaHoraria} onChange={e => setHours(e.target.value)} />
            </F>
            <label style={CHECK_LABEL}>
              <input type="checkbox" checked={semCargaHoraria} onChange={e => setSemCargaHoraria(e.target.checked)} />
              Sem carga horária
            </label>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <F label="Modalidade">
            <select style={INPUT} value={modality} onChange={e => setModality(e.target.value as Modalidade)}>
              <option>Presencial</option>
              <option>Online</option>
              <option>Híbrido</option>
            </select>
          </F>
          <F label="Data de Emissão">
            <input style={INPUT} placeholder="Ex.: 20 de julho de 2026" value={certDate} onChange={e => setCertDate(e.target.value)} />
          </F>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>3. Lista de Nomes</h2>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--gray-500)' }}>Um nome por linha — gera uma página de certificado por nome, tudo no mesmo PDF.</p>
        <textarea style={{ ...INPUT, minHeight: 110, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} value={studentList} onChange={e => setStudentList(e.target.value)} placeholder={'Fulano de Tal\nCiclana da Silva'} />
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>4. Assinaturas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <F label="Reitora (pré-definida)">
            <input style={{ ...INPUT, background: 'var(--gray-50)', color: 'var(--gray-500)' }} value={REITORA} readOnly />
          </F>
          <div>
            <F label="Cargo da 3ª assinatura">
              <select style={{ ...INPUT, marginBottom: 6 }} value={cargoAssinatura} onChange={e => setCargoAssinatura(e.target.value as Cargo)}>
                <option value="Secretária Geral">Secretária Geral</option>
                <option value="Coordenador(a)">Coordenador(a)</option>
              </select>
            </F>
            <input style={INPUT} placeholder="Ex.: Raquel Manhães" value={secGeralName} onChange={e => setSecGeralName(e.target.value)} />
          </div>
        </div>
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 12.5, margin: 0 }}>{erro}</p>}
      <button style={{ ...BTN_P, alignSelf: 'flex-start', opacity: gerando ? 0.6 : 1 }} disabled={gerando} onClick={gerar}>
        {gerando ? 'Gerando...' : 'Gerar Certificados (PDF)'}
      </button>
    </div>

    <div style={{ flex: '1 1 460px', minWidth: 400, position: 'sticky', top: 16 }}>
      <FrentePreview
        bgUrl={bgPreviewUrl}
        textOption={textOption}
        mainSubject={mainSubject}
        timeData={timeData}
        semPeriodo={semPeriodo}
        hours={hours}
        semCargaHoraria={semCargaHoraria}
        modality={modality}
        certDate={certDate}
        nomeAluno={studentList.split('\n').map(n => n.trim()).filter(Boolean)[0] ?? ''}
        cargoAssinatura={cargoAssinatura}
        secGeralName={secGeralName}
        reitora={REITORA}
      />
    </div>
    </div>
  );
}
