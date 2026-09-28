import { useMemo, useRef, useState } from 'react';

const MIN = 0, MAX = 500, BINS = 32;
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

/* A two-thumb filter drawn OVER the distribution it filters, so you can see
   what each end of the drag will cost you before you let go. */
export default function HistogramRange() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [lo, setLo] = useState(80);
  const [hi, setHi] = useState(340);
  const drag = useRef<'lo' | 'hi' | null>(null);

  const counts = useMemo(() =>
    Array.from({ length: BINS }, (_, i) => {
      const x = ((i + 0.5) / BINS) * MAX;
      const a = Math.exp(-((x - 120) ** 2) / (2 * 70 ** 2)) * 180;
      const b = Math.exp(-((x - 300) ** 2) / (2 * 55 ** 2)) * 70;
      return Math.round(a + b + 4);
    }), []);
  const peak = Math.max(...counts);

  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const valueAt = (clientX: number) => {
    const b = chartRef.current!.getBoundingClientRect();
    return Math.round(MIN + ((clientX - b.left) / b.width) * (MAX - MIN));
  };

  /* Thumbs COLLIDE rather than swap: a filter whose ends trade places produces
     a range the user never asked for. */
  const set = (which: 'lo' | 'hi', v: number) => {
    if (which === 'lo') setLo(Math.max(MIN, Math.min(v, hi)));
    else setHi(Math.min(MAX, Math.max(v, lo)));
  };

  let inRange = 0, total = 0;
  counts.forEach((c, i) => {
    const x = ((i + 0.5) / BINS) * MAX;
    total += c;
    if (x >= lo && x <= hi) inRange += c;
  });

  const thumb = (k: 'lo' | 'hi') => {
    const v = k === 'lo' ? lo : hi;
    return (
      <button
        key={k}
        type="button"
        role="slider"
        aria-labelledby="hr-label"
        aria-valuemin={k === 'lo' ? MIN : lo}
        aria-valuemax={k === 'lo' ? hi : MAX}
        aria-valuenow={v}
        aria-valuetext={`${k === 'lo' ? 'Minimum ' : 'Maximum '}${money.format(v)}`}
        style={{ left: `${pct(v)}%` }}
        onPointerDown={(e) => { drag.current = k; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current === k) set(k, valueAt(e.clientX)); }}
        onPointerUp={() => { drag.current = null; }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 25 : 5;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(k, v + step); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(k, v - step); }
          else if (e.key === 'Home') { e.preventDefault(); set(k, k === 'lo' ? MIN : lo); }
          else if (e.key === 'End') { e.preventDefault(); set(k, k === 'lo' ? hi : MAX); }
        }}
        className="absolute bottom-1 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-accent bg-bg p-0 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-text focus-visible:outline-offset-2"
      />
    );
  };

  return (
    <div className="grid max-w-[440px] gap-2">
      <div className="flex items-baseline justify-between">
        <label className="text-[.84rem] font-medium" id="hr-label">Price</label>
        <output className="text-[.82rem] tabular-nums text-text-dim">{money.format(lo)} – {money.format(hi)}</output>
      </div>

      <div
        ref={chartRef}
        className="relative h-[76px] touch-none pb-[14px]"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('[role=slider]')) return;
          const v = valueAt(e.clientX);
          set(Math.abs(v - lo) <= Math.abs(v - hi) ? 'lo' : 'hi', v);   // nearest thumb jumps
        }}
      >
        <div aria-hidden className="absolute inset-x-0 bottom-[14px] top-0 flex items-end gap-0.5">
          {counts.map((c, i) => {
            const x = ((i + 0.5) / BINS) * MAX;
            const on = x >= lo && x <= hi;
            return <i key={i} data-in={on}
              className="hr-bar flex-1 rounded-t-sm"
              style={{ height: `${Math.max(3, (c / peak) * 100)}%` }} />;
          })}
        </div>
        <div className="pointer-events-none absolute bottom-[14px] top-0 border-x border-accent bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]"
             style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
        {thumb('lo')}{thumb('hi')}
      </div>

      {/* The number the drag actually costs you, stated before you commit. */}
      <p role="status" aria-live="polite" className="m-0 text-[.78rem] tabular-nums text-text-dim">
        {inRange.toLocaleString()} of {total.toLocaleString()} results ({Math.round((inRange / total) * 100)}%)
      </p>
    </div>
  );
}
