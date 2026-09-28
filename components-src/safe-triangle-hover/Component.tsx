import { useRef, useState } from 'react';

const CONTENT: Record<string, string[]> = {
  Runtime: ['Isolates', 'Cold starts', 'CPU budget'],
  Storage: ['KV namespaces', 'Durable objects', 'R2 buckets'],
  Network: ['Routes', 'Rate limits', 'Egress'],
  Billing: ['Plan', 'Invoices', 'Usage alerts'],
};
const KEYS = Object.keys(CONTENT);
type Pt = [number, number];

/* The submenu sits to the right, so reaching it means moving diagonally — and
   a diagonal crosses the item below, whose hover closes the panel you were
   heading for. A close delay cannot be tuned, because the right value is a
   property of the person's hand. The geometric question has an exact answer. */
export default function SafeTriangleHover() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [tri, setTri] = useState<Pt[] | null>(null);
  const [showTri, setShowTri] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const inSafe = (x: number, y: number) => {
    if (!tri || !rootRef.current) return false;
    const r = rootRef.current.getBoundingClientRect();
    const px = x - r.left, py = y - r.top;
    // Sign of the three cross products — a bounding box is not enough, the
    // whole value is in the diagonal edges.
    const s = [
      (px - tri[1]![0]) * (tri[0]![1] - tri[1]![1]) - (tri[0]![0] - tri[1]![0]) * (py - tri[1]![1]),
      (px - tri[2]![0]) * (tri[1]![1] - tri[2]![1]) - (tri[1]![0] - tri[2]![0]) * (py - tri[2]![1]),
      (px - tri[0]![0]) * (tri[2]![1] - tri[0]![1]) - (tri[2]![0] - tri[0]![0]) * (py - tri[0]![1]),
    ];
    return !(s.some((v) => v < 0) && s.some((v) => v > 0));
  };

  const build = (x: number, y: number) => {
    const root = rootRef.current, panel = panelRef.current;
    if (!root || !panel) return;
    const r = root.getBoundingClientRect(), p = panel.getBoundingClientRect();
    // Exit point plus the panel's two NEAR corners.
    setTri([[x - r.left, y - r.top], [p.left - r.left, p.top - r.top], [p.left - r.left, p.bottom - r.top]]);
  };

  return (
    <div className="grid gap-2">
      <div
        ref={rootRef}
        className="relative flex min-h-[168px] items-start"
        onPointerMove={(e) => {
          if (!tri || disabled) return;
          const overPanel = panelRef.current?.contains(document.elementFromPoint(e.clientX, e.clientY));
          if (overPanel) { setTri(null); return; }
          if (!inSafe(e.clientX, e.clientY) && !(e.target as HTMLElement).closest('[data-menu]')) {
            setOpen(null); setTri(null);
          }
        }}
        onPointerLeave={() => { setOpen(null); setTri(null); }}
      >
        <ul
          data-menu
          className="m-0 grid w-[9.5rem] shrink-0 list-none gap-0.5 rounded-[9px] border border-border bg-bg p-[5px]"
          onPointerLeave={(e) => { if (open && !disabled) build(e.clientX, e.clientY); }}
        >
          {KEYS.map((k) => (
            <li key={k}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={open === k}
                onPointerEnter={(e) => {
                  // The whole mechanism: inside the wedge, the hover is ignored.
                  if (!disabled && inSafe(e.clientX, e.clientY)) return;
                  setOpen(k); setTri(null);
                }}
                onFocus={() => setOpen(k)}
                onKeyDown={(e) => { if (e.key === 'Escape') setOpen(null); }}
                className={`flex w-full cursor-pointer justify-between rounded-md border-0 bg-transparent px-[9px] py-[7px] text-start font-sans text-[.76rem] after:text-text-dim after:content-['›'] focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-1 ${
                  open === k ? 'bg-raised text-accent' : 'text-text'
                }`}
              >
                {k}
              </button>
            </li>
          ))}
        </ul>

        {open && (
          <div ref={panelRef} className="ms-3 min-w-0 flex-1 self-stretch rounded-[9px] border border-border bg-raised px-3 py-[10px] text-[.74rem] text-text-dim">
            <h4 className="m-0 mb-[5px] text-[.78rem] font-medium text-text">{open}</h4>
            <ul className="m-0 list-disc ps-[1.1rem] leading-loose">
              {CONTENT[open]!.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        )}

        {tri && showTri && !disabled && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full">
            <polygon
              points={tri.map((p) => p.join(',')).join(' ')}
              fill="color-mix(in oklab, var(--accent) 15%, transparent)"
              stroke="color-mix(in oklab, var(--accent) 45%, transparent)"
              strokeWidth="1"
            />
          </svg>
        )}
      </div>

      {[['Show the safe triangle', showTri, setShowTri],
        ['Disable it — try reaching the panel diagonally', disabled, setDisabled]].map(([label, val, set]) => (
        <label key={label as string} className="flex cursor-pointer items-center gap-1.5 text-[.7rem] text-text-dim">
          <input type="checkbox" checked={val as boolean}
                 onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} />
          <span>{label as string}</span>
        </label>
      ))}
    </div>
  );
}
