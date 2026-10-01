import { useRef, useState } from 'react';

export type Box = { x: number; y: number; w: number; h: number };
export type LabelledBox = Box & { label: string };
const DEFAULT_BLOCKS: LabelledBox[] = [
  { label: 'Header', x: 24, y: 22, w: 92, h: 54 },
  { label: 'Media', x: 150, y: 22, w: 92, h: 54 },
  { label: 'Aside', x: 276, y: 22, w: 92, h: 54 },
];
const DEFAULT_LIVE: Box = { x: 120, y: 120, w: 104, h: 58 };

type Line = { x1: number; y1: number; x2: number; y2: number; gap?: boolean };

export interface SnapGuideCanvasProps {
  /** Fixed blocks the live block snaps against, in stage pixels. */
  blocks?: LabelledBox[];
  /** Starting position and size of the draggable block, in stage pixels. */
  liveBlock?: Box;
  /** Text on the draggable block. */
  liveLabel?: string;
  /** Px of tolerance before a snap candidate is considered. */
  snapTolerance?: number;
  /** Px moved per arrow key press. */
  keyStep?: number;
  /** Px moved per arrow key press with Shift held. */
  shiftStep?: number;
  /** Readout shown before the block is first moved. */
  hint?: string;
  /** Accessible name of the draggable block. */
  ariaLabel?: string;
  /** Locks the block in place: no drag, no keyboard moves, out of the tab order. */
  disabled?: boolean;
  /** Fired after each move, with the snapped position and the snaps that applied (empty if none). */
  onMove?: (pos: { x: number; y: number }, snaps: string) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function SnapGuideCanvas({
  blocks: STATIC = DEFAULT_BLOCKS,
  liveBlock: LIVE = DEFAULT_LIVE,
  liveLabel = 'Drag me',
  snapTolerance: SNAP = 5,
  keyStep = 1,
  shiftStep = 10,
  hint = 'Drag the block — guides appear when it lines up with its neighbours.',
  ariaLabel = 'Draggable block. Arrow keys move it, Shift for larger steps.',
  disabled = false,
  onMove,
  className = '',
}: SnapGuideCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: LIVE.x, y: LIVE.y });
  const [lines, setLines] = useState<Line[]>([]);
  const [labels, setLabels] = useState<{ x: number; y: number; text: string }[]>([]);
  const [read, setRead] = useState(hint);
  const grab = useRef<{ dx: number; dy: number } | null>(null);

  /* Candidates are collected first and the closest wins PER AXIS. Applying
     each as it is found lets two near-misses both apply and drags the block
     somewhere neither of them asked for. */
  const resolve = (x: number, y: number) => {
    const stage = stageRef.current!;
    const me = { x, y, w: LIVE.w, h: LIVE.h, cx: x + LIVE.w / 2, cy: y + LIVE.h / 2, r: x + LIVE.w, b: y + LIVE.h };
    let bestX: { d: number; target: number; kind: string } | null = null;
    let bestY: { d: number; target: number; kind: string } | null = null;
    const tryX = (mine: number, target: number, kind: string) => {
      const d = target - mine;
      if (Math.abs(d) <= SNAP && (!bestX || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, target, kind };
    };
    const tryY = (mine: number, target: number, kind: string) => {
      const d = target - mine;
      if (Math.abs(d) <= SNAP && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, target, kind };
    };

    for (const o of STATIC) {
      const ob = { x: o.x, r: o.x + o.w, cx: o.x + o.w / 2, y: o.y, b: o.y + o.h, cy: o.y + o.h / 2 };
      tryX(me.x, ob.x, 'left'); tryX(me.r, ob.r, 'right'); tryX(me.cx, ob.cx, 'centre');
      tryX(me.x, ob.r, 'edge'); tryX(me.r, ob.x, 'edge');
      tryY(me.y, ob.y, 'top'); tryY(me.b, ob.b, 'bottom'); tryY(me.cy, ob.cy, 'middle');
      tryY(me.y, ob.b, 'edge'); tryY(me.b, ob.y, 'edge');
    }

    /* Equal spacing: the gap between each adjacent pair, offered again on
       either side of it. Matching positions alone lets a block sit flush while
       the gaps around it are 24, 24 and 9 — aligned but arrhythmic. */
    const row = [...STATIC].sort((a, b) => a.x - b.x);
    for (let i = 0; i < row.length - 1; i++) {
      const gap = row[i + 1]!.x - (row[i]!.x + row[i]!.w);
      if (gap <= 0) continue;
      tryX(me.x, row[i + 1]!.x + row[i + 1]!.w + gap, `gap ${Math.round(gap)}`);
      tryX(me.r, row[i]!.x - gap, `gap ${Math.round(gap)}`);
    }

    const bx = bestX as { d: number; target: number; kind: string } | null;
    const by = bestY as { d: number; target: number; kind: string } | null;
    const nx = bx ? x + bx.d : x;
    const ny = by ? y + by.d : y;
    const ls: Line[] = [];
    const lb: { x: number; y: number; text: string }[] = [];
    if (bx) {
      const v = bx.kind === 'centre' ? nx + LIVE.w / 2 : bx.target;
      ls.push({ x1: v, y1: 0, x2: v, y2: stage.clientHeight, gap: bx.kind.startsWith('gap') });
      if (bx.kind.startsWith('gap')) lb.push({ x: v, y: 11, text: bx.kind });
    }
    if (by) {
      const v = by.kind === 'middle' ? ny + LIVE.h / 2 : by.target;
      ls.push({ x1: 0, y1: v, x2: stage.clientWidth, y2: v });
    }
    return { x: nx, y: ny, lines: ls, labels: lb, said: [bx?.kind, by?.kind].filter(Boolean).join(' · ') };
  };

  const place = (x: number, y: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    // Clamp BEFORE snapping, or a snap can push the block outside.
    const cx = Math.max(0, Math.min(stage.clientWidth - LIVE.w, x));
    const cy = Math.max(0, Math.min(stage.clientHeight - LIVE.h, y));
    const r = resolve(cx, cy);
    setPos({ x: r.x, y: r.y });
    setLines(r.lines); setLabels(r.labels);
    setRead(r.said || `${Math.round(r.x)}, ${Math.round(r.y)}`);
    onMove?.({ x: r.x, y: r.y }, r.said);
  };

  const block = 'absolute left-0 top-0 grid place-items-center rounded-[7px] border text-[.7rem]';

  return (
    <div className={`grid gap-2 ${className}`}>
      <div ref={stageRef} className="relative h-[210px] touch-none overflow-hidden rounded-[10px] border border-border bg-bg">
        {STATIC.map((b) => (
          <div key={b.label}
            className={`${block} border-border bg-raised text-text-dim`}
            style={{ width: b.w, height: b.h, translate: `${b.x}px ${b.y}px` }}>
            {b.label}
          </div>
        ))}

        <div
          tabIndex={disabled ? -1 : 0}
          role="application"
          aria-label={ariaLabel}
          aria-disabled={disabled || undefined}
          className={`${block} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab'} border-[color-mix(in_oklab,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklab,var(--accent)_9%,var(--raised))] text-text ${disabled ? '' : 'hover:border-accent active:cursor-grabbing '}focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
          style={{ width: LIVE.w, height: LIVE.h, translate: `${pos.x}px ${pos.y}px` }}
          onPointerDown={(e) => {
            if (disabled) return;
            const s = stageRef.current!.getBoundingClientRect();
            grab.current = { dx: e.clientX - s.left - pos.x, dy: e.clientY - s.top - pos.y };
            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
          }}
          onPointerMove={(e) => {
            if (!grab.current) return;
            const s = stageRef.current!.getBoundingClientRect();
            place(e.clientX - s.left - grab.current.dx, e.clientY - s.top - grab.current.dy);
          }}
          onPointerUp={() => { grab.current = null; setLines([]); setLabels([]); }}
          onPointerCancel={() => { grab.current = null; setLines([]); setLabels([]); }}
          onKeyDown={(e) => {
            if (disabled) return;
            const step = e.shiftKey ? shiftStep : keyStep;
            const map: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
            };
            const d = map[e.key];
            if (!d) return;
            e.preventDefault();
            place(pos.x + d[0], pos.y + d[1]);
          }}
        >
          {liveLabel}
        </div>

        {/* Guides clear on drop — ones that persist read as a rendering bug. */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full"
             viewBox={`0 0 ${stageRef.current?.clientWidth ?? 520} ${stageRef.current?.clientHeight ?? 210}`}>
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className={`sgc-line ${l.gap ? 'sgc-gap' : ''}`} />
          ))}
          {labels.map((t, i) => (
            <text key={i} x={t.x} y={t.y} textAnchor="middle" className="sgc-label">{t.text}</text>
          ))}
        </svg>
      </div>
      <p aria-live="polite" className="m-0 font-mono text-[.72rem] text-text-dim">{read}</p>
    </div>
  );
}
