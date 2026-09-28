const ROWS = [
  { region: 'eu-west', p50: '32', p99: '210', err: '0.11%', heat: [0.18, 0.30, 0.08],
    spark: [30, 32, 31, 34, 33, 31, 29, 30, 32, 31, 30, 32] },
  { region: 'us-east', p50: '58', p99: '470', err: '0.48%', heat: [0.42, 0.66, 0.34],
    spark: [44, 49, 52, 51, 58, 63, 66, 61, 57, 59, 58, 58] },
  { region: 'ap-south', p50: '142', p99: '1280', err: '2.90%', heat: [0.88, 0.96, 0.91],
    spark: [70, 76, 84, 96, 108, 121, 130, 138, 144, 141, 143, 142] },
  { region: 'sa-east', p50: '74', p99: '390', err: '0.30%', heat: [0.55, 0.48, 0.22],
    spark: [90, 86, 84, 80, 78, 77, 75, 74, 73, 74, 75, 74] },
];

function Spark({ vals }: { vals: number[] }) {
  const w = 100, h = 22, pad = 2;
  const min = Math.min(...vals), max = Math.max(...vals);
  // Scaled to its OWN range: a row sitting between 30 and 34 still has a shape
  // worth seeing, which a shared scale would flatten to a straight line.
  const range = max - min || 1;
  const x = (i: number) => (i / (vals.length - 1)) * w;
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const first = vals[0]!, last = vals[vals.length - 1]!;
  const pct = ((last - first) / (first || 1)) * 100;
  const dir = Math.abs(pct) < 2 ? 'flat' : pct > 0 ? 'rising' : 'falling';

  return (
    <>
      {/* The shape is decoration; the trend is the fact, stated once in text. */}
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden className="st-svg block h-[22px] w-[100px] overflow-visible">
        <path className="sp-band" d={`M0,${h} ${vals.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${w},${h} Z`} />
        <path className="sp-line" d={vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} />
        <circle className="sp-last" cx={x(vals.length - 1)} cy={y(last)} r="2.1" />
      </svg>
      <span className="sr-only">{dir}, {first} to {last} over twelve hours</span>
    </>
  );
}

function Heat({ v, children }: { v: number; children: React.ReactNode }) {
  /* A wash BEHIND the figure, never a solid fill: the number has to stay the
     thing you read. */
  return (
    <td className="st-heat relative isolate border-b border-border px-[10px] py-2 text-right tabular-nums"
        style={{ '--st-heat': v } as React.CSSProperties}>
      <span className="relative z-10">{children}</span>
    </td>
  );
}

export default function SparklineTable() {
  return (
    <table className="w-full border-collapse text-[.86rem]">
      <caption className="pb-2 text-left text-[.78rem] text-text-dim">
        Service latency by region. Trend column shows the last twelve hours.
      </caption>
      <thead>
        <tr>
          {['Region', 'p50', 'p99', 'Error rate', 'Trend'].map((h, i) => (
            <th key={h} scope="col"
                className={`border-b border-border px-[10px] py-2 text-[.74rem] font-medium text-text-dim ${i === 0 ? 'text-left' : 'text-right'} ${i === 4 ? 'st-trend' : ''}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((r) => (
          <tr key={r.region}>
            <th scope="row" className="border-b border-border px-[10px] py-2 text-left font-medium">{r.region}</th>
            <Heat v={r.heat[0]!}>{r.p50}</Heat>
            <Heat v={r.heat[1]!}>{r.p99}</Heat>
            <Heat v={r.heat[2]!}>{r.err}</Heat>
            <td className="st-trend w-[108px] border-b border-border py-2 pl-[10px] pr-1.5 text-right">
              <Spark vals={r.spark} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
