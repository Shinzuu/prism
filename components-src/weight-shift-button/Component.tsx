import { useEffect, useRef, useState } from 'react';

export interface WeightShiftButtonProps {
  /** Text on the button. */
  label?: string;
  /** Readout shown before the axes are first sampled. */
  initialReadout?: string;
  /** Explanatory note under the readout. */
  description?: string;
  /** Disables the button so it can no longer be held. */
  disabled?: boolean;
  /** Fired when the press starts, by pointer or by Space/Enter. */
  onHoldStart?: () => void;
  /** Fired when a press is released, cancelled or loses focus. */
  onHoldEnd?: () => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function WeightShiftButton({
  label = 'Hold to confirm',
  initialReadout = 'Press and hold.',
  description = "The letterforms thicken and widen on the font's own axes — the type is redrawn, not scaled, so the strokes gain weight while the counters stay open.",
  disabled = false,
  onHoldStart,
  onHoldEnd,
  className = '',
}: WeightShiftButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [readout, setReadout] = useState(initialReadout);
  const [held, setHeld] = useState(false);
  const [released, setReleased] = useState(false);

  /* The motion is entirely CSS — both axes are registered with @property in the
     stylesheet, without which the transition is accepted, throws nothing, and
     does nothing. This only samples the live values so they are legible. */
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    let raf = 0;
    let running = false;

    const sample = () => {
      const cs = getComputedStyle(el);
      const w = parseFloat(cs.getPropertyValue('--wsb-wght'));
      const d = parseFloat(cs.getPropertyValue('--wsb-wdth'));
      setReadout(
        `wght ${Number.isFinite(w) ? w.toFixed(0) : '—'} · wdth ${Number.isFinite(d) ? d.toFixed(0) : '—'}`
      );
      raf = requestAnimationFrame(sample);
    };

    // Never sample off-screen.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        cancelAnimationFrame(raf);
        if (e.isIntersecting && !running) { running = true; sample(); }
        else if (!e.isIntersecting) running = false;
      }
    }, { rootMargin: '60px' });
    io.observe(el);

    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const hold = () => {
    if (disabled || held) return;
    setReleased(false); setHeld(true);
    onHoldStart?.();
  };
  const release = () => {
    if (!held) return;
    setHeld(false);
    onHoldEnd?.();
    // Undershoot past rest, then settle — a spring, not a fade.
    setReleased(true);
    setTimeout(() => setReleased(false), 170);
  };

  return (
    <div className={`grid justify-items-start gap-[9px] ${className}`}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        data-holding={held ? '' : undefined}
        data-released={released ? '' : undefined}
        onPointerDown={(e) => { if (disabled) return; e.currentTarget.setPointerCapture(e.pointerId); hold(); }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') hold(); }}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') release(); }}
        onBlur={release}
        className="wsb-btn cursor-pointer rounded-[10px] border border-border bg-raised px-[22px] py-[13px] text-[1.1rem] text-text hover:border-text-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border"
      >
        <span className="inline-block">{label}</span>
      </button>

      <p aria-live="polite" className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">
        {readout}
      </p>
      <p className="m-0 max-w-[34ch] text-[.72rem] leading-relaxed text-text-dim">
        {description}
      </p>
    </div>
  );
}
