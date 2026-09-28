import { useEffect, useRef, useState } from 'react';

export default function InfiniteDragField() {
  const [value, setValue] = useState(0);
  const [read, setRead] = useState('');
  const [scrubbing, setScrubbing] = useState(false);
  const scrubRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const locked = useRef(false);
  const acc = useRef(0);

  useEffect(() => {
    setRead('requestPointerLock' in Element.prototype ? 'Pointer Lock available' : 'Pointer Lock unavailable — edge-limited fallback');
  }, []);

  useEffect(() => {
    /* movementX is the only delta that survives Pointer Lock: once the cursor
       is hidden it stops moving, so clientX freezes and a clientX-based
       scrubber dies the instant the lock engages. */
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const gear = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      acc.current += (e.movementX || 0) * gear;
      const step = Math.trunc(acc.current);
      if (!step) return;
      acc.current -= step;
      setValue((v) => v + step);
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
    const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setValue((v) => v + step);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setValue((v) => v - step);
    else if (e.key === 'Home') setValue(0);
    else return;
    e.preventDefault();
    setRead(`keyboard · step ${step}`);
  };

  return (
    <div className={`grid gap-2 ${scrubbing ? 'cursor-ew-resize' : ''}`}>
      <div className="flex items-center gap-2">
        <span
          ref={scrubRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={-9999}
          aria-valuemax={9999}
          aria-valuenow={Math.round(value)}
          aria-label="Offset X, drag to scrub or use arrow keys"
          onPointerDown={down}
          onKeyDown={key}
          className={`idf-lab cursor-ew-resize touch-none select-none whitespace-nowrap rounded-md border border-dashed bg-raised px-2 py-[5px] text-[.74rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
            scrubbing ? 'border-solid border-accent text-accent' : 'border-border text-text-dim'
          }`}
        >
          Offset X
        </span>
        <input
          type="number" step={1} value={Math.round(value)}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-28 min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-1.5 font-sans text-[.84rem] tabular-nums text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
        />
        <span className="font-mono text-[.68rem] text-text-dim">px</span>
      </div>
      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Drag the label sideways. The pointer is captured and hidden, wraps at the screen edge, and
        never runs out of room.
      </p>
      <p className="m-0 font-mono text-[.66rem] text-text-dim">{read}</p>
    </div>
  );
}
