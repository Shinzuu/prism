type Row = {
  label: string; value: string; unit: string;
  poor: number; ok: number; good: number; measure: number; target: number;
  over?: boolean; aria: string; actual: string; targetLabel: string;
};

const ROWS: Row[] = [
  { label: 'Revenue', value: '3.42', unit: 'M', poor: 55, ok: 80, good: 100, measure: 90, target: 100,
    aria: 'Revenue: 3.42 million against a target of 3.8 million. Below target, inside the satisfactory band.',
    actual: '3.42M', targetLabel: '3.80M' },
  { label: 'Margin', value: '27.8', unit: '%', poor: 40, ok: 70, good: 100, measure: 93, target: 84, over: true,
    aria: 'Margin: 27.8 percent against a target of 25 percent. Above target.',
    actual: '27.8%', targetLabel: '25.0%' },
  { label: 'Churn', value: '4.1', unit: '%', poor: 45, ok: 72, good: 100, measure: 62, target: 44,
    aria: 'Churn: 4.1 percent against a target of 3 percent. Worse than target.',
    actual: '4.1%', targetLabel: '3.0%' },
];

/* Bands are mixed from the text token rather than given their own greys, so the
   qualitative ranges stay legible under any wallpaper palette. */
const BANDS = [
  { key: 'poor', mix: 16, z: 'z-30' },
  { key: 'ok', mix: 10, z: 'z-20' },
  { key: 'good', mix: 5, z: 'z-10' },
] as const;

export default function BulletChart() {
  return (
    <div className="grid gap-[14px]">
      {ROWS.map((r) => (
        <div
          key={r.label}
          role="img"
          aria-label={r.aria}
          className="grid grid-cols-[4.2rem_1fr_auto] items-center gap-2 sm:grid-cols-[5.5rem_1fr_auto] sm:gap-3"
        >
          <span className="text-[.84rem] text-text-dim">{r.label}</span>

          <div className="relative h-[22px] overflow-hidden rounded-sm">
            {BANDS.map((b) => (
              <span
                key={b.key}
                className={`absolute inset-y-0 left-0 rounded-sm ${b.z}`}
                style={{
                  width: `${r[b.key]}%`,
                  background: `color-mix(in oklab, var(--text) ${b.mix}%, var(--bg))`,
                }}
              />
            ))}

            {/* The measure is a thin bar centred in the bands and never as tall
                as them — that ratio is what separates a bullet chart from a
                stacked bar. */}
            <span
              className={`absolute left-0 top-1/2 z-40 h-2 -translate-y-1/2 rounded-[1px] ${
                r.over ? 'bg-accent' : 'bg-text'
              }`}
              style={{ width: `${r.measure}%` }}
            />

            {/* The target is a tick across the track, not a dot on it. */}
            <span
              className="absolute inset-y-px z-50 w-0.5 -translate-x-px bg-text"
              style={{ left: `${r.target}%` }}
            />
          </div>

          <span className="min-w-[4.2rem] text-right text-[.94rem] font-semibold tabular-nums">
            {r.value}
            <small className="ml-px text-[.74em] font-normal text-text-dim">{r.unit}</small>
          </span>
        </div>
      ))}

      {/* The chart is a picture of a table, so ship the table. */}
      <table className="sr-only">
        <caption>Performance against target</caption>
        <thead>
          <tr><th scope="col">Measure</th><th scope="col">Actual</th><th scope="col">Target</th></tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{r.actual}</td>
              <td>{r.targetLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
