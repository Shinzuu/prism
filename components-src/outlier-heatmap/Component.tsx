import { useEffect, useMemo, useRef, useState } from 'react';

/** Each dimension name maps to the values a point may hold for it. */
export type Dimensions = Record<string, readonly string[]>;
/** One request: payload size on x, latency on y, plus one string per dimension. */
export type Point = { size: number; ms: number; [dimension: string]: string | number };

const DIMS = {
  region: ['us-east', 'us-west', 'eu-central', 'ap-south'],
  tier: ['free', 'pro', 'enterprise'],
  client: ['web', 'ios', 'android', 'cli'],
  cache: ['hit', 'miss'],
} as const;
const W = 600, H = 260, MAXMS = 820, MAXSIZE = 940;

// Locale-independent, so the default heading reads the same everywhere.
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function makePoints(): Point[] {
  // Deterministic, so the demo tells the same story on every load.
  let seed = 20260928;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]!;
  return Array.from({ length: 1400 }, () => {
    const region = pick(DIMS.region), tier = pick(DIMS.tier), client = pick(DIMS.client), cache = pick(DIMS.cache);
    // The planted truth: ap-south on a cache miss is slow. Nothing says so.
    const slow = region === 'ap-south' && cache === 'miss' && rnd() < 0.72;
    const size = 20 + rnd() * 900;
    return { region, tier, client, cache, size, ms: slow ? 420 + rnd() * 380 : 40 + rnd() * 150 + size * 0.06 };
  });
}

export interface OutlierHeatmapProps {
  /** Points to plot. Defaults to a deterministic demo set with a planted slow cluster. */
  points?: Point[];
  /** Dimensions whose values are ranked by lift. */
  dimensions?: Dimensions;
  /** Payload size at the right edge of the plot. */
  maxSize?: number;
  /** Latency at the top of the plot; slower points are pinned to the edge. */
  maxMs?: number;
  /** Fewest selected points before anything is ranked. */
  minSelection?: number;
  /** How many ranked values to show. */
  topN?: number;
  /** Share of slowest points the keyboard shortcut selects (0–1). */
  keyboardFraction?: number;
  /** Plot heading. */
  title?: string;
  /** Muted text after the heading. Defaults to the point count. */
  subtitle?: string;
  /** Readout before anything is selected. */
  prompt?: string;
  /** Accessible name of the plot. */
  plotLabel?: string;
  /** Shown instead of rankings when too few points are selected. */
  emptyMessage?: string;
  /** Explanatory line under the rankings. Empty string hides it. */
  caption?: string;
  /** Turns off selection by pointer and keyboard. */
  disabled?: boolean;
  /** Fires with the indices of the selected points whenever the selection changes. */
  onSelect?: (indices: number[]) => void;
  /** Extra classes for the root element. */
  className?: string;
}

