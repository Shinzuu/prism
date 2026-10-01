import { useCallback, useEffect, useRef, useState } from 'react';

/** One toolbar action. Lower `pri` stays visible longest. */
export type ToolbarAction = { label: string; pri: number; disabled?: boolean };

const DEFAULT_ACTIONS: ToolbarAction[] = [
  { label: 'Save', pri: 1 }, { label: 'Share', pri: 2 }, { label: 'Export', pri: 3 },
  { label: 'Duplicate', pri: 4 }, { label: 'Version history', pri: 5 }, { label: 'Print', pri: 6 },
];
const MORE_W = 86;

export interface PriorityOverflowToolbarProps {
  /** Actions in display order; the highest `pri` overflows into the menu first. */
  actions?: ToolbarAction[];
  /** Accessible name of the toolbar. */
  ariaLabel?: string;
  /** Label of the overflow button; the hidden count is appended in brackets. */
  moreLabel?: string;
  /** Label of the demo width slider. */
  widthLabel?: string;
  /** Starting width of the toolbar container, in px. */
  initialWidth?: number;
  /** Smallest width the demo slider allows, in px. */
  minWidth?: number;
  /** Largest width the demo slider allows, in px. */
  maxWidth?: number;
  /** Fired when an action is clicked, from the toolbar or the overflow menu. */
  onAction?: (action: ToolbarAction) => void;
  /** Fired after each fit with the indexes of actions moved into the menu. */
  onOverflowChange?: (hidden: number[]) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function PriorityOverflowToolbar({
  actions = DEFAULT_ACTIONS,
  ariaLabel = 'Document actions',
  moreLabel = 'More',
  widthLabel = 'Container width',
  initialWidth = 520,
  minWidth = 190,
  maxWidth = 560,
  onAction,
  onOverflowChange,
  className = '',
}: PriorityOverflowToolbarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const widths = useRef<number[] | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(initialWidth);
  const [note, setNote] = useState('');
  // Latest props in refs, so fit() stays stable and the observer is not rebuilt each render.
  const actionsRef = useRef(actions);
  const overflowRef = useRef(onOverflowChange);
  useEffect(() => { actionsRef.current = actions; overflowRef.current = onOverflowChange; });

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
    const list = actionsRef.current;
    const order = list.map((a, i) => ({ i, pri: a.pri })).sort((x, y) => y.pri - x.pri);
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
    setNote(`container ${Math.round(bar.clientWidth)}px · ${list.length - out.length} shown, ${out.length} in menu`);
    overflowRef.current?.(out);
  }, []);

  /* New actions mean new widths; the cached measurement belongs to the old set.
     Keyed on content rather than array identity so an inline array from the
     parent does not remeasure on every render. Everything is unhidden first,
     because a hidden button measures as zero. */
  const sig = actions.map((a) => `${a.label}:${a.pri}`).join('|');
  const lastSig = useRef(sig);
  const needsFit = useRef(false);
  useEffect(() => {
    if (lastSig.current === sig) return;
    lastSig.current = sig;
    widths.current = null;
    itemRefs.current.length = actionsRef.current.length;
    needsFit.current = true;
    setHidden(new Set());
  }, [sig]);
  useEffect(() => {
    if (needsFit.current && hidden.size === 0) { needsFit.current = false; fit(); }
  });

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

  const menuItems = [...hidden].sort((a, b) => actions[a]!.pri - actions[b]!.pri);

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <div className="flex items-center gap-[9px] text-[.7rem] text-text-dim">
        <label className="flex flex-1 items-center gap-[7px]">
          {widthLabel}
          <input type="range" min={minWidth} max={maxWidth} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} className="min-w-0 flex-1 accent-accent" />
        </label>
        <span className="font-mono text-[.66rem] tabular-nums">{width}px</span>
      </div>

      <div style={{ maxWidth: `${width}px` }}>
        <div ref={barRef} role="toolbar" aria-label={ariaLabel}
             className="flex items-center gap-[5px] overflow-hidden rounded-[9px] border border-border bg-bg p-[7px]">
          {actions.map((a, i) => (
            <button
              key={a.label}
              ref={(el) => { itemRefs.current[i] = el; }}
              type="button"
              hidden={hidden.has(i)}
              disabled={a.disabled}
              onClick={() => onAction?.(a)}
              className="cursor-pointer whitespace-nowrap rounded-md border border-border bg-raised px-[10px] py-1.5 font-sans text-[.74rem] text-text hover:border-accent active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:active:translate-y-0"
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
                className="cursor-pointer whitespace-nowrap rounded-md border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-raised px-[10px] py-1.5 font-sans text-[.74rem] text-accent hover:border-accent active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {moreLabel} ({hidden.size})
              </button>
              {open && (
                <div role="menu"
                     onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                     className="absolute end-0 top-[calc(100%+5px)] z-20 grid min-w-[10rem] gap-0.5 rounded-lg border border-border bg-raised p-[5px] shadow-[0_6px_18px_color-mix(in_oklab,black_18%,transparent)]">
                  {menuItems.map((i) => (
                    <button key={actions[i]!.label} type="button" role="menuitem"
                      disabled={actions[i]!.disabled}
                      onClick={() => onAction?.(actions[i]!)}
                      className="cursor-pointer rounded border-0 bg-transparent px-[9px] py-1.5 text-start font-sans text-[.74rem] text-text hover:bg-bg active:bg-bg focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent">
                      {actions[i]!.label}
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
