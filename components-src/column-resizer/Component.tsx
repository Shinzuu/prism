import { useEffect, useRef, useState } from 'react';

/** w is the starting width in px, and the width Enter or Reset returns to. */
export type Column = { label: string; w: number };

const DEFAULT_COLS: Column[] = [
  { label: 'Designation', w: 200 },
  { label: 'Role', w: 120 },
  { label: 'Sweep', w: 110 },
  { label: 'First flight', w: 120 },
];
const DEFAULT_ROWS: string[][] = [
  ['F-14D Super Tomcat', 'Interceptor', '20–68°', '1970'],
  ['Panavia Tornado GR4', 'Strike', '25–67°', '1974'],
  ['Sukhoi Su-24M', 'Strike', '16–69°', '1967'],
  ['Rockwell B-1B Lancer', 'Bomber', '15–67°', '1974'],
];

export interface ColumnResizerProps {
  /** Column headings and starting widths. */
  columns?: Column[];
  /** Body rows, one string per column; the first cell is the row header. */
  rows?: string[][];
  /** Narrowest a column can be dragged, in px. */
  minWidth?: number;
  /** Arrow-key step in px. */
  step?: number;
  /** Arrow-key step in px with Shift held. */
  bigStep?: number;
  /** localStorage key the widths persist under; null turns persistence off. */
  storageKey?: string | null;
  /** Table caption. */
  caption?: string;
  /** Label of the reset button. */
  resetLabel?: string;
  /** Locks every divider and the reset button. */
  disabled?: boolean;
  /** Fired when a resize settles (drag end, key press, reset) with every column width. */
  onResize?: (widths: number[]) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ColumnResizer({
  columns: COLS = DEFAULT_COLS,
  rows: ROWS = DEFAULT_ROWS,
  minWidth: MIN = 64,
  step: STEP = 8,
  bigStep: BIG_STEP = 40,
  storageKey: KEY = 'prism-col-widths',
  caption = 'Drag a divider, or focus one and use arrow keys. Widths persist.',
  resetLabel = 'Reset widths',
  disabled = false,
  onResize,
  className = '',
}: ColumnResizerProps) {
  const [widths, setWidths] = useState(COLS.map((c) => c.w));
  const [resizing, setResizing] = useState(false);
  const drag = useRef<{ i: number; x: number; w: number } | null>(null);

  useEffect(() => {
    if (KEY === null) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (Array.isArray(saved) && saved.length === COLS.length) setWidths(saved.map((v: number) => Math.max(MIN, v)));
    } catch { /* private mode: widths simply do not persist */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (w: number[]) => {
    onResize?.(w);
    if (KEY === null) return;
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* ignore */ }
  };

  const setWidth = (i: number, px: number, persist = true) => {
    const clamp = (prev: number[]) => {
      const next = [...prev];
      next[i] = Math.max(MIN, Math.round(px));
      return next;
    };
    // Saving reports to the parent, so it happens outside the state updater.
    if (persist) { const next = clamp(widths); setWidths(next); save(next); }
    else setWidths(clamp);
  };

  return (
    <div className={`grid gap-2 ${resizing ? 'cursor-col-resize select-none' : ''} ${className}`}>
      {/* table-layout: fixed is what stops the columns shifting while you drag:
          without it the browser re-measures every cell on each pointermove. */}
      <table className="cz-table border-collapse text-[.84rem]">
        <caption className="pb-[7px] text-left text-[.74rem] text-text-dim">
          {caption}
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
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : 0}
                    onPointerDown={(e) => {
                      if (disabled) return;
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
                      if (disabled) return;
                      const step = e.shiftKey ? BIG_STEP : STEP;
                      const cur = widths[i]!;
                      if (e.key === 'ArrowRight') { e.preventDefault(); setWidth(i, cur + step); }
                      else if (e.key === 'ArrowLeft') { e.preventDefault(); setWidth(i, cur - step); }
                      else if (e.key === 'Home') { e.preventDefault(); setWidth(i, MIN); }
                      else if (e.key === 'Enter') { e.preventDefault(); setWidth(i, c.w); }
                    }}
                    className="cz-grip absolute -right-1 top-0 z-10 h-full w-[9px] cursor-col-resize focus-visible:outline-none aria-disabled:pointer-events-none"
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
        disabled={disabled}
        onClick={() => { const d = COLS.map((c) => c.w); setWidths(d); save(d); }}
        className="cursor-pointer justify-self-start border-0 bg-transparent p-0 font-mono text-[.72rem] text-text-dim underline underline-offset-[3px] hover:text-accent active:text-text disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-text-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        {resetLabel}
      </button>
    </div>
  );
}
