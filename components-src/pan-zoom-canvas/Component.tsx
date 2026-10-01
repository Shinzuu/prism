import { useCallback, useEffect, useRef, useState } from 'react';

const MIN = 0.35, MAX = 3.5, W = 900, H = 500;

/** A label placed in world space; x and y are px within the 900×500 world. */
export type CanvasNode = { label: string; x: number; y: number };
/** The viewport: scale k, then translation in screen px. */
export type View = { k: number; tx: number; ty: number };

const DEFAULT_NODES: CanvasNode[] = [
  { label: 'Intake', x: 40, y: 40 }, { label: 'Compressor', x: 260, y: 120 },
  { label: 'Combustor', x: 480, y: 60 }, { label: 'Turbine', x: 700, y: 170 },
  { label: 'Afterburner', x: 300, y: 320 }, { label: 'Nozzle', x: 600, y: 400 },
];
const DEFAULT_LINKS = 'M110 60 L300 140 M360 140 L520 80 M580 80 L740 190 M360 150 L340 330 M400 340 L640 415';

export interface PanZoomCanvasProps {
  /** Labels placed in the world. */
  nodes?: CanvasNode[];
  /** SVG path data for the connectors, in world coordinates. */
  links?: string;
  /** Smallest zoom factor. */
  minZoom?: number;
  /** Largest zoom factor. */
  maxZoom?: number;
  /** Text of the fit-to-view button. */
  fitLabel?: string;
  /** Accessible name of the canvas, which should describe the keyboard controls. */
  ariaLabel?: string;
  /** Freezes pan, zoom and the fit button. */
  disabled?: boolean;
  /** Fires after every pan, zoom or fit with the new viewport. */
  onViewChange?: (view: View) => void;
  /** Extra classes for the root element. */
  className?: string;
}

/* The viewport model from design tools. The one thing that makes zoom feel
   right is keeping the point under the cursor fixed. */
