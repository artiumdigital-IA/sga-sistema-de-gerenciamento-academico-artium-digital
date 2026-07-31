'use client';

/**
 * Charts mínimos e reutilizáveis pro dashboard de Relatórios Master —
 * SVG puro, sem lib externa. Paleta categórica (6 slots, ordem fixa) validada
 * com o validador da skill de dataviz (luz e escuro, `validate_palette.js`);
 * hue sequencial único (azul) pra comparação de magnitude. Cores nunca vêm
 * antes da forma: barra horizontal p/ identidade/magnitude, empilhada p/
 * parte-do-todo, linha p/ tendência no tempo.
 */

// Ordem fixa — nunca ciclada. Definida via CSS var (light/dark já resolvidos
// pelo mecanismo de tema do próprio projeto, classe `html.dark-theme`).
export const CATEGORICAL_VARS = ['--viz-s1', '--viz-s2', '--viz-s3', '--viz-s4', '--viz-s5', '--viz-s6'];
export const SEQUENTIAL_VAR = '--viz-seq';

export function VizStyle() {
  return (
    <style>{`
      .viz-root {
        --viz-s1: #2a78d6; --viz-s2: #eb6834; --viz-s3: #1baf7a;
        --viz-s4: #eda100; --viz-s5: #e87ba4; --viz-s6: #008300;
        --viz-seq: #2a78d6;
        --viz-grid: #e1e0d9;
        --viz-ink-sec: var(--gray-500);
        --viz-ink-mut: var(--gray-400);
      }
      html.dark-theme .viz-root {
        --viz-s1: #3987e5; --viz-s2: #d95926; --viz-s3: #199e70;
        --viz-s4: #c98500; --viz-s5: #d55181; --viz-s6: #008300;
        --viz-seq: #3987e5;
        --viz-grid: #2c2c2a;
      }
    `}</style>
  );
}

interface BarDatum { label: string; value: number; }

/** Barra horizontal — 1 categoria por linha, rótulo direto + valor na ponta.
 * `palette`: array de cores (ordem fixa, uma por linha) ou undefined = usa o
 * hue sequencial único (comparação de magnitude, "mais escuro = mais"). */
export function HBarChart({
  data, palette, formatValue = (v: number) => v.toLocaleString('pt-BR'), height = 22,
}: { data: BarDatum[]; palette?: string[]; formatValue?: (v: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="viz-root" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <VizStyle />
      {data.map((d, i) => {
        const pct = Math.max(2, (d.value / max) * 100);
        const cor = palette ? `var(${palette[i % palette.length]})` : 'var(--viz-seq)';
        return (
          <div key={d.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--viz-ink-sec)', marginBottom: 3 }}>
              <span>{d.label}</span>
              <strong style={{ color: 'var(--gray-700)' }}>{formatValue(d.value)}</strong>
            </div>
            <div style={{ background: 'var(--gray-100)', borderRadius: 4, height }}>
              <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 4, minWidth: 4 }} />
            </div>
          </div>
        );
      })}
      {data.length === 0 && <p style={{ fontSize: 12, color: 'var(--viz-ink-mut)', margin: 0 }}>Sem dados.</p>}
    </div>
  );
}

/** Barra horizontal empilhada — parte-do-todo (2-3 segmentos), gap de 2px
 * entre segmentos (o espaçador, nunca um traço de borda), legenda obrigatória
 * (≥2 séries). */
export function StackedHBar({
  segments, formatValue = (v: number) => v.toLocaleString('pt-BR'), height = 24,
}: { segments: { label: string; value: number; colorVar: string }[]; formatValue?: (v: number) => string; height?: number }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  return (
    <div className="viz-root">
      <VizStyle />
      <div style={{ display: 'flex', gap: 2, height, borderRadius: 4, overflow: 'hidden', background: 'var(--gray-100)' }}>
        {segments.map(s => (
          <div key={s.label} title={`${s.label}: ${formatValue(s.value)}`}
            style={{ width: `${(s.value / total) * 100}%`, background: `var(${s.colorVar})`, minWidth: s.value > 0 ? 2 : 0 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--viz-ink-sec)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: `var(${s.colorVar})`, display: 'inline-block' }} />
            <span>{s.label}</span>
            <strong style={{ color: 'var(--gray-700)' }}>{formatValue(s.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Linha — tendência no tempo, 1 série, hue sequencial único. 2px de traço,
 * marcador ≥8px com anel de 2px na cor de superfície no último ponto,
 * rótulo direto só no ponto final (nunca um número em cada ponto). */
export function LineTrendChart({
  data, formatValue = (v: number) => v.toLocaleString('pt-BR'), width = 640, height = 160,
}: { data: { label: string; value: number }[]; formatValue?: (v: number) => string; width?: number; height?: number }) {
  const padL = 8, padR = 56, padT = 16, padB = 26;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const max = Math.max(1, ...data.map(d => d.value));
  const min = 0;
  const x = (i: number) => padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - min) / (max - min || 1)) * innerH;
  const pontos = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const gridSteps = 3;

  if (data.length === 0) return <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Sem dados.</p>;

  return (
    <div className="viz-root" style={{ overflowX: 'auto' }}>
      <VizStyle />
      <svg width={width} height={height} style={{ display: 'block' }}>
        {Array.from({ length: gridSteps + 1 }).map((_, i) => {
          const v = (max / gridSteps) * i;
          return (
            <g key={i}>
              <line x1={padL} x2={width - padR + 40} y1={y(v)} y2={y(v)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={width - padR + 46} y={y(v) + 4} fontSize={11} fill="var(--viz-ink-mut)">{formatValue(Math.round(v))}</text>
            </g>
          );
        })}
        <polyline points={pontos} fill="none" stroke="var(--viz-seq)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          return (
            <circle key={d.label} cx={x(i)} cy={y(d.value)} r={isLast ? 5 : 3}
              fill="var(--viz-seq)" stroke="var(--white)" strokeWidth={2}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </circle>
          );
        })}
        {data.length > 0 && (
          <text x={x(data.length - 1)} y={y(data[data.length - 1].value) - 10} fontSize={12} fontWeight={700}
            textAnchor="end" fill="var(--gray-700)">
            {formatValue(data[data.length - 1].value)}
          </text>
        )}
        {data.map((d, i) => (
          (data.length <= 8 || i % Math.ceil(data.length / 8) === 0) && (
            <text key={`lbl-${d.label}`} x={x(i)} y={height - 6} fontSize={10} fill="var(--viz-ink-mut)" textAnchor="middle">{d.label}</text>
          )
        ))}
      </svg>
    </div>
  );
}
