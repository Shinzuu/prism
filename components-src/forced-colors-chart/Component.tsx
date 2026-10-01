import { useEffect, useState } from 'react';

export type ChartSeries = {
  name: string;
  /** SVG dash array; '' is a solid line. */
  dash: string;
  /** Marker shape: 0 circle, 1 square, 2 triangle, 3 diamond. */
  marker: 0 | 1 | 2 | 3;
  data: number[];
};

/* Every series carries THREE encodings at once — colour, dash pattern and
   marker shape — and all three are always on. Switching encoding on inside a
   forced-colors media query means the encoding that matters is the one nobody
   ever looks at, so it is wrong and stays wrong. */
const DEFAULT_SERIES: ChartSeries[] = [
  { name: 'us-east', dash: '', marker: 0, data: [4.1, 3.8, 3.9, 3.2, 2.8, 2.9, 2.4, 2.2, 2.3, 1.9, 1.7, 1.6] },
  { name: 'eu-central', dash: '5 3', marker: 1, data: [2.2, 2.4, 2.1, 2.6, 2.9, 3.4, 3.1, 3.6, 3.9, 4.2, 4.0, 4.4] },
  { name: 'ap-south', dash: '2 2', marker: 2, data: [5.4, 5.1, 4.6, 4.9, 4.2, 3.8, 3.9, 3.3, 3.0, 3.1, 2.7, 2.5] },
  { name: 'sa-east', dash: '7 2 2 2', marker: 3, data: [1.4, 1.6, 1.9, 1.7, 2.1, 2.0, 2.4, 2.2, 2.6, 2.5, 2.9, 3.1] },
];
const DEFAULT_ARIA_LABEL = 'Error rate over twelve weeks for four regions. Values are also listed in the table below.';
const W = 320, H = 120, PAD = 10;
// Hue rotates around the site accent; lightness and chroma are inherited.
const hue = (i: number) => `oklch(from var(--accent) l c calc(h + ${i * 62}))`;

export interface ForcedColorsChartProps {
  /** Lines to plot; every series should have the same number of points. */
  series?: ChartSeries[];
  /** Heading above the chart. */
  title?: string;
  /** Top of the y axis; larger values are clipped to it. */
  max?: number;
  /** Accessible description of the chart image. */
  ariaLabel?: string;
  /** Header of the series column in the values table. */
  seriesHeader?: string;
  /** Header of each point column in the values table, from its zero-based index. */
  pointLabel?: (index: number) => string;
  /** Called when the forced-colours simulation is switched on or off. */
  onToggle?: (simulated: boolean) => void;
  /** Disables the simulation toggle. */
  disabled?: boolean;
  /** Extra classes for the root element. */
  className?: string;
}

const defaultPointLabel = (i: number) => `w${i + 1}`;

export default function ForcedColorsChart({
  series = DEFAULT_SERIES,
  title = 'Error rate by region',
  max = 6,
  ariaLabel = DEFAULT_ARIA_LABEL,
  seriesHeader = 'region',
  pointLabel = defaultPointLabel,
  onToggle,
  disabled = false,
  className = '',
}: ForcedColorsChartProps) {
  const [forced, setForced] = useState(false);
  const [systemForced, setSystemForced] = useState(false);
  useEffect(() => { setSystemForced(matchMedia('(forced-colors: active)').matches); }, []);

  const lastIndex = Math.max(1, (series[0]?.data.length ?? 12) - 1);
  const x = (i: number) => PAD + (i / lastIndex) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (Math.min(v, max) / max) * (H - PAD * 2);

  const toggle = () => {
    const next = !forced;
    setForced(next);
    onToggle?.(next);
  };

  return (
    <div className={`grid gap-2 ${forced ? 'fc-sim' : ''} ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">{title}</p>
        <button
          type="button"
          disabled={systemForced || disabled}
          aria-pressed={forced}
          onClick={toggle}
          className={`cursor-pointer rounded-md border bg-raised px-[9px] py-[5px] font-sans text-[.68rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 enabled:hover:border-accent enabled:active:translate-y-px ${
            forced ? 'border-accent text-accent' : 'border-border text-text'
          } ${disabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : 'disabled:cursor-default'}`}
        >
          {systemForced ? 'forced colors is already on' : 'Simulate forced colors'}
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" className="block h-auto w-full rounded-lg border border-border bg-bg"
           aria-label={ariaLabel}>
        <defs>
          <g id="fc-m0"><circle r="3" /></g>
          <g id="fc-m1"><rect x="-2.6" y="-2.6" width="5.2" height="5.2" /></g>
          <g id="fc-m2"><polygon points="0,-3.2 3.2,2.4 -3.2,2.4" /></g>
          <g id="fc-m3"><polygon points="0,-3.4 3.4,0 0,3.4 -3.4,0" /></g>
        </defs>
        {series.map((s, si) => (
          <g key={s.name}>
            <path
              className="fc-line" fill="none"
              d={s.data.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')}
              style={{ stroke: hue(si) }}
              strokeDasharray={s.dash || undefined}
            />
            {s.data.map((v, i) =>
              i % 3 === 0 || i === lastIndex ? (
                <use key={i} href={`#fc-m${s.marker}`} x={x(i)} y={y(v)} className="fc-mark" style={{ fill: hue(si) }} />
              ) : null
            )}
          </g>
        ))}
      </svg>

      {/* The legend repeats all three encodings. One that shows only colour
          fails in exactly the situations this chart is built for. */}
      <ul className="m-0 flex list-none flex-wrap gap-[10px] p-0">
        {series.map((s, si) => (
          <li key={s.name} className="flex items-center gap-[5px] text-[.7rem] text-text-dim">
            <svg viewBox="-6 -6 12 12" aria-hidden className="h-3 w-3 overflow-visible">
              <use href={`#fc-m${s.marker}`} style={{ fill: hue(si) }} />
            </svg>
            <span
              className="fc-swatch h-0 w-[22px] border-t-2"
              style={{ borderTopStyle: s.dash === '' ? 'solid' : s.dash === '2 2' ? 'dotted' : 'dashed', borderTopColor: hue(si) }}
            />
            <span>{s.name}</span>
          </li>
        ))}
      </ul>

      {/* The SVG is a picture; this is the data. */}
      <details className="text-[.72rem] text-text-dim">
        <summary className="cursor-pointer hover:text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">Values</summary>
        <table className="mt-1.5 border-collapse font-mono text-[.62rem]">
          <tbody>
            <tr><th className="border border-border px-1.5 py-0.5 text-left">{seriesHeader}</th>
              {(series[0]?.data ?? []).map((_, i) => <th key={i} className="border border-border px-1.5 py-0.5 text-right">{pointLabel(i)}</th>)}</tr>
            {series.map((s) => (
              <tr key={s.name}>
                <td className="border border-border px-1.5 py-0.5 text-left">{s.name}</td>
                {s.data.map((v, i) => <td key={i} className="border border-border px-1.5 py-0.5 text-right">{v.toFixed(1)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
