import { useMemo, useRef, useState } from 'react';

const WEEKS = 26, DAYS = 7;
const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function HeatmapCalendar() {
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [read, setRead] = useState('');
  const [focused, setFocused] = useState(WEEKS * DAYS - 1);

  const { cells, total } = useMemo(() => {
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(end.getDate() - (WEEKS * DAYS - 1));
    let total = 0;
    const cells = Array.from({ length: WEEKS * DAYS }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const seed = (d.getDate() * 7 + d.getMonth() * 13) % 11;
      const n = d.getDay() === 0 || d.getDay() === 6 ? Math.max(0, seed - 7) : Math.max(0, seed - 2);
      total += n;
      const lvl = n === 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : n < 7 ? 3 : 4;
      return { n, lvl, label: `${n} ${n === 1 ? 'deploy' : 'deploys'} on ${fmt.format(d)}` };
    });
    return { cells, total };
  }, []);

  const focusAt = (i: number) => {
    if (i < 0 || i >= cells.length) return;
    setFocused(i);
    cellRefs.current[i]?.focus();
    setRead(cells[i]!.label);
  };

  return (
    <div className="grid gap-[9px]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 text-[.86rem] font-medium">Deploys, last 26 weeks</p>
        <p className="m-0 text-[.76rem] tabular-nums text-text-dim">{total.toLocaleString()} total</p>
      </div>

      <div
        role="grid"
        aria-label="Daily deploy counts"
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
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            role="gridcell"
            ref={(el) => { cellRefs.current[i] = el; }}
            tabIndex={i === focused ? 0 : -1}
            aria-label={c.label}
            onClick={() => focusAt(i)}
            data-lvl={c.lvl}
            className="hc-cell h-[13px] w-[13px] cursor-pointer rounded-[3px] border-0 p-0 focus-visible:outline-2 focus-visible:outline-text focus-visible:outline-offset-2"
          />
        ))}
      </div>

      <div className="flex items-center gap-1 text-[.72rem] text-text-dim">
        <span>less</span>
        {[0, 1, 2, 3, 4].map((l) => <i key={l} data-lvl={l} className="hc-cell h-[11px] w-[11px] rounded-[3px]" />)}
        <span>more</span>
      </div>

      <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] text-[.78rem] tabular-nums text-text-dim">{read}</p>
    </div>
  );
}
