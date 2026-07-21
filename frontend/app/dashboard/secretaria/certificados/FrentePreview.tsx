'use client';
import { CARD } from './ui';

// Modelo padrão usado no preview enquanto o usuário não envia o template
// real (frente já assinada) — só pra dar uma referência visual, o PDF
// gerado de fato sempre usa o arquivo enviado em "Template (imagem de fundo)".
const BG_PADRAO = '/assets/bg-certificado-assinado.jpeg';

type TextOption = '1' | '2' | '3';

interface FrentePreviewProps {
  bgUrl: string | null;
  textOption: TextOption;
  mainSubject: string;
  timeData: string;
  semPeriodo: boolean;
  hours: string;
  semCargaHoraria: boolean;
  modality: string;
  certDate: string;
  nomeAluno: string;
  cargoAssinatura: string;
  secGeralName: string;
  reitora: string;
}

// Monta o corpo do texto como um parágrafo só (o navegador quebra linha
// sozinho) — o PDF de verdade (FrenteTab.gerar()) quebra linha manualmente
// com wrapText() pra caber no template, mas pro preview o conteúdo final é
// o que importa, não a quebra exata de linha.
function montarCorpo(opt: TextOption, mainSubject: string, modality: string, timeData: string, hours: string, semPeriodo: boolean, semCargaHoraria: boolean): string {
  const assunto = mainSubject || (opt === '2' ? '[nome do evento]' : '[nome do curso]');
  const periodo = timeData || '[período]';
  const carga = hours || '[carga horária]';

  if (opt === '1') {
    let s = `concluiu com êxito o ${assunto},`;
    if (semPeriodo && semCargaHoraria) s += ` na modalidade ${modality}.`;
    else if (semPeriodo) s += ` na modalidade ${modality}, com carga horária de ${carga}.`;
    else if (semCargaHoraria) s += ` na modalidade ${modality}, no período ${periodo}.`;
    else s += ` na modalidade ${modality}, no período ${periodo}, com carga horária de ${carga}.`;
    return s;
  }
  if (opt === '2') {
    if (semPeriodo && semCargaHoraria) return `participou do ${assunto}.`;
    if (semPeriodo) return `participou do ${assunto}, com carga horária de ${carga}.`;
    if (semCargaHoraria) return `participou do ${assunto}, realizado em ${periodo}.`;
    return `participou do ${assunto}, com carga horária de ${carga}, realizado em ${periodo}.`;
  }
  let s = `ministrou ${assunto},`;
  if (semPeriodo && semCargaHoraria) s += ` na modalidade ${modality}.`;
  else if (semPeriodo) s += ` na modalidade ${modality}, com carga horária de ${carga}.`;
  else if (semCargaHoraria) s += ` na modalidade ${modality}, no período ${periodo}.`;
  else s += ` na modalidade ${modality}, no período ${periodo}, com carga horária de ${carga}.`;
  return s;
}

export default function FrentePreview({
  bgUrl, textOption, mainSubject, timeData, semPeriodo, hours, semCargaHoraria, modality, certDate,
  nomeAluno, cargoAssinatura, secGeralName, reitora,
}: FrentePreviewProps) {
  const nome = nomeAluno || '[Nome do aluno]';
  const introTexto = textOption === '3'
    ? 'A Faculdade Instituto Rio de Janeiro, certifica que o Professor'
    : 'A Faculdade Instituto Rio de Janeiro, certifica que';
  const corpo = montarCorpo(textOption, mainSubject, modality, timeData, hours, semPeriodo, semCargaHoraria);

  return (
    <div style={CARD}>
      <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Pré-visualização (frente)</h2>
      <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--gray-400)' }}>Aproximação do layout — o PDF gerado ao clicar em &quot;Gerar Certificados&quot; é a versão oficial. Mostra o 1º nome da lista.</p>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '297 / 210',
          background: `#fff url(${bgUrl || BG_PADRAO}) center / cover no-repeat`,
          border: '1px solid #999',
          boxShadow: '0 2px 8px rgba(0,0,0,.12)',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111',
          overflow: 'hidden',
          containerType: 'inline-size',
        } as React.CSSProperties}
      >
        {!bgUrl && (
          <div style={{ position: 'absolute', top: '2%', left: 0, width: '100%', textAlign: 'center', fontSize: '1.1cqw', color: '#dc2626', fontWeight: 700 }}>
            Modelo padrão — envie o template (imagem de fundo) pra pré-visualizar com o arquivo real
          </div>
        )}

        <div style={{ position: 'absolute', top: '38%', left: '4.45%', width: '91.1%', textAlign: 'center' }}>
          <div style={{ fontSize: '2.15cqw', lineHeight: 1.35 }}>{introTexto}</div>
          <div style={{ fontSize: '2.5cqw', fontWeight: 700, lineHeight: 1.4, margin: '0.4% 0' }}>{nome}</div>
          <div style={{ fontSize: '1.65cqw', lineHeight: 1.35 }}>{corpo}</div>
          <div style={{ fontSize: '1.55cqw', marginTop: '1.5%' }}>Rio de Janeiro, {certDate || '[data]'}</div>
        </div>

        {[
          { left: '14.6%', nome: reitora, cargo: 'Reitora' },
          { left: '50%', nome, cargo: 'Discente' },
          { left: '85.4%', nome: secGeralName.trim() || 'Coordenador', cargo: cargoAssinatura },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: '82.5%', left: s.left, transform: 'translateX(-50%)', width: '22%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 6% 3%' }} />
            <div style={{ fontSize: '1.3cqw' }}>{s.nome}</div>
            <div style={{ fontSize: '1.3cqw', fontWeight: 700 }}>{s.cargo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
