import { useRef, useState } from 'react';

export default function PressureSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);
  const counts = useRef({ samples: 0, frames: 0 });
  const [meta, setMeta] = useState('draw to measure sampling');

  const hint = typeof PointerEvent !== 'undefined' && 'getCoalescedEvents' in PointerEvent.prototype
    ? 'Pressure from a stylus; speed stands in for a mouse.'
    : 'Coalesced events unavailable — stroke will be coarser.';

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    // The canvas is CSS-scaled, so pointer coordinates need the same scale —
    // without this the ink lands offset, increasingly so toward the edges.
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  /* A mouse reports a constant 0.5 while down; only a pen reports a continuum.
     Applying e.pressure unconditionally makes the feature look broken on the
     hardware most people have, so speed stands in instead. */
  const widthFor = (e: PointerEvent, p: { x: number; y: number }, prev: { x: number; y: number } | null) => {
    if (e.pointerType === 'pen' && e.pressure > 0) {
      const tilt = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 90);
      return 0.8 + e.pressure * 7 * (1 - tilt * 0.35);
    }
    if (!prev) return 2.6;
    const d = Math.hypot(p.x - prev.x, p.y - prev.y);
    return Math.max(1, 5.2 - d * 0.16);      // faster stroke, thinner line
  };

  const stroke = (e: PointerEvent) => {
    const c = canvasRef.current, host = rootRef.current;
    if (!c || !host) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const p = toLocal(e);
    const w = widthFor(e, p, last.current);
    if (last.current) {
      // Read the ink from the token, so the signature follows the theme.
      ctx.strokeStyle = getComputedStyle(host).getPropertyValue('--text').trim() || getComputedStyle(host).color;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    last.current = p;
    counts.current.samples++;
  };

  return (
    <div ref={rootRef} className="grid gap-2">
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">Sign here</p>
        <p className="m-0 font-mono text-[.64rem] tabular-nums text-text-dim">{meta}</p>
      </div>

      <canvas
        ref={canvasRef}
        width={1040}
        height={300}
        role="img"
        aria-label="Signature area. Draw with a mouse, finger or stylus."
        className="block h-auto w-full cursor-crosshair touch-none rounded-[9px] border border-border bg-bg"
        onPointerDown={(e) => {
          drawing.current = true;
          last.current = null;
          e.currentTarget.setPointerCapture(e.pointerId);
          stroke(e.nativeEvent);
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          counts.current.frames++;
          /* The whole reason this exists. A pointermove arrives about once per
             frame while the digitiser samples far faster; without the coalesced
             list the stroke is one straight segment per frame. */
          const native = e.nativeEvent;
          const batch = native.getCoalescedEvents ? native.getCoalescedEvents() : [native];
          for (const s of batch.length ? batch : [native]) stroke(s);
          const { samples, frames } = counts.current;
          const ratio = samples / Math.max(frames, 1);
          setMeta(`${samples} samples / ${frames} frames · ${ratio.toFixed(1)}× per frame` +
            (ratio < 1.35 ? ' — this pointer has no extra samples to coalesce' : ' — extra samples recovered'));
        }}
        onPointerUp={() => { drawing.current = false; last.current = null; }}
        onPointerCancel={() => { drawing.current = false; last.current = null; }}
        onPointerLeave={() => { drawing.current = false; last.current = null; }}
      />

      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => {
            const c = canvasRef.current;
            c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
            counts.current = { samples: 0, frames: 0 };
            setMeta('draw to measure sampling');
          }}
          className="cursor-pointer rounded-[7px] border border-border bg-raised px-3 py-1.5 font-sans text-[.74rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Clear
        </button>
        <span className="text-[.68rem] text-text-dim">{hint}</span>
      </div>
    </div>
  );
}
