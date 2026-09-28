import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIONS = [
  { label: 'Save', pri: 1 }, { label: 'Share', pri: 2 }, { label: 'Export', pri: 3 },
  { label: 'Duplicate', pri: 4 }, { label: 'Version history', pri: 5 }, { label: 'Print', pri: 6 },
];
const MORE_W = 86;

export default function PriorityOverflowToolbar() {
  const barRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const widths = useRef<number[] | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(520);
  const [note, setNote] = useState('');

  const fit = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    /* Widths measured ONCE with everything visible. Measuring inside the
       fitting loop reads a layout the loop is changing, which makes the result
       order-dependent and lets the observer fire on the resize it caused. */
    if (!widths.current) {
      widths.current = itemRefs.current.map((el) => (el ? el.getBoundingClientRect().width + 5 : 0));
    }
    const avail = bar.clientWidth - 14;
    const order = ACTIONS.map((a, i) => ({ i, pri: a.pri })).sort((x, y) => y.pri - x.pri);
    let used = widths.current.reduce((s, w) => s + w, 0);
    const out: number[] = [];
    for (const item of order) {
      if (used <= avail) break;
      out.push(item.i);
      used -= widths.current[item.i]!;
      // Once anything overflows, the More button itself needs room.
      if (out.length === 1) used += MORE_W;
    }
    setHidden(new Set(out));
    setNote(`container ${Math.round(bar.clientWidth)}px · ${ACTIONS.length - out.length} shown, ${out.length} in menu`);
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    // ResizeObserver, never a media query: the toolbar is not the viewport, and
    // at 400% zoom the viewport reports a comfortable width while the text is
    // four times its size, so a breakpoint never fires.
    const ro = new ResizeObserver(() => fit());
    ro.observe(bar);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const menuItems = [...hidden].sort((a, b) => ACTIONS[a]!.pri - ACTIONS[b]!.pri);

  return (
    <div className="grid gap-[9px]">
      <div className="flex items-center gap-[9px] text-[.7rem] text-text-dim">
        <label className="flex flex-1 items-center gap-[7px]">
          Container width
          <input type="range" min={190} max={560} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} className="min-w-0 flex-1 accent-accent" />
        </label>
        <span className="font-mono text-[.66rem] tabular-nums">{width}px</span>
      </div>

      <div style={{ maxWidth: `${width}px` }}>
        <div ref={barRef} role="toolbar" aria-label="Document actions"
             className="flex items-center gap-[5px] overflow-hidden rounded-[9px] border border-border bg-bg p-[7px]">
          {ACTIONS.map((a, i) => (
            <button
              key={a.label}
              ref={(el) => { itemRefs.current[i] = el; }}
              type="button"
              hidden={hidden.has(i)}
              className="cursor-pointer whitespace-nowrap rounded-md border border-border bg-raised px-[10px] py-1.5 font-sans text-[.74rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {a.label}
            </button>
          ))}
          {hidden.size > 0 && (
            <div ref={moreRef} className="relative ms-auto">
              <button
                type="button"
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpen((v) => !v)}
                className="cursor-pointer whitespace-nowrap rounded-md border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-raised px-[10px] py-1.5 font-sans text-[.74rem] text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                More ({hidden.size})
              </button>
              {open && (
                <div role="menu"
                     onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                     className="absolute end-0 top-[calc(100%+5px)] z-20 grid min-w-[10rem] gap-0.5 rounded-lg border border-border bg-raised p-[5px] shadow-[0_6px_18px_color-mix(in_oklab,black_18%,transparent)]">
                  {menuItems.map((i) => (
                    <button key={ACTIONS[i]!.label} type="button" role="menuitem"
                      className="cursor-pointer rounded border-0 bg-transparent px-[9px] py-1.5 text-start font-sans text-[.74rem] text-text hover:bg-bg focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2">
                      {ACTIONS[i]!.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="m-0 font-mono text-[.72rem] text-text-dim">{note}</p>
    </div>
  );
}