export default function OutlierHeatmap({
  points,
  dimensions = DIMS,
  maxSize = MAXSIZE,
  maxMs = MAXMS,
  minSelection = 12,
  topN = 4,
  keyboardFraction = 0.1,
  title = 'Request latency',
  subtitle,
  prompt = 'Drag a box around the slow cluster',
  plotLabel = 'Latency scatter. Press Enter to select the slowest tenth of requests.',
  emptyMessage = 'Too few points selected to rank anything honestly.',
  caption = 'Lift is the rate inside the box divided by the rate outside. A tall bar means that value is over-represented among the slow requests.',
  disabled = false,
  onSelect,
  className = '',
}: OutlierHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const pts = useRef<Point[]>([]);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [inside, setInside] = useState<Set<number>>(new Set());
  const [read, setRead] = useState(prompt);

  const data = useMemo(() => points ?? makePoints(), [points]);
  pts.current = data;
  const px = (p: Point) => 8 + (p.size / maxSize) * (W - 16);
  const py = (p: Point) => H - 8 - (Math.min(p.ms, maxMs) / maxMs) * (H - 16);

  const choose = (next: Set<number>) => {
    setInside(next);
    onSelect?.([...next]);
  };

  useEffect(() => {
    const c = canvasRef.current, host = plotRef.current;
    if (!c || !host) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    /* Read the tokens rather than hard-coding, so the canvas follows the
       palette. The fallback is the element's own resolved colour — never a
       literal, which would be a hole straight through the palette rule. */
    const cs = getComputedStyle(host);
    const dim = cs.getPropertyValue('--text-dim').trim() || cs.color;
    const acc = cs.getPropertyValue('--accent').trim() || cs.color;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.current.length; i++) {
      const hit = inside.has(i);
      ctx.fillStyle = hit ? acc : dim;
      ctx.globalAlpha = hit ? 0.9 : inside.size ? 0.16 : 0.34;
      ctx.beginPath();
      ctx.arc(px(pts.current[i]!), py(pts.current[i]!), hit ? 2.4 : 1.8, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // px/py read maxSize and maxMs, so a change of scale must repaint too.
  }, [inside, data, maxSize, maxMs]);

  /* Ranked by LIFT — the rate inside the box divided by the rate outside —
     never by raw count, which just re-ranks the most common values overall. */
  const ranks = (() => {
    if (inside.size < minSelection) return null;
    const rows: { key: string; lift: number }[] = [];
    for (const [dim, values] of Object.entries(dimensions)) {
      for (const value of values) {
        let hitIn = 0, hitOut = 0;
        pts.current.forEach((p, i) => {
          if (p[dim] !== value) return;
          if (inside.has(i)) hitIn++; else hitOut++;
        });
        const rIn = hitIn / inside.size;
        const rOut = hitOut / (pts.current.length - inside.size);
        // Drop values holding too little of the selection, and floor the
        // denominator: a value absent outside would otherwise score infinity.
        if (rIn < 0.08) continue;
        rows.push({ key: `${dim} = ${value}`, lift: rIn / Math.max(rOut, 1 / pts.current.length) });
      }
    }
    return rows.sort((a, b) => b.lift - a.lift).slice(0, topN);
  })();
  const cap = ranks ? Math.max(...ranks.map((r) => r.lift), 2) : 2;

  const local = (e: React.PointerEvent) => {
    const r = plotRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, r };
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          {title} <span className="font-normal text-text-dim">{subtitle ?? `— ${thousands(data.length)} requests`}</span>
        </p>
        <p className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">{read}</p>
      </div>

      <div
        ref={plotRef}
        tabIndex={disabled ? -1 : 0}
        role="application"
        aria-label={plotLabel}
        aria-disabled={disabled || undefined}
        className={`relative touch-none overflow-hidden rounded-lg border border-border bg-bg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
        }`}
        onPointerDown={(e) => { if (disabled) return; start.current = local(e); (e.target as HTMLElement).setPointerCapture(e.pointerId); e.preventDefault(); }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const p = local(e);
          const x0 = Math.min(start.current.x, p.x), x1 = Math.max(start.current.x, p.x);
          const y0 = Math.min(start.current.y, p.y), y1 = Math.max(start.current.y, p.y);
          const k = p.r.width / W;
          setSel({ x: x0 * k, y: y0 * k, w: (x1 - x0) * k, h: (y1 - y0) * k });
          const next = new Set<number>();
          pts.current.forEach((pt, i) => {
            const cx = px(pt), cy = py(pt);
            if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) next.add(i);
          });
          choose(next);
          setRead(`${next.size} of ${pts.current.length} selected`);
        }}
        onPointerUp={() => { start.current = null; }}
        onKeyDown={(e) => {
          if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          const sorted = [...pts.current].sort((a, b) => b.ms - a.ms);
          const cut = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * keyboardFraction))]?.ms;
          if (cut === undefined) return;
          const next = new Set<number>();
          pts.current.forEach((p, i) => { if (p.ms >= cut) next.add(i); });
          setSel(null); choose(next);
          setRead(`${next.size} slowest requests selected`);
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} role="img"
                aria-label="Scatter of request latency against payload size"
                className="block h-auto w-full" />
        {sel && (
          <div className="pointer-events-none absolute rounded-sm border border-accent bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
               style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }} />
        )}
      </div>

      <ol aria-live="polite" className="m-0 grid min-h-[4.2rem] list-none gap-1 p-0">
        {ranks === null ? (
          <li><p className="m-0 text-[.72rem] text-text-dim">{emptyMessage}</p></li>
        ) : ranks.map((r) => (
          <li key={r.key} className="grid grid-cols-[8.5rem_1fr_3.2rem] items-center gap-2 text-[.7rem]">
            <span className="truncate font-mono text-[.66rem] text-text-dim">{r.key}</span>
            <span className="h-2 overflow-hidden rounded bg-[color-mix(in_oklab,var(--border)_60%,transparent)]">
              <i className="block h-full rounded bg-accent" style={{ width: `${Math.round((r.lift / cap) * 100)}%` }} />
            </span>
            <span className="text-right font-mono text-[.66rem] tabular-nums">{r.lift.toFixed(1)}×</span>
          </li>
        ))}
      </ol>

      {caption && (
        <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
          {caption}
        </p>
      )}
    </div>
  );
}
