import { Fragment, useRef, useState } from 'react';

export default function MagicPlusDrag() {
  const [items, setItems] = useState(['Pre-flight checks', 'Fuel load sign-off', 'Cabin secure', 'Pushback clearance']);
  const [slot, setSlot] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [read, setRead] = useState('Drag the plus between two steps.');
  const [armed, setArmed] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  /* Compare against each row's MIDPOINT. Edge comparison means the target only
     changes once the pointer has fully cleared a row, which feels sticky and
     lags the cursor by a whole row. */
  const gapAt = (y: number) => {
    const rows = Array.from(listRef.current?.querySelectorAll('li[data-row]') ?? []) as HTMLElement[];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!.getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return rows.length;
  };

  const insertAt = (i: number) => {
    setItems((xs) => { const n = [...xs]; n.splice(i, 0, ''); return n; });
    setEditing(i); setDraft('');
    setRead(`Inserted at position ${i + 1}`);
  };

  const commit = (i: number) => {
    const v = draft.trim();
    setEditing(null);
    if (!v) { setItems((xs) => xs.filter((_, j) => j !== i)); setRead('Cancelled.'); return; }
    setItems((xs) => xs.map((x, j) => (j === i ? v : x)));
  };

  return (
    <div className="relative grid justify-items-start gap-[9px]">
      <ol ref={listRef} className="m-0 grid w-full list-none gap-[3px] p-0 [counter-reset:step]">
        {items.map((label, i) => (
          <Fragment key={label + i}>
            {slot === i && <li aria-hidden className="mpd-slot my-[3px] h-[3px] rounded-sm bg-accent" />}
            <li
              data-row
              className={`grid grid-cols-[1.6rem_1fr] items-center gap-1.5 rounded-lg border px-[11px] py-[9px] text-[.78rem] [counter-increment:step] before:font-mono before:text-[.66rem] before:text-text-dim before:content-[counter(step)] ${
                editing === i ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_9%,var(--bg))]' : 'border-border bg-bg'
              }`}
            >
              {editing === i ? (
                <input
                  autoFocus
                  aria-label="New step name"
                  placeholder="New step"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commit(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                    if (e.key === 'Escape') { setDraft(''); e.currentTarget.blur(); }
                  }}
                  className="w-full min-w-0 border-0 bg-transparent p-0 font-sans text-[.78rem] text-text focus:outline-none"
                />
              ) : (
                <span>{label}</span>
              )}
            </li>
          </Fragment>
        ))}
        {slot === items.length && <li aria-hidden className="mpd-slot my-[3px] h-[3px] rounded-sm bg-accent" />}
      </ol>

      <button
        ref={plusRef}
        type="button"
        aria-label="Drag to insert a step, or press Enter to choose a position with the arrow keys"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
          e.currentTarget.setPointerCapture(e.pointerId);
          setPos({ x: r.left, y: r.top });
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
          const b = listRef.current?.getBoundingClientRect();
          if (!b) return;
          // Only open a slot while over the list, so a stray drag cancels cleanly.
          if (e.clientY > b.top - 24 && e.clientY < b.bottom + 24) {
            const i = gapAt(e.clientY);
            setSlot(i);
            setRead(`Insert at position ${i + 1}`);
          } else setSlot(null);
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          drag.current = null;
          const i = slot;
          setSlot(null); setPos(null);
          if (i !== null) insertAt(i); else setRead('Drag the plus between two steps.');
        }}
        onPointerCancel={() => { drag.current = null; setSlot(null); setPos(null); }}
        onKeyDown={(e) => {
          // A drag is a pointer idiom; the same intention needs a key path.
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (armed === null) { setArmed(items.length); setSlot(items.length); }
            else { const i = armed; setArmed(null); setSlot(null); insertAt(i); }
            return;
          }
          if (armed === null) return;
          if (e.key === 'ArrowUp') { e.preventDefault(); const n = Math.max(0, armed - 1); setArmed(n); setSlot(n); }
          if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.min(items.length, armed + 1); setArmed(n); setSlot(n); }
          if (e.key === 'Escape') { setArmed(null); setSlot(null); setRead('Cancelled.'); }
        }}
        style={pos ? { position: 'fixed', left: pos.x, top: pos.y, pointerEvents: 'none' } : undefined}
        className={`grid h-[34px] w-[34px] cursor-grab touch-none place-items-center rounded-full border bg-raised text-base leading-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
          pos ? 'z-30 border-accent text-accent' : 'border-border text-text'
        }`}
      >
        +
      </button>

      <p aria-live="polite" className="m-0 text-[.72rem] text-text-dim">{read}</p>
    </div>
  );
}
