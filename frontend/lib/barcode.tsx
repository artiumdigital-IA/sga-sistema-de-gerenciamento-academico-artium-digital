/**
 * lib/barcode.tsx — gerador de código de barras Code 39 (Code 3 of 9), em
 * SVG puro, sem dependência externa (sandbox sem acesso ao registry do npm
 * pra instalar libs tipo jsbarcode/bwip-js). Code 39 é simples o bastante
 * pra implementar com uma tabela de padrões fixa, e é a simbologia mais
 * comum em etiquetas de tombamento de biblioteca/patrimônio.
 *
 * Suporta 0-9, A-Z (maiúsculas), espaço, e os símbolos - . $ / + %.
 * Caracteres fora desse conjunto são ignorados. O caractere de start/stop
 * '*' é adicionado automaticamente -- não incluir '*' no valor passado.
 *
 * IMPORTANTE: tabela de padrões escrita a partir do padrão ANSI/AIM Code 39
 * (cada caractere = 5 barras + 4 espaços, exatamente 3 elementos largos),
 * não gerada por uma lib validada externamente. Testar com um leitor físico
 * antes de imprimir um lote grande de etiquetas.
 */

// 9 elementos por caractere (barra,espaço,barra,espaço,barra,espaço,barra,espaço,barra).
// 'N' = traço estreito, 'W' = traço largo.
const PATTERNS: Record<string, string> = {
  '0': 'NNNWWNWNN', '1': 'WNNWNNNNW', '2': 'NNWWNNNNW', '3': 'WNWWNNNNN',
  '4': 'NNNWWNNNW', '5': 'WNNWWNNNN', '6': 'NNWWWNNNN', '7': 'NNNWNNWNW',
  '8': 'WNNWNNWNN', '9': 'NNWWNNWNN',
  A: 'WNNNNWNNW', B: 'NNWNNWNNW', C: 'WNWNNWNNN', D: 'NNNNWWNNW',
  E: 'WNNNWWNNN', F: 'NNWNWWNNN', G: 'NNNNNWWNW', H: 'WNNNNWWNN',
  I: 'NNWNNWWNN', J: 'NNNNWWWNN', K: 'WNNNNNNWW', L: 'NNWNNNNWW',
  M: 'WNWNNNNWN', N: 'NNNNWNNWW', O: 'WNNNWNNWN', P: 'NNWNWNNWN',
  Q: 'NNNNNNWWW', R: 'WNNNNNWWN', S: 'NNWNNNWWN', T: 'NNNNWNWWN',
  U: 'WWNNNNNNW', V: 'NWWNNNNNW', W: 'WWWNNNNNN', X: 'NWNNWNNNW',
  Y: 'WWNNWNNNN', Z: 'NWWNWNNNN',
  '-': 'NWNNNNWNW', '.': 'WWNNNNWNN', ' ': 'NWWNNNWNN',
  $: 'NWNWNWNNN', '/': 'NWNWNNNWN', '+': 'NWNNNWNWN', '%': 'NNNWNWNWN',
  '*': 'NWNNWNWNN',
};

export function Code39Barcode({
  value,
  height = 50,
  narrowWidth = 2,
  wideRatio = 2.5,
  showText = true,
}: {
  value: string;
  height?: number;
  narrowWidth?: number;
  wideRatio?: number;
  showText?: boolean;
}) {
  const conteudo = `*${value.toUpperCase()}*`;
  const wideWidth = narrowWidth * wideRatio;
  let x = 0;
  const bars: React.ReactNode[] = [];

  for (const char of conteudo) {
    const pattern = PATTERNS[char];
    if (!pattern) continue; // caractere não suportado por Code 39, ignora
    for (let i = 0; i < pattern.length; i++) {
      const isBar = i % 2 === 0; // índices pares = barra, ímpares = espaço
      const w = pattern[i] === 'W' ? wideWidth : narrowWidth;
      if (isBar) {
        bars.push(<rect key={`${x}-${i}`} x={x} y={0} width={w} height={height} fill="#000" />);
      }
      x += w;
    }
    x += narrowWidth; // espaço estreito entre caracteres
  }

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
