import { useEffect, useRef, useState } from 'react';

const SIZE = 132;   // must match --pc-size in the stylesheet

/* Registering --pc-peel is what makes the settle animate. An unregistered
   custom property is a string to the engine: it flips 0 to 1 with no
   in-between, and nothing tells you why the transition did nothing. */
function register() {
  if (typeof CSS === 'undefined' || !('registerProperty' in CSS)) return;
  try {
    CSS.registerProperty({ name: '--pc-peel', syntax: '<number>', inherits: true, initialValue: '0' });
  } catch { /* already registered by another instance on the page */ }
}

export default function PeelCornerCard() {
  const cardRef = useRef<HTMLElement>(null);
  const [peel, setPeel] = useState(0);
  const [settling, setSettling] = useState(false);
  const dragging = useRef(false);
  const peelRef = useRef(0);

  useEffect(register, []);

  const set = (v: number, settle: boolean) => {
    const next = Math.max(0, Math.min(1, v));
    peelRef.current = next;
    setPeel(next);
    setSettling(settle);
    if (settle) setTimeout(() => setSettling(false), 440);
  };

  return (
    <div className="grid gap-2">
      <article
        ref={cardRef}
        style={{ '--pc-peel': peel.toFixed(3) } as React.CSSProperties}
        className={`pc-card relative isolate min-h-[158px] overflow-hidden rounded-xl border border-border bg-raised ${settling ? 'pc-settling' : ''}`}
      >
        {/* One clip-path drives the face, so the face and the flap can never
            disagree about where the fold is. */}
        <div className="pc-face relative z-20 bg-raised px-4 py-[14px]">
          <p className="m-0 mb-1.5 font-mono text-[.64rem] tracking-[.04em] text-text-dim">Boarding pass</p>
          <p className="m-0 mb-[5px] text-[1.15rem] font-semibold tracking-[-.01em]">SEA → NRT</p>
          <p className="m-0 text-[.74rem] text-text-dim">Seat 14A · Gate N7 · Boards 09:40</p>
        </div>

        {/* The peel uncovers a bottom-RIGHT triangle, so the reverse lives
            there. Left-aligned text is hidden by the face. */}
        <div aria-hidden className="pc-back absolute inset-0 z-10 flex flex-col items-end justify-end px-4 py-[14px] text-end">
          <p className="m-0 mb-1 text-[.72rem] font-medium">Fare rules</p>
          <p className="m-0 text-[.68rem] leading-snug text-text-dim">24h changes<br />no refund</p>
        </div>

        {/* The flap: the cut triangle MIRRORED across the fold, so it lies on
            the face and leaves the cut open. Clipped to the cut itself it
            would cover exactly the hole it is meant to reveal. */}
        <div aria-hidden className="pc-curl absolute bottom-0 right-0 z-30" />

        <button
          aria-expanded={peel > 0.5}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setSettling(false);
            e.preventDefault();
          }}
          onPointerMove={(e) => {
            if (!dragging.current || !cardRef.current) return;
            const r = cardRef.current.getBoundingClientRect();
            // Distance from the bottom-right corner along the fold's normal.
            set((r.right - e.clientX + (r.bottom - e.clientY)) / 2 / SIZE, false);
          }}
          onPointerUp={() => {
            if (!dragging.current) return;
            dragging.current = false;
            // Past halfway it commits, below it springs shut. No middle state.
            set(peelRef.current > 0.5 ? 1 : 0, true);
          }}
          onPointerCancel={() => { dragging.current = false; set(0, true); }}
          onKeyDown={(e) => {
            if (['ArrowLeft', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); set(1, true); }
            else if (['ArrowRight', 'ArrowDown', 'Escape'].includes(e.key)) { e.preventDefault(); set(0, true); }
          }}
          className="absolute bottom-0 right-0 z-40 h-11 w-11 cursor-grab touch-none border-0 bg-transparent p-0 active:cursor-grabbing focus-visible:rounded-br-xl focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent"
        >
          <span className="sr-only">Peel the corner to read the fare rules</span>
        </button>
      </article>
      <p className="m-0 text-[.72rem] text-text-dim">
        Drag the corner, or press the corner button and use the arrow keys.
      </p>
    </div>
  );
}
