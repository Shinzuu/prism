/** One ridge: a normal curve with median `mu` and spread `sd`. `hot` highlights it. */
export type RidgeSeries = { name: string; mu: number; sd: number; hot?: boolean };

/* Stacked density curves that overlap — well understood in statistics,
   essentially unseen in product UI, and the right shape whenever you need to
   compare distributions rather than totals. */
const DEFAULT_SERIES: RidgeSeries[] = [
  { name: '1.4.2', mu: 62, sd: 11, hot: false },
  { name: '1.4.1', mu: 68, sd: 14, hot: false },
  { name: '1.4.0', mu: 96, sd: 31, hot: true },
  { name: '1.3.9', mu: 71, sd: 16, hot: false },
  { name: '1.3.8', mu: 66, sd: 13, hot: false },
];
const LO = 20, HI = 190, STEPS = 64, W = 300, H = 54;

export interface RidgelinePlotProps {
  /** Ridges from top to bottom. */
  series?: RidgeSeries[];
  /** Left edge of the x axis. */
  lo?: number;
  /** Right edge of the x axis. */
  hi?: number;
  /** Unit shown on the axis end and in the data table. */
  unit?: string;
  /** Visible caption above the plot. */
  caption?: string;
  /** Caption of the screen-reader data table. */
  tableCaption?: string;
  /** Column heading for series names in the data table. */
  seriesLabel?: string;
  /** Extra classes appended to the root element. */
  className?: string;
}

const density = (x: number, mu: number, sd: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

export default function RidgelinePlot({
  series = DEFAULT_SERIES,
  lo = LO,
  hi = HI,
  unit = 'ms',
  caption = 'Response time distribution by build, in milliseconds',
  tableCaption = 'Median and spread by build',
  seriesLabel = 'Build',
  className = '',
}: RidgelinePlotProps) {
  // ONE shared vertical scale across every ridge, or the heights lie.
  const peak = Math.max(...series.map((s) => density(s.mu, s.mu, s.sd)));

  return (
    <figure className={`m-0 grid gap-[10px] ${className}`}>
      <figcaption className="text-[.8rem] text-text-dim">
        {caption}
      </figcaption>

      <div className="grid">
        {series.map((s, i) => {
          let d = `M0,${H}`;
          for (let k = 0; k <= STEPS; k++) {
            const x = lo + (k / STEPS) * (hi - lo);
            const y = H - (density(x, s.mu, s.sd) / peak) * (H - 2);
            d += ` L${((x - lo) / (hi - lo)) * W},${y}`;
          }
          d += ` L${W},${H} Z`;
          const mx = ((s.mu - lo) / (hi - lo)) * W;
          return (
            <div key={s.name} data-hot={s.hot ?? false}
                 className={`rp-row grid grid-cols-[4.4rem_1fr] items-end gap-[10px] ${i ? '-mt-4' : ''}`}>
              <span className="pb-1 text-[.76rem] tabular-nums text-text-dim">{s.name}</span>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden
                   className="block h-[54px] w-full overflow-visible">
                <path className="rp-area" d={d} />
                <line className="rp-med" x1={mx} x2={mx} y1={H} y2={H - (density(s.mu, s.mu, s.sd) / peak) * (H - 2)} />
              </svg>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[4.4rem_1fr] gap-[10px] text-[.7rem] text-text-dim">
        <span />
        <span className="flex justify-between tabular-nums">
          <span>{lo}</span><span>{Math.round((lo + hi) / 2)}</span><span>{hi} {unit}</span>
        </span>
      </div>

      {/* The curves are a picture; the table is the data. */}
      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead><tr><th scope="col">{seriesLabel}</th><th scope="col">Median</th><th scope="col">Spread</th></tr></thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.name}><th scope="row">{s.name}</th><td>{s.mu} {unit}</td><td>±{s.sd} {unit}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
