import { useRef, useState, type ReactNode } from 'react';

/** `k` is the reference, `n` the name, `v` the amount — all shown verbatim. */
export type Row = { id: string; k: string; n: string; v: string };

const DEFAULT_ROWS: Row[] = [
  { id: 'inv-7741', k: 'INV-7741', n: 'Northwind Freight', v: '£12,400' },
  { id: 'inv-7742', k: 'INV-7742', n: 'Halvorsen Tooling', v: '£3,180' },
  { id: 'inv-7743', k: 'INV-7743', n: 'Peregrine Labs', v: '£27,905' },
];

const DEFAULT_BODY =
  'Net 30 from issue. Two reminders sent. The row you opened is still in place behind this ' +
  'panel — the dialog grew out of it and stays tethered to it.';

export interface OriginMorphDialogProps {
  /** Rows to list; each one opens the dialog from its own position. */
  rows?: Row[];
  /** Heading inside the dialog. */
  detailTitle?: string;
  /** Dialog body; a function receives the opened row. */
  detailBody?: ReactNode | ((row: Row) => ReactNode);
  /** Text of the dialog's close button. */
  closeLabel?: string;
  /** Explanatory line under the list. Empty string hides it. */
  caption?: string;
  /** Stops the rows from opening the dialog. */
  disabled?: boolean;
  /** Fires when a row is opened. */
  onOpen?: (row: Row) => void;
  /** Fires when the dialog closes, by button or Escape. */
  onClose?: () => void;
  /** Extra classes for the root element. */
  className?: string;
}

export default function OriginMorphDialog({
  rows = DEFAULT_ROWS,
  detailTitle = 'Payment terms',
  detailBody = DEFAULT_BODY,
  closeLabel = 'Close',
  caption = 'Opens from the row, not from the middle of the screen, so it never costs you your place.',
  disabled = false,
  onOpen,
  onClose,
  className = '',
}: OriginMorphDialogProps) {
  const dlg = useRef<HTMLDialogElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const active = useRef<string | null>(null);
  const [row, setRow] = useState<Row | null>(null);

  const supported = typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
  const name = (el: HTMLElement | null, v: string) => { if (el) el.style.viewTransitionName = v; };

  /* view-transition-name must be UNIQUE at capture time. Putting it on every
     row in CSS aborts the whole transition — nothing animates, only a console
     warning, pixel-identical to the browser not supporting it. So it is
     assigned to the one row being opened and cleared on finish; a stale name
     poisons the NEXT transition. */
  const open = (r: Row) => {
    if (disabled) return;
    setRow(r);
    onOpen?.(r);
    const el = rowRefs.current[r.id] ?? null;
    const run = () => { dlg.current?.showModal(); name(el, ''); name(head.current, 'omd-card'); };
    if (!supported) { dlg.current?.showModal(); return; }
    active.current = r.id;
    name(el, 'omd-card');
    document.startViewTransition(run).finished.finally(() => { name(head.current, ''); name(el, ''); });
  };

  const close = () => {
    const el = active.current ? rowRefs.current[active.current] ?? null : null;
    const run = () => { dlg.current?.close(); name(head.current, ''); name(el, 'omd-card'); };
    if (!supported) { dlg.current?.close(); return; }
    name(head.current, 'omd-card');
    document.startViewTransition(run).finished.finally(() => { name(el, ''); name(head.current, ''); active.current = null; });
  };

  const rowGrid = 'grid grid-cols-[5.6rem_1fr_auto] items-baseline gap-[10px]';

  return (
    <div className={`grid gap-2 ${className}`}>
      <ul className="m-0 grid list-none gap-[3px] p-0">
        {rows.map((r) => (
          <li key={r.id} ref={(el) => { rowRefs.current[r.id] = el; }}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => open(r)}
              className={`${rowGrid} w-full cursor-pointer rounded-[9px] border border-border bg-bg px-[11px] py-[9px] text-left font-sans text-[.78rem] text-text hover:bg-raised active:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bg disabled:active:border-border`}
            >
              <span className="font-mono text-[.68rem] text-text-dim">{r.k}</span>
              <span className="truncate">{r.n}</span>
              <span className="font-mono text-[.72rem] tabular-nums">{r.v}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dlg} onClose={() => { active.current = null; onClose?.(); }}
        className="omd-dlg w-[min(22rem,calc(100%-24px))] overflow-hidden rounded-xl border border-border bg-raised p-0 text-text">
        {/* The row's own content becomes the header, so the two genuinely
            become each other rather than crossfading. */}
        <div ref={head} className={`${rowGrid} border-b border-border bg-bg px-3 py-[10px] text-[.78rem]`}>
          <span className="font-mono text-[.68rem] text-text-dim">{row?.k}</span>
          <span className="truncate">{row?.n}</span>
          <span className="font-mono text-[.72rem] tabular-nums">{row?.v}</span>
        </div>
        <div className="px-[14px] pb-[15px] pt-[13px]">
          <p className="m-0 mb-[5px] text-[.84rem] font-medium">{detailTitle}</p>
          <p className="m-0 mb-[13px] text-[.75rem] leading-relaxed text-text-dim">
            {typeof detailBody === 'function' ? (row ? detailBody(row) : null) : detailBody}
          </p>
          <button type="button" onClick={close}
            className="cursor-pointer rounded-[7px] border-0 bg-accent px-[13px] py-[7px] font-sans text-[.76rem] text-accent-fg hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
            {closeLabel}
          </button>
        </div>
      </dialog>

      {caption && (
        <p className="m-0 text-[.72rem] text-text-dim">
          {caption}
        </p>
      )}
    </div>
  );
}
