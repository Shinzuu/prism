import { useMemo, useRef, useState } from 'react';

const DAYS = 7;
const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/** Minimum count for levels 1–4 of the colour ramp; anything below the first is level 0. */
export type HeatmapThresholds = readonly [number, number, number, number];

const DEFAULT_THRESHOLDS: HeatmapThresholds = [1, 3, 5, 7];

/* Deterministic stand-in data so the demo looks the same on every load:
   weekdays busier than weekends, no randomness to reshuffle on re-render. */
const DEFAULT_GET_COUNT = (d: Date) => {
  const seed = (d.getDate() * 7 + d.getMonth() * 13) % 11;
  return d.getDay() === 0 || d.getDay() === 6 ? Math.max(0, seed - 7) : Math.max(0, seed - 2);
};

export interface HeatmapCalendarProps {
  /** Number of week columns to show, ending on the last day. */
  weeks?: number;
  /** Last day shown (defaults to today). */
  endDate?: Date;
  /** Returns the count for a given day; replace with a lookup into your own data. */
  getCount?: (date: Date) => number;
  /** Minimum counts for colour levels 1 to 4. */
  thresholds?: HeatmapThresholds;
  /** Heading above the grid. */
  title?: string;
  /** Word after the summed total. */
  totalLabel?: string;
  /** Singular unit used in each day's label. */
  unit?: string;
  /** Plural unit used in each day's label. */
  unitPlural?: string;
  /** Accessible name for the grid. */
  ariaLabel?: string;
  /** Legend text at the low end of the ramp. */
  lessLabel?: string;
  /** Legend text at the high end of the ramp. */
  moreLabel?: string;
  /** Fires when a day is clicked or reached with the keyboard. */
  onSelect?: (date: Date, count: number) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function HeatmapCalendar({
  weeks = 26,
  endDate,
  getCount = DEFAULT_GET_COUNT,
  thresholds = DEFAULT_THRESHOLDS,
  title = 'Deploys, last 26 weeks',
  totalLabel = 'total',
  unit = 'deploy',
  unitPlural = 'deploys',
  ariaLabel = 'Daily deploy counts',
  lessLabel = 'less',
  moreLabel = 'more',
  onSelect,
  className = '',
}: HeatmapCalendarProps) {
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [read, setRead] = useState('');
  const [focused, setFocused] = useState(weeks * DAYS - 1);
  const endTime = endDate?.getTime();
  const [t1, t2, t3, t4] = thresholds;

  const { cells, total } = useMemo(() => {
    const end = endTime === undefined ? new Date() : new Date(endTime); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(end.getDate() - (weeks * DAYS - 1));
    let total = 0;
    const cells = Array.from({ length: weeks * DAYS }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const n = getCount(d);
      total += n;
      const lvl = n >= t4 ? 4 : n >= t3 ? 3 : n >= t2 ? 2 : n >= t1 ? 1 : 0;
      return { date: d, n, lvl, label: `${n} ${n === 1 ? unit : unitPlural} on ${fmt.format(d)}` };
    });
    return { cells, total };
  }, [weeks, endTime, getCount, t1, t2, t3, t4, unit, unitPlural]);

  const focusAt = (i: number) => {
    if (i < 0 || i >= cells.length) return;
    setFocused(i);
    cellRefs.current[i]?.focus();
    const c = cells[i]!;
    setRead(c.label);
    onSelect?.(c.date, c.n);
  };

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 text-[.86rem] font-medium">{title}</p>
        <p className="m-0 text-[.76rem] tabular-nums text-text-dim">{total.toLocaleString()} {totalLabel}</p>
      </div>

      <div
        role="grid"
        aria-label={ariaLabel}
        className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto pb-0.5"
        onKeyDown={(e) => {
          const i = focused;
          /* DOM order runs DOWN each week column, so a day is ±1 and a week is
             ±7 — the axis the arrow keys name is not the axis of the DOM. */
          const map: Record<string, number> = {
            ArrowDown: 1, ArrowUp: -1, ArrowRight: DAYS, ArrowLeft: -DAYS,
            Home: -(i % DAYS), End: DAYS - 1 - (i % DAYS),
          };
          if (!(e.key in map)) return;
          e.preventDefault();
          focusAt(i + map[e.key]!);
        }}
      >
        {/* A gridcell must sit inside a row, and the cells are a flat list laid
            out by grid-flow-col. display: contents keeps the visual layout
            exactly as it is — the cells stay items of the outer grid — while
            giving the accessibility tree the rows it requires. The rows are
            weeks, which is what a column is here. */}
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} role="row" className="contents">
            {cells.slice(w * DAYS, w * DAYS + DAYS).map((c, d) => {
              const i = w * DAYS + d;
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  ref={(el) => { cellRefs.current[i] = el; }}
                  tabIndex={i === focused ? 0 : -1}
                  aria-label={c.label}
                  onClick={() => focusAt(i)}
                  data-lvl={c.lvl}
                  className="hc-cell h-[13px] w-[13px] cursor-pointer rounded-[3px] border-0 p-0 hover:brightness-125 focus-visible:outline-2 focus-visible:outline-text focus-visible:outline-offset-2"
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 text-[.72rem] text-text-dim">
        <span>{lessLabel}</span>
        {[0, 1, 2, 3, 4].map((l) => <i key={l} data-lvl={l} className="hc-cell h-[11px] w-[11px] rounded-[3px]" />)}
        <span>{moreLabel}</span>
      </div>

      <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] text-[.78rem] tabular-nums text-text-dim">{read}</p>
    </div>
  );
}