export default function PanZoomCanvas({
  nodes = DEFAULT_NODES,
  links = DEFAULT_LINKS,
  minZoom = MIN,
  maxZoom = MAX,
  fitLabel = 'fit',
  ariaLabel = 'Pannable, zoomable canvas. Arrow keys pan, plus and minus zoom, zero resets.',
  disabled = false,
  onViewChange,
  className = '',
}: PanZoomCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const view = useRef({ k: 1, tx: 0, ty: 0 });
  const [, force] = useState(0);
  const panning = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const space = useRef(false);
  const [grabbing, setGrabbing] = useState(false);
  // Read through refs so the stable callbacks below see the latest props.
  const onViewRef = useRef(onViewChange);
  onViewRef.current = onViewChange;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const apply = useCallback(() => {
    force((n) => n + 1);
    onViewRef.current?.({ ...view.current });
  }, []);

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    const r = rootRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = cx - r.left, py = cy - r.top;
    const { k, tx, ty } = view.current;
    // World-space point under the cursor, then translate it back under it.
    const wx = (px - tx) / k, wy = (py - ty) / k;
    const nk = Math.max(minZoom, Math.min(maxZoom, k * factor));
    view.current = { k: nk, tx: px - wx * nk, ty: py - wy * nk };
    apply();
  }, [apply, minZoom, maxZoom]);

  const fit = useCallback(() => {
    const r = rootRef.current?.getBoundingClientRect();
    if (!r) return;
    const k = Math.min(r.width / W, r.height / H) * 0.92;
    view.current = { k, tx: (r.width - W * k) / 2, ty: (r.height - H * k) / 2 };
    apply();
  }, [apply]);

  useEffect(() => { fit(); addEventListener('resize', fit); return () => removeEventListener('resize', fit); }, [fit]);

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    // Non-passive, because the zoom must preventDefault the page scroll.
    const onWheel = (e: WheelEvent) => {
      if (disabledRef.current) return;
      e.preventDefault();
      // Trackpad pinch arrives as a wheel event with ctrlKey set.
      zoomAt(e.clientX, e.clientY, e.ctrlKey ? 1 - e.deltaY * 0.01 : 1 - e.deltaY * 0.0016);
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const { k, tx, ty } = view.current;
  const r = rootRef.current?.getBoundingClientRect();

  return (
    <div
      ref={rootRef}
      tabIndex={disabled ? -1 : 0}
      role="application"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === ' ') { space.current = true; e.preventDefault(); return; }
        const step = e.shiftKey ? 80 : 24;
        const box = rootRef.current!.getBoundingClientRect();
        const mid: [number, number] = [box.left + box.width / 2, box.top + box.height / 2];
        const v = view.current;
        if (e.key === 'ArrowLeft') v.tx += step;
        else if (e.key === 'ArrowRight') v.tx -= step;
        else if (e.key === 'ArrowUp') v.ty += step;
        else if (e.key === 'ArrowDown') v.ty -= step;
        else if (e.key === '+' || e.key === '=') { zoomAt(...mid, 1.2); return; }
        else if (e.key === '-') { zoomAt(...mid, 1 / 1.2); return; }
        else if (e.key === '0') { fit(); return; }
        else return;
        e.preventDefault(); apply();
      }}
      onKeyUp={(e) => { if (e.key === ' ') space.current = false; }}
      className={`pz relative h-[300px] touch-none overflow-hidden rounded-xl border border-border bg-bg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <div
        ref={vpRef}
        // The dot grid belongs to the world, so it pans and scales with it.
        style={{
          backgroundSize: `${22 * k}px ${22 * k}px`,
          backgroundPosition: `${tx}px ${ty}px`,
        }}
        onPointerDown={(e) => {
          if (disabled) return;
          if (e.button !== 1 && e.button !== 0) return;
          if (e.button === 0 && !space.current) return;   // left-drag pans only with space held
          panning.current = true;
          last.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          setGrabbing(true);
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          if (!panning.current) return;
          view.current.tx += e.clientX - last.current.x;
          view.current.ty += e.clientY - last.current.y;
          last.current = { x: e.clientX, y: e.clientY };
          apply();
        }}
        onPointerUp={() => { panning.current = false; setGrabbing(false); }}
        onPointerCancel={() => { panning.current = false; setGrabbing(false); }}
        className={`pz-vp absolute inset-0 ${disabled ? 'cursor-not-allowed' : grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="absolute left-0 top-0 h-[500px] w-[900px] origin-top-left"
             style={{ transform: `translate(${tx}px, ${ty}px) scale(${k})` }}>
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden className="pz-links absolute inset-0 h-[500px] w-[900px]">
            <path d={links} />
          </svg>
          {nodes.map((n) => (
            <div key={n.label} style={{ left: n.x, top: n.y }}
                 className="absolute whitespace-nowrap rounded-lg border border-border bg-surface px-[13px] py-[7px] text-[.8rem]">
              {n.label}
            </div>
          ))}
        </div>
      </div>

      <div className="pz-hud absolute bottom-2 right-2 flex items-center gap-2 rounded-full border border-border px-[9px] py-[5px] font-mono text-[.7rem] tabular-nums text-text-dim">
        <span>{Math.round(k * 100)}%</span>
        <button type="button" onClick={fit} disabled={disabled}
                className="cursor-pointer border-0 bg-transparent p-0 font-mono text-accent underline underline-offset-[3px] hover:opacity-80 active:opacity-60 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {fitLabel}
        </button>
      </div>

      <div aria-hidden className="absolute bottom-2 left-2 h-[50px] w-[90px] rounded-md border border-border bg-[color-mix(in_oklab,var(--raised)_70%,transparent)]">
        <span className="absolute rounded-[3px] border-[1.5px] border-accent"
              style={{
                left: `${Math.max(0, Math.min(100, ((-tx / k) / W) * 100))}%`,
                top: `${Math.max(0, Math.min(100, ((-ty / k) / H) * 100))}%`,
                width: `${Math.min(100, ((r?.width ?? 0) / k / W) * 100)}%`,
                height: `${Math.min(100, ((r?.height ?? 0) / k / H) * 100)}%`,
              }} />
      </div>
    </div>
  );
}
