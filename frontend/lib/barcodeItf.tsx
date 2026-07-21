/**
 * lib/barcodeItf.tsx — gerador de código de barras Interleaved 2-of-5 (ITF),
 * em SVG puro, sem dependência externa — mesma abordagem de lib/barcode.tsx
 * (Code 39, feito pra etiqueta de biblioteca), mas com a tabela de padrões e
 * o algoritmo de ITF, que é a simbologia usada no código de barras de boleto
 * bancário (44 dígitos numéricos, ver bancos/linha-digitavel.util.ts no
 * backend). Só aceita dígitos — outros caracteres quebram a simbologia.
 *
 * ITF codifica os dígitos em PARES: o 1º dígito do par vira as 5 barras, o
 * 2º dígito do par vira os 5 espaços intercalados entre elas — por isso o
 * número de dígitos precisa ser par (se vier ímpar, prefixa um '0').
 * Tabela de padrões é o padrão ITF universal (não varia por banco).
 *
 * IMPORTANTE: mesma ressalva do Code39Barcode — testar com leitor físico
 * antes de imprimir/enviar um boleto real.
 */

// 5 elementos por dígito, exatamente 2 largos ('W') e 3 estreitos ('N').
const PATTERNS: Record<string, string> = {
  '0': 'NNWWN', '1': 'WNNNW', '2': 'NWNNW', '3': 'WWNNN', '4': 'NNWNW',
  '5': 'WNWNN', '6': 'NWWNN', '7': 'NNNWW', '8': 'WNNWN', '9': 'NWNWN',
};

export function ItfBarcode({
  value,
  height = 50,
  narrowWidth = 1.4,
  wideRatio = 2.5,
  showText = false,
}: {
  value: string;
  height?: number;
  narrowWidth?: number;
  wideRatio?: number;
  showText?: boolean;
}) {
  const digitos = value.replace(/\D/g, '');
  const par = digitos.length % 2 === 0 ? digitos : `0${digitos}`;
  const wideWidth = narrowWidth * wideRatio;
  const w = (c: string) => (c === 'W' ? wideWidth : narrowWidth);

  let x = 0;
  const bars: React.ReactNode[] = [];
  const addBar = (largura: number) => {
    bars.push(<rect key={`${x}`} x={x} y={0} width={largura} height={height} fill="#000" />);
    x += largura;
  };
  const addSpace = (largura: number) => { x += largura; };

  // Start: bar,space,bar,space, todos estreitos.
  addBar(narrowWidth); addSpace(narrowWidth); addBar(narrowWidth); addSpace(narrowWidth);

  for (let i = 0; i < par.length; i += 2) {
    const padraoBarras = PATTERNS[par[i]];
    const padraoEspacos = PATTERNS[par[i + 1]];
    if (!padraoBarras || !padraoEspacos) continue; // dígito inválido, ignora o par
    for (let el = 0; el < 5; el++) {
      addBar(w(padraoBarras[el]));
      addSpace(w(padraoEspacos[el]));
    }
  }

  // Stop: barra larga, espaço estreito, barra estreita.
  addBar(wideWidth); addSpace(narrowWidth); addBar(narrowWidth);

  const totalWidth = Math.max(x, 1);
  const svgHeight = showText ? height + 16 : height;

  return (
    <svg width={totalWidth} height={svgHeight} viewBox={`0 0 ${totalWidth} ${svgHeight}`}>
      {bars}
      {showText && (
        <text x={totalWidth / 2} y={height + 13} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#000">
          {value}
        </text>
      )}
    </svg>
  );
}
