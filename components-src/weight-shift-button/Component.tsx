import { useEffect, useRef, useState } from 'react';

export default function WeightShiftButton() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [readout, setReadout] = useState('Press and hold.');
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

  const hold = () => { setReleased(false); setHeld(true); };
  const release = () => {
    if (!held) return;
    setHeld(false);
    // Undershoot past rest, then settle — a spring, not a fade.
    setReleased(true);
    setTimeout(() => setReleased(false), 170);
  };

  return (
    <div className="grid justify-items-start gap-[9px]">
      <button
        ref={btnRef}
        type="button"
        data-holding={held ? '' : undefined}
        data-released={released ? '' : undefined}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); hold(); }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') hold(); }}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') release(); }}
        onBlur={release}
        className="wsb-btn cursor-pointer rounded-[10px] border border-border bg-raised px-[22px] py-[13px] text-[1.1rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"
      >
        <span className="inline-block">Hold to confirm</span>
      </button>

      <p aria-live="polite" className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">
        {readout}
      </p>
      <p className="m-0 max-w-[34ch] text-[.72rem] leading-relaxed text-text-dim">
        The letterforms thicken and widen on the font's own axes — the type is redrawn, not scaled,
        so the strokes gain weight while the counters stay open.
      </p>
    </div>
  );
}
