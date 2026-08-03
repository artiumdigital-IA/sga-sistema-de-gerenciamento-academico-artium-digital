'use client';
import { useState } from 'react';

export const VIZ_GOOD = '#0ca30c';
export const VIZ_CRITICAL = '#d03b3b';

interface TooltipState {
  x: number;
  y: number;
  lines: { label: string; value: string; color?: string }[];
}

function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div style={{ position: 'fixed', left: tip.x + 14, top: tip.y + 14, zIndex: 1000, background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '8px 10px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.18)', pointerEvents: 'none', minWidth: 120 }}>
      {tip.lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: i ? 4 : 0 }}>
          {l.color && <span style={{ width: 10, height: 2, background: l.color, display: 'inline-block', borderRadius: 1, flexShrink: 0 }} />}
          <span style={{ color: 'var(--gray-500)' }}>{l.label}:</span>
          <strong style={{ color: 'var(--gray-700)' }}>{l.value}</strong>
        </div>
      ))}
    </div>
  );
}

// Arredonda pra cima pro próximo "número redondo" (1/2/5 * 10^n) -- evita ticks tipo "R$ 1.234,56" no eixo.
function niceMax(v: number) {
  if (v <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const frac = v / exp;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * exp;
}

export interface BarSeriesDef { key: string; label: string; color: string; }
export interface BarGroupDatum { label: string; values: Record<string, number>; }

export function StackedBarChart({ data, series, height = 200, valueFormatter }: {
  data: BarGroupDatum[];
  series: BarSeriesDef[];
  height?: number;
  valueFormatter: (v: number) => string;
}) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  if (data.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Sem dados para este filtro.</div>;
  }

  const totals = data.map(d => series.reduce((s, sr) => s + (d.values[sr.key] || 0), 0));
  const maxTotal = niceMax(Math.max(1, ...totals));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxTotal);

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: 52, height, flexShrink: 0 }}>
          {ticks.map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 6, bottom: `${(t / maxTotal) * 100}%`, transform: 'translateY(50%)', textAlign: 'right', fontSize: 11, color: 'var(--gray-400)' }}>
              {valueFormatter(t)}
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, height, borderLeft: '1px solid var(--gray-300)', borderBottom: '1px solid var(--gray-300)' }}>
          {ticks.slice(1).map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(t / maxTotal) * 100}%`, borderTop: '1px solid var(--gray-200)' }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 6px' }}>
            {data.map((d, gi) => {
              const total = totals[gi];
              return (
                <div key={gi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / data.length}%`, maxWidth: 72 }}>
                  {total > 0 && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>{valueFormatter(total)}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column-reverse', width: 22 }}>
                    {series.map((sr, si) => {
                      const v = d.values[sr.key] || 0;
                      if (v <= 0) return null;
                      const h = (v / maxTotal) * height;
                      return (
                        <div
                          key={sr.key}
                          onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, lines: [{ label: d.label, value: '' }, { label: sr.label, value: valueFormatter(v), color: sr.color }] })}
                          onMouseLeave={() => setTip(null)}
                          style={{
                            height: Math.max(h, 2),
                            background: sr.color,
                            marginTop: si > 0 ? 2 : 0,
                            borderTopLeftRadius: si === series.length - 1 ? 4 : 0,
                            borderTopRightRadius: si === series.length - 1 ? 4 : 0,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', marginLeft: 52 }}>
        {data.map((d, i) => (
          <div key={i} title={d.label} style={{ width: `${100 / data.length}%`, maxWidth: 72, textAlign: 'center', fontSize: 11, color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '4px 2px 0' }}>
            {d.label}
          </div>
        ))}
      </div>
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {series.map(sr => (
            <div key={sr.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: sr.color, display: 'inline-block' }} />
              {sr.label}
            </div>
          ))}
        </div>
      )}
      <ChartTooltip tip={tip} />
    </div>
  );
}

export interface LinePoint { label: string; value: number; }

export function TrendLineChart({ data, height = 200, valueFormatter, color = 'var(--viz-blue)' }: {
  data: LinePoint[];
  height?: number;
  valueFormatter: (v: number) => string;
  color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Sem dados para este filtro.</div>;
  }

  const W = 640, H = height, PAD_L = 52, PAD_B = 8, PAD_T = 12, PAD_R = 12;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const maxVal = niceMax(Math.max(1, ...data.map(d => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxVal);
  const x = (i: number) => PAD_L + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - (v / maxVal) * plotH;
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPoints = `${x(0)},${PAD_T + plotH} ${points} ${x(data.length - 1)},${PAD_T + plotH}`;
  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const bandW = Math.max(plotW / data.length, 4);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--gray-200)" strokeWidth={1} />
            <text x={PAD_L - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--gray-400)">{valueFormatter(t)}</text>
          </g>
        ))}
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + plotH} stroke="var(--gray-300)" strokeWidth={1} />
        <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="var(--gray-300)" strokeWidth={1} />
        <polygon points={areaPoints} fill={color} fillOpacity={0.1} stroke="none" />
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH} stroke="var(--gray-400)" strokeWidth={1} />}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 4} fill={color} stroke="var(--white)" strokeWidth={2} />
            <rect
              x={x(i) - bandW / 2}
              y={PAD_T}
              width={bandW}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', marginLeft: PAD_L, marginRight: PAD_R }}>
        {data.map((d, i) => (
          <div key={i} title={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--gray-500)', visibility: i % labelStep === 0 || i === data.length - 1 ? 'visible' : 'hidden', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
      {hover !== null && (
        <div style={{ position: 'absolute', left: `${(x(hover) / W) * 100}%`, top: 0, transform: 'translateX(-50%)', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '6px 10px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.18)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5 }}>
          <div style={{ color: 'var(--gray-500)' }}>{data[hover].label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ width: 10, height: 2, background: color, display: 'inline-block' }} />
            <strong style={{ color: 'var(--gray-700)' }}>{valueFormatter(data[hover].value)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
