import { useMemo, useRef, useState } from 'react';

const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const DEFAULT_FORMAT = (v: number) => money.format(v);

/* Two overlapping humps: a cheap crowd and a smaller premium tail, which is
   what makes dragging either thumb visibly costly. */
const DEFAULT_COUNTS: readonly number[] = Array.from({ length: 32 }, (_, i) => {
  const x = ((i + 0.5) / 32) * 500;
  const a = Math.exp(-((x - 120) ** 2) / (2 * 70 ** 2)) * 180;
  const b = Math.exp(-((x - 300) ** 2) / (2 * 55 ** 2)) * 70;
  return Math.round(a + b + 4);
});

export interface HistogramRangeProps {
  /** Lowest selectable value. */
  min?: number;
  /** Highest selectable value. */
  max?: number;
  /** Item count per bin, evenly spaced from min to max; its length sets the number of bars. */
  counts?: readonly number[];
  /** Initial lower bound. */
  defaultLow?: number;
  /** Initial upper bound. */
  defaultHigh?: number;
  /** Arrow-key step. */
  step?: number;
  /** Arrow-key step while Shift is held. */
  largeStep?: number;
  /** Visible label for the range. */
  label?: string;
  /** Noun after the in-range count, e.g. "results". */
  itemsLabel?: string;
  /** Formats a value for display and for screen readers. */
  formatValue?: (value: number) => string;
  /** Id for the label element; change it when rendering more than one. */
  id?: string;
  /** Disables both thumbs and click-to-jump on the chart. */
  disabled?: boolean;
  /** Fires with the new bounds whenever either thumb moves. */
  onChange?: (low: number, high: number) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

/* A two-thumb filter drawn OVER the distribution it filters, so you can see
   what each end of the drag will cost you before you let go. */
export default function HistogramRange({
  min: MIN = 0,
  max: MAX = 500,
  counts = DEFAULT_COUNTS,
  defaultLow = 80,
  defaultHigh = 340,
  step: smallStep = 5,
  largeStep = 25,
  label = 'Price',
  itemsLabel = 'results',
  formatValue = DEFAULT_FORMAT,
  id = 'hr-label',
  disabled = false,
  onChange,
  className = '',
}: HistogramRangeProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [lo, setLo] = useState(defaultLow);
  const [hi, setHi] = useState(defaultHigh);
  const drag = useRef<'lo' | 'hi' | null>(null);

  const BINS = counts.length;
  const peak = useMemo(() => Math.max(...counts), [counts]);
  const binValue = (i: number) => MIN + ((i + 0.5) / BINS) * (MAX - MIN);

  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const valueAt = (clientX: number) => {
    const b = chartRef.current!.getBoundingClientRect();
    return Math.round(MIN + ((clientX - b.left) / b.width) * (MAX - MIN));
  };

  /* Thumbs COLLIDE rather than swap: a filter whose ends trade places produces
     a range the user never asked for. */
  const set = (which: 'lo' | 'hi', v: number) => {
    if (disabled) return;
    if (which === 'lo') {
      const next = Math.max(MIN, Math.min(v, hi));
      setLo(next);
      if (next !== lo) onChange?.(next, hi);
    } else {
      const next = Math.min(MAX, Math.max(v, lo));
      setHi(next);
      if (next !== hi) onChange?.(lo, next);
    }
  };

  let inRange = 0, total = 0;
  counts.forEach((c, i) => {
    const x = binValue(i);
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
        aria-labelledby={id}
        disabled={disabled}
        aria-valuemin={k === 'lo' ? MIN : lo}
        aria-valuemax={k === 'lo' ? hi : MAX}
        aria-valuenow={v}
        aria-valuetext={`${k === 'lo' ? 'Minimum ' : 'Maximum '}${formatValue(v)}`}
        style={{ left: `${pct(v)}%` }}
        onPointerDown={(e) => { if (disabled) return; drag.current = k; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current === k) set(k, valueAt(e.clientX)); }}
        onPointerUp={() => { drag.current = null; }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? largeStep : smallStep;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(k, v + step); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(k, v - step); }
          else if (e.key === 'Home') { e.preventDefault(); set(k, k === 'lo' ? MIN : lo); }
          else if (e.key === 'End') { e.preventDefault(); set(k, k === 'lo' ? hi : MAX); }
        }}
        className="absolute bottom-1 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-accent bg-bg p-0 hover:bg-raised active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bg focus-visible:outline-2 focus-visible:outline-text focus-visible:outline-offset-2"
      />
    );
  };

  return (
    <div className={`grid max-w-[440px] gap-2 ${className}`}>
      <div className="flex items-baseline justify-between">
        <label className="text-[.84rem] font-medium" id={id}>{label}</label>
        <output className="text-[.82rem] tabular-nums text-text-dim">{formatValue(lo)} – {formatValue(hi)}</output>
      </div>

      <div
        ref={chartRef}
        className="relative h-[76px] touch-none pb-[14px]"
        onPointerDown={(e) => {
          if (disabled || (e.target as HTMLElement).closest('[role=slider]')) return;
          const v = valueAt(e.clientX);
          set(Math.abs(v - lo) <= Math.abs(v - hi) ? 'lo' : 'hi', v);   // nearest thumb jumps
        }}
      >
        <div aria-hidden className="absolute inset-x-0 bottom-[14px] top-0 flex items-end gap-0.5">
          {counts.map((c, i) => {
            const x = binValue(i);
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
        {inRange.toLocaleString()} of {total.toLocaleString()} {itemsLabel} ({Math.round((inRange / total) * 100)}%)
      </p>
    </div>
  );
}
