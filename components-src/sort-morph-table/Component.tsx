import { useLayoutEffect, useRef, useState } from 'react';

export type Row = { service: string; dur: number; fails: number; when: string };
const DEFAULT_ROWS: Row[] = [
  { service: 'checkout-api', dur: 128, fails: 0, when: '09:14' },
  { service: 'search-index', dur: 412, fails: 3, when: '09:02' },
  { service: 'media-worker', dur: 96, fails: 0, when: '08:51' },
  { service: 'auth-edge', dur: 233, fails: 1, when: '08:40' },
  { service: 'billing-sync', dur: 517, fails: 7, when: '08:22' },
  { service: 'notify-fan', dur: 61, fails: 0, when: '08:05' },
  { service: 'report-batch', dur: 344, fails: 2, when: '07:48' },
];
export type Key = keyof Row;
export type Column = { key: Key; label: string };
export type Sort = { key: Key; dir: 1 | -1 };
const DEFAULT_COLS: Column[] = [
  { key: 'service', label: 'Service' }, { key: 'dur', label: 'Duration' },
  { key: 'fails', label: 'Failures' }, { key: 'when', label: 'Time' },
];

const DEFAULT_SORT: Sort = { key: 'when', dir: 1 };

export interface SortMorphTableProps {
  /** Rows to show; service names must be unique, they key the animation. */
  rows?: Row[];
  /** Header label for each column, in display order matching the row cells. */
  columns?: Column[];
  /** Sort applied on first render. */
  defaultSort?: Sort;
  /** Status text before the first click; should describe defaultSort. */
  initialStatus?: string;
  /** Heading above the table. */
  title?: string;
  /** Explanatory note under the table. */
  description?: string;
  /** How long a row takes to travel to its new place, in ms. */
  moveDuration?: number;
  /** Disables the sort buttons. */
  disabled?: boolean;
  /** Fired when the sort changes, with the column key and direction. */
  onSortChange?: (sort: Sort) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function SortMorphTable({
  rows: ROWS = DEFAULT_ROWS,
  columns: COLS = DEFAULT_COLS,
  defaultSort = DEFAULT_SORT,
  initialStatus = 'Sorted by time',
  title = 'Deploys',
  description = 'Rows travel to their new places, so you can follow the one you were reading instead of hunting for it again.',
  moveDuration = 420,
  disabled = false,
  onSortChange,
  className = '',
}: SortMorphTableProps) {
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [meta, setMeta] = useState(initialStatus);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const first = useRef<Map<string, number>>(new Map());

  const rows = [...ROWS].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    return (typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * sort.dir;
  });

  /* FLIP. getBoundingClientRect, never offsetTop: offsetTop ignores transforms,
     so a second sort while rows are still animating reads a stale origin and
     the rows drift further out on every click. Measured in useLayoutEffect so
     the new positions are read before the browser paints. */
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { first.current.clear(); return; }
    for (const tr of Array.from(body.children) as HTMLElement[]) {
      const key = tr.dataset.k!;
      const was = first.current.get(key);
      if (was == null) continue;
      const now = tr.getBoundingClientRect().top;
      const dy = was - now;
      if (!dy) continue;
      tr.dataset.moving = '';
      const anim = tr.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
        { duration: moveDuration, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
      anim.finished.then(() => tr.removeAttribute('data-moving')).catch(() => {});
    }
    first.current.clear();
  }, [sort]);

  const click = (key: Key, label: string) => {
    if (disabled) return;
    const body = bodyRef.current;
    if (body) {
      // FIRST: record where the surviving rows are, before the re-render.
      first.current = new Map(
        (Array.from(body.children) as HTMLElement[]).map((tr) => [tr.dataset.k!, tr.getBoundingClientRect().top])
      );
    }
    const dir: 1 | -1 = sort.key === key ? (sort.dir === 1 ? -1 : 1) : 1;
    setSort({ key, dir });
    setMeta(`Sorted by ${label.toLowerCase()}, ${dir === 1 ? 'ascending' : 'descending'}`);
    onSortChange?.({ key, dir });
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">{title}</p>
        <p aria-live="polite" className="m-0 font-mono text-[.66rem] text-text-dim">{meta}</p>
      </div>

      <table className="w-full border-collapse text-[.76rem]">
        <thead>
          <tr>
            {COLS.map((c) => (
              /* aria-sort belongs on the columnheader, not on the control
                 inside it: a button has no sort state to report, and putting
                 it there is an attribute the role does not allow. */
              <th
                key={c.key}
                scope="col"
                aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                className="border-b border-border pb-[5px] text-left"
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => click(c.key, c.label)}
                  className={`cursor-pointer rounded border-0 bg-transparent px-1 py-[3px] font-sans text-[.68rem] font-medium focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${
                    sort.key === c.key ? 'text-accent' : 'text-text-dim enabled:hover:text-text'
                  }`}
                >
                  {c.label}{sort.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {rows.map((r) => (
            /* A travelling row is lifted so it passes OVER its neighbours;
               without it the motion reads as a flicker. */
            <tr key={r.service} data-k={r.service} className="smt-row">
              <td className="border-b border-border/45 px-1 py-1.5">{r.service}</td>
              <td className="border-b border-border/45 px-1 py-1.5 font-mono text-[.68rem] tabular-nums">{r.dur}ms</td>
              <td className={`border-b border-border/45 px-1 py-1.5 font-mono text-[.68rem] tabular-nums ${r.fails > 0 ? 'text-accent' : ''}`}>{r.fails}</td>
              <td className="border-b border-border/45 px-1 py-1.5 font-mono text-[.66rem] text-text-dim">{r.when}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{description}</p>
    </div>
  );
}
