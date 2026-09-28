import { useEffect, useRef, useState } from 'react';

const MIN = 64, KEY = 'prism-col-widths';
const COLS = [
  { label: 'Designation', w: 200 },
  { label: 'Role', w: 120 },
  { label: 'Sweep', w: 110 },
  { label: 'First flight', w: 120 },
];
const ROWS = [
  ['F-14D Super Tomcat', 'Interceptor', '20–68°', '1970'],
  ['Panavia Tornado GR4', 'Strike', '25–67°', '1974'],
  ['Sukhoi Su-24M', 'Strike', '16–69°', '1967'],
  ['Rockwell B-1B Lancer', 'Bomber', '15–67°', '1974'],
];

export default function ColumnResizer() {
  const [widths, setWidths] = useState(COLS.map((c) => c.w));
  const [resizing, setResizing] = useState(false);
  const drag = useRef<{ i: number; x: number; w: number } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (Array.isArray(saved) && saved.length === COLS.length) setWidths(saved.map((v: number) => Math.max(MIN, v)));
    } catch { /* private mode: widths simply do not persist */ }
  }, []);

  const save = (w: number[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* ignore */ }
  };

  const setWidth = (i: number, px: number, persist = true) => {
    setWidths((prev) => {
      const next = [...prev];
      next[i] = Math.max(MIN, Math.round(px));
      if (persist) save(next);
      return next;
    });
  };

  return (
    <div className={`grid gap-2 ${resizing ? 'cursor-col-resize select-none' : ''}`}>
      {/* table-layout: fixed is what stops the columns shifting while you drag:
          without it the browser re-measures every cell on each pointermove. */}
      <table className="cz-table border-collapse text-[.84rem]">
        <caption className="pb-[7px] text-left text-[.74rem] text-text-dim">
          Drag a divider, or focus one and use arrow keys. Widths persist.
        </caption>
        <thead>
          <tr>
            {COLS.map((c, i) => (
              <th key={c.label} scope="col" style={{ width: `${widths[i]}px` }}
                  className="relative truncate border-b border-border bg-raised px-[11px] py-2 text-left text-[.74rem] font-medium text-text-dim">
                {c.label}
                {i < COLS.length - 1 && (
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${c.label} column`}
                    aria-valuenow={widths[i]}
                    tabIndex={0}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      drag.current = { i, x: e.clientX, w: e.currentTarget.parentElement!.getBoundingClientRect().width };
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setResizing(true);
                    }}
                    onPointerMove={(e) => {
                      if (!drag.current || drag.current.i !== i) return;
                      setWidth(i, drag.current.w + (e.clientX - drag.current.x), false);
                    }}
                    onPointerUp={() => { if (drag.current) { drag.current = null; setResizing(false); save(widths); } }}
                    onPointerCancel={() => { drag.current = null; setResizing(false); }}
                    onKeyDown={(e) => {
                      const step = e.shiftKey ? 40 : 8;
                      const cur = widths[i]!;
                      if (e.key === 'ArrowRight') { e.preventDefault(); setWidth(i, cur + step); }
                      else if (e.key === 'ArrowLeft') { e.preventDefault(); setWidth(i, cur - step); }
                      else if (e.key === 'Home') { e.preventDefault(); setWidth(i, MIN); }
                      else if (e.key === 'Enter') { e.preventDefault(); setWidth(i, c.w); }
                    }}
                    className="cz-grip absolute -right-1 top-0 z-10 h-full w-[9px] cursor-col-resize focus-visible:outline-none"
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r[0]}>
              {r.map((cell, i) => i === 0
                ? <th key={i} scope="row" className="truncate border-b border-border px-[11px] py-2 text-left font-normal">{cell}</th>
                : <td key={i} className="truncate border-b border-border px-[11px] py-2 text-left">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={() => { const d = COLS.map((c) => c.w); setWidths(d); save(d); }}
        className="cursor-pointer justify-self-start border-0 bg-transparent p-0 font-mono text-[.72rem] text-text-dim underline underline-offset-[3px] hover:text-accent"
      >
        Reset widths
      </button>
    </div>
  );
}
