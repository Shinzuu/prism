/* Stacked density curves that overlap — well understood in statistics,
   essentially unseen in product UI, and the right shape whenever you need to
   compare distributions rather than totals. */
const SERIES = [
  { name: '1.4.2', mu: 62, sd: 11, hot: false },
  { name: '1.4.1', mu: 68, sd: 14, hot: false },
  { name: '1.4.0', mu: 96, sd: 31, hot: true },
  { name: '1.3.9', mu: 71, sd: 16, hot: false },
  { name: '1.3.8', mu: 66, sd: 13, hot: false },
];
const LO = 20, HI = 190, STEPS = 64, W = 300, H = 54;

const density = (x: number, mu: number, sd: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

export default function RidgelinePlot() {
  // ONE shared vertical scale across every ridge, or the heights lie.
  const peak = Math.max(...SERIES.map((s) => density(s.mu, s.mu, s.sd)));

  return (
    <figure className="m-0 grid gap-[10px]">
      <figcaption className="text-[.8rem] text-text-dim">
        Response time distribution by build, in milliseconds
      </figcaption>

      <div className="grid">
        {SERIES.map((s, i) => {
          let d = `M0,${H}`;
          for (let k = 0; k <= STEPS; k++) {
            const x = LO + (k / STEPS) * (HI - LO);
            const y = H - (density(x, s.mu, s.sd) / peak) * (H - 2);
            d += ` L${((x - LO) / (HI - LO)) * W},${y}`;
          }
          d += ` L${W},${H} Z`;
          const mx = ((s.mu - LO) / (HI - LO)) * W;
          return (
            <div key={s.name} data-hot={s.hot}
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
          <span>{LO}</span><span>{Math.round((LO + HI) / 2)}</span><span>{HI} ms</span>
        </span>
      </div>

      {/* The curves are a picture; the table is the data. */}
      <table className="sr-only">
        <caption>Median and spread by build</caption>
        <thead><tr><th scope="col">Build</th><th scope="col">Median</th><th scope="col">Spread</th></tr></thead>
        <tbody>
          {SERIES.map((s) => (
            <tr key={s.name}><th scope="row">{s.name}</th><td>{s.mu} ms</td><td>±{s.sd} ms</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
