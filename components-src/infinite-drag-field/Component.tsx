import { useEffect, useRef, useState } from 'react';

export interface InfiniteDragFieldProps {
  /** Starting value; Home returns to it. */
  defaultValue?: number;
  /** Lowest value the field accepts. */
  min?: number;
  /** Highest value the field accepts. */
  max?: number;
  /** Change per pixel dragged or per arrow press. */
  step?: number;
  /** Change per pixel or press while Shift is held. */
  largeStep?: number;
  /** Change per pixel or press while Alt is held. */
  fineStep?: number;
  /** Text on the drag handle. */
  label?: string;
  /** Unit shown after the number field. */
  unit?: string;
  /** Accessible name for the drag handle. */
  handleLabel?: string;
  /** Accessible name for the number field. */
  inputLabel?: string;
  /** Explanatory line under the field; pass an empty string to hide it. */
  hint?: string;
  /** Disables dragging, arrow keys and the number field. */
  disabled?: boolean;
  /** Fires with every new value, from drag, keys or typing. */
  onChange?: (value: number) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function InfiniteDragField({
  defaultValue = 0,
  min = -9999,
  max = 9999,
  step = 1,
  largeStep = 10,
  fineStep = 0.1,
  label = 'Offset X',
  unit = 'px',
  handleLabel = 'Offset X, drag to scrub or use arrow keys',
  inputLabel = 'Offset X in pixels',
  hint = 'Drag the label sideways. The pointer is captured and hidden, wraps at the screen edge, and never runs out of room.',
  disabled = false,
  onChange,
  className = '',
}: InfiniteDragFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [read, setRead] = useState('');
  const [scrubbing, setScrubbing] = useState(false);
  const scrubRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const locked = useRef(false);
  const acc = useRef(0);
  const valueRef = useRef(defaultValue);

  /* The document listeners are bound once, so they read the current props
     through a ref instead of a stale closure. */
  const live = useRef({ min, max, step, largeStep, fineStep, onChange });
  live.current = { min, max, step, largeStep, fineStep, onChange };

  const commit = (next: number) => {
    const { min: lo, max: hi, onChange: notify } = live.current;
    const v = Math.min(hi, Math.max(lo, next));
    valueRef.current = v;
    setValue(v);
    notify?.(v);
  };

  useEffect(() => {
    setRead('requestPointerLock' in Element.prototype ? 'Pointer Lock available' : 'Pointer Lock unavailable — edge-limited fallback');
  }, []);

  useEffect(() => {
    /* movementX is the only delta that survives Pointer Lock: once the cursor
       is hidden it stops moving, so clientX freezes and a clientX-based
       scrubber dies the instant the lock engages. */
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const cfg = live.current;
      const gear = e.shiftKey ? cfg.largeStep : e.altKey ? cfg.fineStep : cfg.step;
      acc.current += (e.movementX || 0) * gear;
      const step = Math.trunc(acc.current);
      if (!step) return;
      acc.current -= step;
      commit(valueRef.current + step);
      setRead(`movementX ${e.movementX > 0 ? '+' : ''}${e.movementX} · gear ×${gear}` +
        (locked.current ? ' · pointer locked' : ' · fallback, edge-limited'));
    };
    const end = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setScrubbing(false);
      if (locked.current && document.exitPointerLock) document.exitPointerLock();
      locked.current = false;
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
    const lockChange = () => { if (!document.pointerLockElement) locked.current = false; };
    document.addEventListener('pointerlockchange', lockChange);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', end);
      document.removeEventListener('pointerlockchange', lockChange);
    };
  }, []);

  const down = async (e: React.PointerEvent<HTMLSpanElement>) => {
    if (disabled) return;
    dragging.current = true;
    acc.current = 0;
    setScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    const el = scrubRef.current;
    if (el && 'requestPointerLock' in el) {
      try {
        // Promise-based in current Chrome, undefined in older engines.
        await (el.requestPointerLock as (o?: { unadjustedMovement?: boolean }) => Promise<void> | void)(
          { unadjustedMovement: true }
        );
        locked.current = document.pointerLockElement === el;
      } catch { locked.current = false; }
    }
    // Saying WHICH mode is active matters: an edge-limited fallback that
    // pretends to be infinite is worse than one that admits it.
    setRead(locked.current ? 'pointer locked — no screen edge' : 'fallback — limited by screen width');
  };

  const key = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const by = e.shiftKey ? largeStep : e.altKey ? fineStep : step;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') commit(valueRef.current + by);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') commit(valueRef.current - by);
    else if (e.key === 'Home') commit(defaultValue);
    else return;
    e.preventDefault();
    setRead(`keyboard · step ${by}`);
  };

  return (
    <div className={`grid gap-2 ${scrubbing ? 'cursor-ew-resize' : ''} ${className}`}>
      <div className="flex items-center gap-2">
        <span
          ref={scrubRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Math.round(value)}
          aria-label={handleLabel}
          aria-disabled={disabled || undefined}
          onPointerDown={down}
          onKeyDown={key}
          className={`idf-lab cursor-ew-resize touch-none select-none whitespace-nowrap rounded-md border border-dashed bg-raised px-2 py-[5px] text-[.74rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
            scrubbing ? 'border-solid border-accent text-accent' : `border-border text-text-dim${disabled ? '' : ' hover:border-accent hover:text-text'}`
          }`}
        >
          {label}
        </span>
        {/* The scrub label carries the name for the drag affordance; the number
            field is a separate control and needs its own. */}
        <input
          type="number" step={1} value={Math.round(value)}
          aria-label={inputLabel}
          min={min} max={max} disabled={disabled}
          onChange={(e) => commit(Number(e.target.value))}
          className="w-28 min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-1.5 font-sans text-[.84rem] tabular-nums text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="font-mono text-[.68rem] text-text-dim">{unit}</span>
      </div>
      {hint && <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{hint}</p>}
      <p className="m-0 font-mono text-[.66rem] text-text-dim">{read}</p>
    </div>
  );
}
