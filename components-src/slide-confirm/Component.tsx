import { useCallback, useEffect, useRef, useState } from 'react';

export interface SlideConfirmProps {
  /** Fraction of the rail (0–1) the grip must reach to count as confirmed. */
  commitThreshold?: number;
  /** Percent of the rail each right-arrow key repeat moves the grip. */
  keyStep?: number;
  /** How long the confirmed state holds before the control resets, in ms. */
  resetDelay?: number;
  /** Text inside the rail before confirming. */
  label?: string;
  /** Text inside the rail once confirmed. */
  doneLabel?: string;
  /** Status message announced after confirming. */
  doneMessage?: string;
  /** Accessible name of the grip. */
  gripLabel?: string;
  /** Disables the grip so the action cannot be confirmed. */
  disabled?: boolean;
  /** Fired once when the slide is confirmed. */
  onConfirm?: () => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

/* The gesture exists to make a destructive action deliberate, so the two
   things that matter are that a partial drag NEVER fires, and that the
   keyboard path is equally deliberate rather than a single Enter. */
export default function SlideConfirm({
  commitThreshold: COMMIT = 0.92,
  keyStep: HOLD_STEP = 6,
  resetDelay = 2200,
  label = 'Slide to delete this airframe',
  doneLabel = 'Deleted',
  doneMessage = 'Airframe deleted.',
  gripLabel = 'Slide right to confirm deletion. Or hold the right arrow key.',
  disabled = false,
  onConfirm,
  className = '',
}: SlideConfirmProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const [pct, setPct] = useState(0);
  const [settling, setSettling] = useState(false);
  const [done, setDone] = useState(false);
  const [out, setOut] = useState('');
  const dragging = useRef(false);
  const held = useRef(false);
  const pctRef = useRef(0);

  const span = () => {
    const rail = railRef.current, grip = gripRef.current;
    if (!rail || !grip) return 1;
    return rail.clientWidth - grip.offsetWidth - 8;
  };

  const set = useCallback((p: number) => {
    const next = Math.max(0, Math.min(1, p));
    pctRef.current = next;
    setPct(next);
  }, []);

  const settle = useCallback((to: number) => {
    setSettling(true);
    set(to);
    setTimeout(() => setSettling(false), 340);
  }, [set]);

  const commit = useCallback(() => {
    if (done || disabled) return;
    setDone(true);
    settle(1);
    setOut(doneMessage);
    onConfirm?.();
    setTimeout(() => {
      setDone(false);
      setOut('');
      settle(0);
    }, resetDelay);
  }, [done, disabled, settle, doneMessage, onConfirm, resetDelay]);

  useEffect(() => {
    const onResize = () => set(pctRef.current);
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, [set]);

  const armed = pct >= COMMIT;

  return (
    <div className={`grid max-w-[420px] gap-[10px] ${className}`}>
      <div
        ref={railRef}
        className="relative h-[52px] touch-none overflow-hidden rounded-full border border-border bg-raised"
      >
        <span
          className={`absolute inset-y-0 left-0 ${settling ? 'sl-settle' : ''} ${
            armed ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--accent)_22%,var(--raised))]'
          }`}
          style={{ width: `${pct * 100}%` }}
        />
        <span
          className={`pointer-events-none absolute inset-0 grid place-items-center pl-10 text-[.86rem] ${
            armed ? 'text-accent-fg' : 'text-text-dim'
          }`}
        >
          {done ? doneLabel : label}
        </span>
        <button
          ref={gripRef}
          type="button"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          aria-label={gripLabel}
          disabled={disabled}
          className={`absolute left-1 top-1 grid h-[42px] w-11 cursor-grab place-items-center rounded-full border border-border bg-bg text-[1.2rem] leading-none text-text enabled:hover:border-accent active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${
            settling ? 'sl-settle' : ''
          }`}
          style={{ left: `${4 + pct * span()}px` }}
          onPointerDown={(e) => {
            if (done || disabled) return;
            dragging.current = true;
            // The drag must survive leaving the rail.
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            const rail = railRef.current, grip = gripRef.current;
            if (!rail || !grip) return;
            const box = rail.getBoundingClientRect();
            set((e.clientX - box.left - grip.offsetWidth / 2) / span());
          }}
          onPointerUp={() => {
            if (!dragging.current) return;
            dragging.current = false;
            // A partial drag ALWAYS returns. That is the whole guarantee.
            if (pctRef.current >= COMMIT) commit(); else settle(0);
          }}
          onPointerCancel={() => { dragging.current = false; settle(0); }}
          onKeyDown={(e) => {
            if (done || disabled) return;
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              held.current = true;
              const next = pctRef.current + HOLD_STEP / 100;
              set(next);
              if (next >= COMMIT) commit();
            } else if (e.key === 'ArrowLeft') { e.preventDefault(); set(pctRef.current - HOLD_STEP / 100); }
            else if (e.key === 'Home') { e.preventDefault(); settle(0); }
            else if (e.key === 'End') { e.preventDefault(); settle(1); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); settle(0); }
          }}
          onKeyUp={(e) => {
            /* Holding the arrow key is the keyboard equivalent of holding the
               drag: one press does not confirm, and releasing early springs back. */
            if (e.key === 'ArrowRight' && held.current && pctRef.current < COMMIT) {
              held.current = false;
              settle(0);
            }
          }}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
      <p className="m-0 min-h-[1.2em] text-[.84rem] text-text-dim" role="status" aria-live="polite">{out}</p>
    </div>
  );
}
